import type { DificultadPregunta, PreguntaEstudio } from "../tipos";
import { enviarJson } from "./clienteApi";
import { obtenerResumenGeneral } from "./servicioPruebas";
import { TAMANO_RONDA, cantidadNuevasNecesarias, componerRonda, dificultadSegunNivel, registrarResultado, type HistorialPreguntas } from "../utilidades/rondaPreguntas";
import { ampliarBanco, crearPractica, preguntasPorIds, type EstadoPractica } from "../utilidades/practicaPreguntas";
import { eliminarPractica, guardarPractica, obtenerPractica } from "../almacen/almacenSesion";
import { TIEMPO_ESPERA_DESCARGA_MS } from "../configuracion";
import { descargarArchivo, type ArchivoDescargado } from "./clienteApi";

const TIEMPO_GENERACION_MS = 150_000;
const CANTIDAD_POR_DEFECTO = TAMANO_RONDA;

interface PreguntaApi {
  id: string;
  enunciado: string;
  dificultad: DificultadPregunta;
  opciones: { id: string; texto: string }[];
  correcta: string;
  explicacion: string;
  fundamento: string;
  conceptos: string[];
}

interface RespuestaApi {
  id_tema: string;
  preguntas: PreguntaApi[];
}

export interface OpcionesGeneracion {
  cantidad?: number;
  dificultad?: DificultadPregunta;
  /** Nivel estimado 0-1 (lo aportará MOD-07). */
  nivelEstudiante?: number;
  /** Enunciados ya vistos, para no repetirlos. */
  evitar?: string[];
  senal?: AbortSignal;
  lote?: string;
}

const enVuelo = new Map<string, Promise<PreguntaEstudio[]>>();

const CARACTERES_POR_PREGUNTA = 300; // mismo criterio que el backend
const MAXIMO_PREGUNTAS = 25;

type ResumenGeneral = NonNullable<ReturnType<typeof obtenerResumenGeneral>>;

/** Estimación de los caracteres de texto fuente del resumen. */
function contarCaracteres(r: ResumenGeneral): number {
  let total = (r.titulo ?? "").length + (r.introduccion ?? "").length;
  for (const s of r.secciones ?? []) {
    total += (s.titulo ?? "").length + (s.contenido ?? "").length + (s.puntos ?? []).join(" ").length;
    if (s.tabla) total += s.tabla.filas.map((f) => f.join(" ")).join(" ").length;
  }
  return total;
}

function capacidadDelResumen(r: ResumenGeneral): number {
  return Math.min(MAXIMO_PREGUNTAS, Math.floor(contarCaracteres(r) / CARACTERES_POR_PREGUNTA));
}

/** Indica si el tema tiene un resumen con texto suficiente para generar preguntas con IA. */
export function puedeGenerarConIa(idTema: string): boolean {
  const resumen = obtenerResumenGeneral(idTema);
  return resumen !== null && capacidadDelResumen(resumen) >= 1;
}

export function limpiarPreguntasEnMemoria(idTema?: string) {
  if (idTema) enVuelo.delete(idTema);
  else enVuelo.clear();
  eliminarPractica(idTema);
}

export function iniciarPractica(idTema: string, preguntas: PreguntaEstudio[]): EstadoPractica {
  const existente = obtenerPractica(idTema);
  if (existente) return existente;
  const nueva = crearPractica(preguntas);
  guardarPractica(idTema, nueva);
  return nueva;
}

export function preguntasDeLaRonda(estado: EstadoPractica): PreguntaEstudio[] {
  return preguntasPorIds(estado.banco, estado.idsRonda);
}

function aPreguntaEstudio(idTema: string, p: PreguntaApi, lote?: string): PreguntaEstudio {
  return {
    id: lote ? `${idTema}-${lote}-${p.id}` : `${idTema}-${p.id}`,
    idTema,
    enunciado: p.enunciado,
    tipo: "opcion-multiple",
    dificultad: p.dificultad,
    opciones: p.opciones.map((o) => ({ id: o.id, etiqueta: o.texto })),
    idOpcionCorrecta: p.correcta,
    explicacion: p.explicacion,
  };
}

/** Pide preguntas nuevas al backend. Lanza ErrorApi (con mensaje apto para el usuario) si falla. */
export async function generarPreguntasConIa(idTema: string, titulo: string, opciones: OpcionesGeneracion = {}): Promise<PreguntaEstudio[]> {
  const resumen = obtenerResumenGeneral(idTema);
  if (!resumen) throw new Error("El tema no tiene resumen general.");
  const capacidad = capacidadDelResumen(resumen);
  if (capacidad < 1) throw new Error("El resumen del tema es demasiado breve para generar preguntas.");
  const cuerpo = {
    id_tema: idTema,
    titulo_tema: titulo,
    cantidad: Math.min(opciones.cantidad ?? CANTIDAD_POR_DEFECTO, capacidad),
    dificultad: opciones.dificultad ?? "media",
    nivel_estudiante: opciones.nivelEstudiante ?? null,
    evitar: opciones.evitar ?? [],
    resumen: {
      titulo: resumen.titulo,
      introduccion: resumen.introduccion,
      secciones: resumen.secciones.map((s) => ({
        titulo: s.titulo,
        contenido: s.contenido,
        puntos: s.puntos,
        tabla: s.tabla ? { titulo: s.tabla.titulo ?? "", encabezados: s.tabla.encabezados, filas: s.tabla.filas } : null,
      })),
    },
  };
  const datos = await enviarJson<RespuestaApi>("/api/preguntas/generar", cuerpo, { senal: opciones.senal, tiempoEsperaMs: TIEMPO_GENERACION_MS });
  return datos.preguntas.map((p) => aPreguntaEstudio(idTema, p, opciones.lote));
}

