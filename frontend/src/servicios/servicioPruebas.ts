import type { RendimientoDificultad, ConfiguracionPrueba, ResultadoPrueba, DificultadPregunta, IntentoPregunta, PreguntaEstudio, ResumenTema, ConceptoDebil } from "../tipos";
import { configuracionesPruebaPorDefecto, pruebasPasadas, type PruebaPasada } from "../datos/pruebas";
import { retardoSimulado } from "../utilidades/retardoSimulado";
import { DIFICULTADES, CANTIDADES_PREGUNTAS, PESO_PREGUNTA, OPCIONES_TIEMPO, conteosVacios, puntajeMaximoPara } from "../utilidades/constructorPruebas";
import { clasificarPregunta } from "../utilidades/conceptos";
import { formatearSegundos } from "../utilidades/formato";

// -----------------------------------------------------------------------
// Servicio de exámenes.
// A futuro llamará a endpoints como POST /api/exams, POST /api/exams/:id/submit.
// -----------------------------------------------------------------------

const claveConfiguracion = (idTema: string) => `estudioai.configuracionPrueba.${idTema}`;
const claveResultado = (idTema: string) => `estudioai.ultimoResultado.${idTema}`;

function esValido(c: Partial<ConfiguracionPrueba> | null | undefined): c is ConfiguracionPrueba {
  return (
    !!c &&
    (CANTIDADES_PREGUNTAS as readonly number[]).includes(c.cantidadPreguntas as number) &&
    DIFICULTADES.includes(c.dificultad as DificultadPregunta) &&
    OPCIONES_TIEMPO.includes(c.limiteTiempoMinutos as number | null)
  );
}

/** Última configuración usada para el tema, o el valor por defecto. */
export async function obtenerConfiguracionPrueba(idTema: string): Promise<ConfiguracionPrueba> {
  let configuracion: ConfiguracionPrueba = configuracionesPruebaPorDefecto[idTema] ?? { idTema, cantidadPreguntas: 10, dificultad: "media", limiteTiempoMinutos: 15 };
  try {
    const bruto = localStorage.getItem(claveConfiguracion(idTema));
    if (bruto) {
      const guardado = JSON.parse(bruto) as ConfiguracionPrueba;
      if (esValido(guardado)) configuracion = { ...guardado, idTema };
    }
  } catch {
    /* configuración corrupta: se usa la de defecto */
  }
  return retardoSimulado(configuracion, 150);
}

export function guardarConfiguracionPrueba(configuracion: ConfiguracionPrueba) {
  try {
    localStorage.setItem(claveConfiguracion(configuracion.idTema), JSON.stringify(configuracion));
  } catch {
    /* no crítico */
  }
}

export interface EntradaCalificacion {
  preguntas: PreguntaEstudio[];
  intentos: IntentoPregunta[];
  configuracion: ConfiguracionPrueba;
  duracionSegundos: number;
  tiempoAgotado: boolean;
  resumen?: ResumenTema;
}

/** Una pregunta se considera omitida si no tiene respuesta. */
export function estaOmitida(q: PreguntaEstudio, a?: IntentoPregunta): boolean {
  if (!a) return true;
  return q.tipo === "abierta" ? !(a.textoRespuestaAbierta?.trim().length) : !a.idOpcionSeleccionada;
}

