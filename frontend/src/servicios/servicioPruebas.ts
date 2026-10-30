import type { ResumenGeneral } from "../tipos";
import { obtenerSesion } from "../almacen/almacenSesion";
import { obtenerResumenesEjemplo } from "./servicioResumen";
import { enviarJson, ErrorApi } from "./clienteApi";
import { pruebasPasadas, type PruebaPasada } from "../datos/pruebas";
import { retardoSimulado } from "../utilidades/retardoSimulado";
import { CANTIDADES_PREGUNTAS, OPCIONES_TIEMPO, ajustesPorDefecto } from "../utilidades/constructorPruebas";
import type {
  AjustesPrueba,
  ItemRevision,
  MapaDescartes,
  MapaRespuestas,
  PreguntaExamen,
  PruebaPublica,
  RespuestaPrueba,
  ResultadoCompleto,
  ResultadoPrueba,
  TiempoPrueba,
} from "../tipos/prueba";

// -----------------------------------------------------------------------
// Servicio de Pruebas.
// Frontend → POST /api/pruebas/* (FastAPI) → OpenAI. El servidor genera las preguntas
// a partir del resumen general, lleva el reloj, califica y entrega los resultados.
// Aquí solo se traduce el contrato (snake_case) y se guarda lo mínimo en localStorage
// (así sobrevive a recargas y a otra pestaña): el sello (estado cifrado), las respuestas y las marcas.
// Las preguntas NUNCA se guardan en el navegador: se piden al servidor al reanudar.
// -----------------------------------------------------------------------

const TIEMPO_GENERACION_MS = 150_000;
const TIEMPO_NORMAL_MS = 30_000;

// --- Contrato del servidor (snake_case) ------------------------------------------------------

interface PreguntaApi {
  id: string;
  enunciado: string;
  opciones: { id: string; texto: string }[];
  dificultad: PreguntaExamen["dificultad"];
  puntos: number;
  terminos?: { inicio: number; fin: number; definicion: string }[];
}

interface PruebaApi {
  id: string;
  id_tema: string;
  titulo_tema: string;
  estado: PruebaPublica["estado"];
  total: number;
  dificultad: PruebaPublica["dificultad"];
  distribucion: PruebaPublica["distribucion"];
  limite_segundos: number | null;
  puntaje_maximo: number;
  modo_asistido: boolean;
  pausa_blindada: boolean;
  cronometro_visible: boolean;
  modelo: string;
  respuestas: MapaRespuestas;
  descartes: MapaDescartes;
  preguntas: PreguntaApi[] | null;
}

interface TiempoApi {
  estado: TiempoPrueba["estado"];
  limite_segundos: number | null;
  restante_segundos: number | null;
  transcurrido_segundos: number;
  vencida: boolean;
}

interface RespuestaApi {
  sello: string;
  prueba: PruebaApi;
  /** `crear` no lo incluye: la prueba todavía no ha empezado. */
  tiempo?: TiempoApi;
}

interface RendimientoApi {
  total: number;
  correctas: number;
  omitidas: number;
  obtenidos: number;
  max: number;
  porcentaje: number;
}

interface ResultadoApi {
  resultado: {
    id_prueba: string;
    id_tema: string;
    total_preguntas: number;
    correctas: number;
    incorrectas: number;
    omitidas: number;
    puntaje: number;
    puntaje_maximo: number;
    porcentaje: number;
    duracion_segundos: number;
    tiempo_agotado: boolean;
    por_dificultad: Record<"facil" | "media" | "dificil", RendimientoApi>;
    conceptos_debiles: { termino: string; falladas: number; total: number }[];
    configuracion: {
      cantidad_preguntas: number;
      dificultad: ResultadoPrueba["configuracion"]["dificultad"];
      distribucion: ResultadoPrueba["configuracion"]["distribucion"];
      limite_segundos: number | null;
      modo_asistido: boolean;
      pausa_blindada: boolean;
    };
  };
  revision: {
    id: string;
    enunciado: string;
    dificultad: ItemRevision["dificultad"];
    puntos: number;
    opciones: { id: string; texto: string }[];
    id_seleccionada: string | null;
    id_correcta: string;
    ids_descartadas: string[];
    estado: ItemRevision["estado"];
    explicacion: string;
    fundamento: string;
    conceptos: string[];
  }[];
}