/** Preguntas del tema: memoria → solicitud en curso → backend. Una sola llamada por tema. */
export async function obtenerPreguntasDelTema(idTema: string, titulo: string, opciones: OpcionesGeneracion = {}): Promise<PreguntaEstudio[]> {
  const guardada = obtenerPractica(idTema);
  if (guardada) return preguntasDeLaRonda(guardada);

  let solicitud = enVuelo.get(idTema);
  if (!solicitud) {
    const { senal: _ignorada, ...sinSenal } = opciones; // la solicitud compartida no se cancela por un solo llamador
    solicitud = generarPreguntasConIa(idTema, titulo, sinSenal)
      .then((nuevas) => preguntasDeLaRonda(iniciarPractica(idTema, nuevas)))
      .finally(() => enVuelo.delete(idTema));
    enVuelo.set(idTema, solicitud);
  }

  const senal = opciones.senal;
  if (!senal) return solicitud;
  return new Promise<PreguntaEstudio[]>((resolver, rechazar) => {
    const abortar = () => rechazar(new DOMException("Cancelado", "AbortError"));
    if (senal.aborted) return abortar();
    senal.addEventListener("abort", abortar, { once: true });
    solicitud.then(resolver, rechazar);
  });
}

export function registrarResultadoPregunta(idTema: string, idPregunta: string, correcta: boolean): void {
  const estado = obtenerPractica(idTema);
  if (!estado) return;
  guardarPractica(idTema, {
    ...estado,
    historial: registrarResultado(estado.historial, idPregunta, correcta),
    respondidas: estado.respondidas.includes(idPregunta) ? estado.respondidas : [...estado.respondidas, idPregunta],
  });
}

export function obtenerHistorialPreguntas(idTema: string): HistorialPreguntas {
  return obtenerPractica(idTema)?.historial ?? {};
}

export interface OpcionesRonda {
  total?: number;
  nivelEstudiante?: number;
}

export async function generarSiguienteRonda(idTema: string, titulo: string, opciones: OpcionesRonda = {}): Promise<boolean> {
  const estado = obtenerPractica(idTema);
  if (!estado) return false;
  const total = opciones.total ?? TAMANO_RONDA;
  const { banco, historial } = estado;

  let nuevas: PreguntaEstudio[] = [];
  const necesarias = cantidadNuevasNecesarias(total, banco, historial);
  if (necesarias > 0 && puedeGenerarConIa(idTema)) {
    try {
      nuevas = await generarPreguntasConIa(idTema, titulo, {
        cantidad: necesarias,
        dificultad: dificultadSegunNivel(opciones.nivelEstudiante),
        nivelEstudiante: opciones.nivelEstudiante,
        evitar: banco.map((p) => p.enunciado),
        lote: `r${Date.now().toString(36)}`,
      });
    } catch {
      nuevas = [];
    }
  }

  const ronda = componerRonda({ banco, historial, nuevas, total });
  const ids = ronda.length > 0 ? ronda.map((p) => p.id) : estado.idsRonda;
  const actual = obtenerPractica(idTema) ?? estado;
  guardarPractica(idTema, { ...actual, banco: ampliarBanco(actual.banco, ronda), idsSiguiente: ids });
  return true;
}

export function empezarSiguienteRonda(idTema: string): void {
  const estado = obtenerPractica(idTema);
  if (!estado?.idsSiguiente) return;
  guardarPractica(idTema, { ...estado, ronda: estado.ronda + 1, idsRonda: estado.idsSiguiente, idsSiguiente: null, respondidas: [] });
}

export type FormatoDescargaPreguntas = "pdf" | "docx";
export type ModoRespuestasDescarga = "junto" | "final";

export function descargarPreguntas(
  idTema: string,
  titulo: string,
  formato: FormatoDescargaPreguntas,
  respuestas: ModoRespuestasDescarga,
  senal?: AbortSignal
): Promise<ArchivoDescargado> {
  const estado = obtenerPractica(idTema);
  const preguntas = (estado?.banco ?? []).map((p) => ({
    enunciado: p.enunciado,
    dificultad: p.dificultad,
    opciones: (p.opciones ?? []).map((o) => ({ id: o.id, texto: o.etiqueta })),
    correcta: p.idOpcionCorrecta ?? "",
    respuesta_texto: p.textoRespuestaCorrecta ?? "",
    explicacion: p.explicacion,
  }));
  return descargarArchivo("/api/preguntas/exportar", { titulo_tema: titulo, formato, respuestas, preguntas }, { senal, tiempoEsperaMs: TIEMPO_ESPERA_DESCARGA_MS });
}