export function calificarPrueba({ preguntas, intentos, configuracion, duracionSegundos, tiempoAgotado, resumen }: EntradaCalificacion): ResultadoPrueba {
  const porId = new Map(intentos.map((a) => [a.idPregunta, a]));

  const porNivel: Record<DificultadPregunta, RendimientoDificultad> = {
    facil: { total: 0, correcta: 0, obtenidos: 0, max: 0, porcentaje: 0 },
    media: { total: 0, correcta: 0, obtenidos: 0, max: 0, porcentaje: 0 },
    dificil: { total: 0, correcta: 0, obtenidos: 0, max: 0, porcentaje: 0 },
  };

  let cantidadCorrectas = 0;
  let cantidadOmitidas = 0;
  let puntaje = 0;
  const repaso: string[] = [];
  const falladasPorConcepto = new Map<string, { falladas: number; total: number }>();
  const totalesPorConcepto = new Map<string, number>();

  for (const q of preguntas) {
    const intento = porId.get(q.id);
    const peso = PESO_PREGUNTA[q.dificultad];
    const omitidas = estaOmitida(q, intento);
    const correcta = !omitidas && !!intento?.esCorrecta;
    const subtitulo = clasificarPregunta(q, resumen);

    porNivel[q.dificultad].total += 1;
    porNivel[q.dificultad].max += peso;
    if (subtitulo) totalesPorConcepto.set(subtitulo, (totalesPorConcepto.get(subtitulo) ?? 0) + 1);

    if (correcta) {
      cantidadCorrectas += 1;
      puntaje += peso;
      porNivel[q.dificultad].correcta += 1;
      porNivel[q.dificultad].obtenidos += peso;
    } else {
      repaso.push(q.id);
      if (omitidas) cantidadOmitidas += 1;
      if (subtitulo) {
        const vigente = falladasPorConcepto.get(subtitulo) ?? { falladas: 0, total: 0 };
        falladasPorConcepto.set(subtitulo, { falladas: vigente.falladas + 1, total: 0 });
      }
    }
  }

  for (const nivel of DIFICULTADES) {
    const p = porNivel[nivel];
    p.porcentaje = p.total > 0 ? Math.round((p.obtenidos / p.max) * 100) : 0;
  }

  const conteos = conteosVacios();
  preguntas.forEach((q) => (conteos[q.dificultad] += 1));
  const puntajeMaximo = puntajeMaximoPara(conteos);
  const totalPreguntas = preguntas.length;

  const conceptosDebiles: ConceptoDebil[] = [...falladasPorConcepto.entries()]
    .map(([termino, v]) => ({ termino, falladas: v.falladas, total: totalesPorConcepto.get(termino) ?? v.falladas }))
    .sort((a, b) => b.falladas / b.total - a.falladas / a.total || b.falladas - a.falladas)
    .slice(0, 3);

  return {
    idPrueba: `exam-${Date.now()}`,
    idTema: preguntas[0]?.idTema ?? configuracion.idTema,
    configuracion,
    cantidadCorrectas,
    cantidadIncorrectas: totalPreguntas - cantidadCorrectas - cantidadOmitidas,
    cantidadOmitidas,
    totalPreguntas,
    puntaje,
    puntajeMaximo,
    porcentajePuntaje: puntajeMaximo > 0 ? Math.round((puntaje / puntajeMaximo) * 100) : 0,
    duracionSegundos,
    etiquetaDuracion: formatearSegundos(duracionSegundos),
    tiempoAgotado,
    porDificultad: porNivel,
    conceptosDebiles,
    idsPreguntasRepaso: repaso,
  };
}

export interface ResultadoAlmacenado {
  resultado: ResultadoPrueba;
  preguntas: PreguntaEstudio[];
  intentos: IntentoPregunta[];
}

/** Guarda el último resultado para que /results sobreviva a un refresco. */
export function guardarUltimoResultado(datos: ResultadoAlmacenado) {
  try {
    sessionStorage.setItem(claveResultado(datos.resultado.idTema), JSON.stringify(datos));
  } catch {
    /* no crítico */
  }
}

export function cargarUltimoResultado(idTema: string): ResultadoAlmacenado | null {
  try {
    const bruto = sessionStorage.getItem(claveResultado(idTema));
    return bruto ? (JSON.parse(bruto) as ResultadoAlmacenado) : null;
  } catch {
    return null;
  }
}

export async function obtenerPruebasPasadas(): Promise<PruebaPasada[]> {
  return retardoSimulado(pruebasPasadas, 400);
}

export type MapaRespuestas = Record<string, { idOpcion?: string; textoAbierto?: string }>;

/** Convierte las respuestas del usuario en intentos evaluados. */
export function construirIntentos(preguntas: PreguntaEstudio[], respuestas: MapaRespuestas): IntentoPregunta[] {
  return preguntas.map((q) => {
    const respuesta = respuestas[q.id];
    const esCorrecta = q.tipo === "abierta" ? (respuesta?.textoAbierto?.trim().length ?? 0) > 8 : !!respuesta?.idOpcion && respuesta.idOpcion === q.idOpcionCorrecta;
    return { idPregunta: q.id, idOpcionSeleccionada: respuesta?.idOpcion, textoRespuestaAbierta: respuesta?.textoAbierto, esCorrecta };
  });
}