// --- Traducción --------------------------------------------------------------------------------

function aPrueba(p: PruebaApi): PruebaPublica {
  return {
    id: p.id,
    idTema: p.id_tema,
    tituloTema: p.titulo_tema,
    estado: p.estado,
    total: p.total,
    dificultad: p.dificultad,
    distribucion: p.distribucion,
    limiteSegundos: p.limite_segundos,
    puntajeMaximo: p.puntaje_maximo,
    modoAsistido: p.modo_asistido,
    pausaBlindada: p.pausa_blindada,
    cronometroVisible: p.cronometro_visible,
    modelo: p.modelo,
    respuestas: p.respuestas ?? {},
    descartes: p.descartes ?? {},
    preguntas: p.preguntas ? p.preguntas.map((q) => ({ ...q, terminos: q.terminos ?? [] })) : null,
  };
}

function aRespuesta(r: RespuestaApi): RespuestaPrueba {
  // Sin `tiempo` (recién creada) el reloj no corre: queda todo el límite y nada transcurrido.
  const t: TiempoApi = r.tiempo ?? {
    estado: r.prueba.estado,
    limite_segundos: r.prueba.limite_segundos,
    restante_segundos: r.prueba.limite_segundos,
    transcurrido_segundos: 0,
    vencida: false,
  };
  return {
    sello: r.sello,
    prueba: aPrueba(r.prueba),
    tiempo: {
      estado: t.estado,
      limiteSegundos: t.limite_segundos,
      restanteSegundos: t.restante_segundos,
      transcurridoSegundos: t.transcurrido_segundos,
      vencida: t.vencida,
    },
  };
}

function aResultado(r: ResultadoApi): ResultadoCompleto {
  const x = r.resultado;
  const nivel = (n: RendimientoApi) => ({ ...n });
  return {
    resultado: {
      idPrueba: x.id_prueba,
      idTema: x.id_tema,
      totalPreguntas: x.total_preguntas,
      correctas: x.correctas,
      incorrectas: x.incorrectas,
      omitidas: x.omitidas,
      puntaje: x.puntaje,
      puntajeMaximo: x.puntaje_maximo,
      porcentaje: x.porcentaje,
      duracionSegundos: x.duracion_segundos,
      tiempoAgotado: x.tiempo_agotado,
      porDificultad: { facil: nivel(x.por_dificultad.facil), media: nivel(x.por_dificultad.media), dificil: nivel(x.por_dificultad.dificil) },
      conceptosDebiles: x.conceptos_debiles,
      configuracion: {
        cantidadPreguntas: x.configuracion.cantidad_preguntas,
        dificultad: x.configuracion.dificultad,
        distribucion: x.configuracion.distribucion,
        limiteSegundos: x.configuracion.limite_segundos,
        modoAsistido: x.configuracion.modo_asistido,
        pausaBlindada: x.configuracion.pausa_blindada,
      },
    },
    revision: r.revision.map((i) => ({
      id: i.id,
      enunciado: i.enunciado,
      dificultad: i.dificultad,
      puntos: i.puntos,
      opciones: i.opciones,
      idSeleccionada: i.id_seleccionada,
      idCorrecta: i.id_correcta,
      idsDescartadas: i.ids_descartadas,
      estado: i.estado,
      explicacion: i.explicacion,
      fundamento: i.fundamento,
      conceptos: i.conceptos,
    })),
  };
}

// --- Resumen de origen -------------------------------------------------------------------------

/** Resumen general del tema: el generado en la sesión o, en los temas demo, el de ejemplo. */
export function obtenerResumenGeneral(idTema: string): ResumenGeneral | null {
  const generado = obtenerSesion().resumenes[idTema] ?? obtenerResumenesEjemplo(idTema);
  const general = generado?.general;
  if (!general) return null;
  const tieneTexto = general.introduccion.trim() || general.secciones.some((s) => s.contenido.trim() || s.puntos.length > 0 || s.tabla);
  return tieneTexto ? general : null;
}

// --- Llamadas ----------------------------------------------------------------------------------

export function idSolicitudNuevo(): string {
  const azar = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `sol-${azar}`;
}

export interface EntradaCrear {
  idSolicitud: string;
  idTema: string;
  tituloTema: string;
  resumen: ResumenGeneral;
  ajustes: AjustesPrueba;
}

/** Crea la prueba (genera las preguntas con IA). Repetir el mismo `idSolicitud` no vuelve a generar. */
export async function crearPrueba(entrada: EntradaCrear, senal?: AbortSignal): Promise<RespuestaPrueba> {
  const { ajustes } = entrada;
  const cuerpo = {
    id_solicitud: entrada.idSolicitud,
    id_tema: entrada.idTema,
    titulo_tema: entrada.tituloTema,
    resumen: {
      titulo: entrada.resumen.titulo,
      introduccion: entrada.resumen.introduccion,
      secciones: entrada.resumen.secciones.map((s) => ({
        titulo: s.titulo,
        contenido: s.contenido,
        puntos: s.puntos,
        tabla: s.tabla ? { titulo: s.tabla.titulo ?? "", encabezados: s.tabla.encabezados, filas: s.tabla.filas } : null,
      })),
    },
    configuracion: {
      cantidad_preguntas: ajustes.cantidad,
      dificultad: ajustes.dificultad,
      distribucion_personalizada: ajustes.dificultad === "personalizada" ? ajustes.personalizada : null,
      limite_minutos: ajustes.limiteMinutos,
      modo_asistido: ajustes.modoAsistido,
      pausa_blindada: ajustes.pausaBlindada,
      cronometro_visible: ajustes.cronometroVisible,
    },
  };
  return aRespuesta(await enviarJson<RespuestaApi>("/api/pruebas/crear", cuerpo, { senal, tiempoEsperaMs: TIEMPO_GENERACION_MS }));
}

const llamar = (ruta: string, cuerpo: unknown, senal?: AbortSignal) =>
  enviarJson<RespuestaApi>(`/api/pruebas/${ruta}`, cuerpo, { senal, tiempoEsperaMs: TIEMPO_NORMAL_MS }).then(aRespuesta);

export const iniciarPrueba = (sello: string, senal?: AbortSignal) => llamar("iniciar", { sello }, senal);
export const consultarPrueba = (sello: string, senal?: AbortSignal) => llamar("estado", { sello }, senal);
export const pausarPrueba = (sello: string, respuestas: MapaRespuestas, descartes: MapaDescartes, senal?: AbortSignal) =>
  llamar("pausar", { sello, respuestas, descartes }, senal);
export const reanudarPrueba = (sello: string, senal?: AbortSignal) => llamar("reanudar", { sello }, senal);
export const sincronizarPrueba = (sello: string, respuestas: MapaRespuestas, descartes: MapaDescartes, senal?: AbortSignal) =>
  llamar("sincronizar", { sello, respuestas, descartes }, senal);

export interface RespuestaFinal {
  resultado: ResultadoCompleto;
  sello: string;
}

/** Entrega la prueba: el servidor califica con sus propias claves. Es idempotente (la primera entrega gana). */
export async function finalizarPrueba(sello: string, respuestas: MapaRespuestas, descartes: MapaDescartes, senal?: AbortSignal): Promise<RespuestaFinal> {
  const datos = await enviarJson<ResultadoApi & { sello: string }>("/api/pruebas/finalizar", { sello, respuestas, descartes }, { senal, tiempoEsperaMs: TIEMPO_NORMAL_MS });
  return { resultado: aResultado(datos), sello: datos.sello };
}

export { ErrorApi };

// --- Persistencia (sesión de prueba en localStorage; último resultado en sessionStorage) ------------------------------------------------------------

export interface SesionPrueba {
  idSolicitud: string;
  sello: string;
  respuestas: MapaRespuestas;
  descartes: MapaDescartes;
  marcadas: string[];
  indice: number;
}

const claveSesion = (idTema: string) => `estudioai.sesionPrueba.${idTema}`;
const claveResultado = (idTema: string) => `estudioai.ultimoResultado.${idTema}`;
const claveAjustes = (idTema: string) => `estudioai.ajustesPrueba.${idTema}`;

function leer<T>(clave: string, almacen: Storage = sessionStorage): T | null {
  try {
    const bruto = almacen.getItem(clave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: unknown, almacen: Storage = sessionStorage) {
  try {
    almacen.setItem(clave, JSON.stringify(valor));
  } catch {
    /* no crítico */
  }
}

export function cargarSesionPrueba(idTema: string): SesionPrueba | null {
  const s = leer<SesionPrueba>(claveSesion(idTema), localStorage);
  return s && typeof s.sello === "string" && typeof s.idSolicitud === "string"
    ? { ...s, marcadas: Array.isArray(s.marcadas) ? s.marcadas : [], indice: Number.isInteger(s.indice) ? s.indice : 0, respuestas: s.respuestas ?? {}, descartes: s.descartes ?? {} }
    : null;
}

export const guardarSesionPrueba = (idTema: string, sesion: SesionPrueba) => escribir(claveSesion(idTema), sesion, localStorage);

export function borrarSesionPrueba(idTema: string) {
  try {
    localStorage.removeItem(claveSesion(idTema));
  } catch {
    /* no crítico */
  }
}

export const guardarUltimoResultado = (idTema: string, datos: ResultadoCompleto) => escribir(claveResultado(idTema), datos);
export const cargarUltimoResultado = (idTema: string) => leer<ResultadoCompleto>(claveResultado(idTema));

/** Ajustes usados por última vez en este tema (localStorage: son preferencias, no datos de la prueba). */
export function cargarAjustes(idTema: string): AjustesPrueba {
  const base = ajustesPorDefecto();
  const g = leer<Partial<AjustesPrueba>>(claveAjustes(idTema), localStorage);
  if (!g) return base;
  const cantidadValida = (CANTIDADES_PREGUNTAS as readonly number[]).includes(g.cantidad as number);
  const tiempoValido = g.limiteMinutos === null || (OPCIONES_TIEMPO as (number | null)[]).includes(g.limiteMinutos as number);
  const dificultadValida = ["facil", "media", "dificil", "personalizada"].includes(g.dificultad as string);
  return {
    ...base,
    cantidad: cantidadValida ? (g.cantidad as number) : base.cantidad,
    dificultad: dificultadValida ? (g.dificultad as AjustesPrueba["dificultad"]) : base.dificultad,
    limiteMinutos: tiempoValido && g.limiteMinutos !== undefined ? g.limiteMinutos : base.limiteMinutos,
    modoAsistido: !!g.modoAsistido,
    pausaBlindada: !!g.pausaBlindada,
    cronometroVisible: g.cronometroVisible !== false,
    // La distribución personalizada guardada solo se conserva si sigue sumando el total; si no, se descarta.
    personalizada:
      g.personalizada && cantidadValida && g.personalizada.facil + g.personalizada.media + g.personalizada.dificil === g.cantidad
        ? g.personalizada
        : base.personalizada,
  };
}

export const guardarAjustes = (idTema: string, ajustes: AjustesPrueba) => escribir(claveAjustes(idTema), ajustes, localStorage);

export async function obtenerPruebasPasadas(): Promise<PruebaPasada[]> {
  return retardoSimulado(pruebasPasadas, 400);
}
