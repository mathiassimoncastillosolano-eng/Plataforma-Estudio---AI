import type { ResumenesGenerados, ResumenTema, TipoResumen } from "../tipos";
import { resumenes as resumenesEjemplo } from "../datos/resumenes";
import { descargarArchivo, enviarArchivo, enviarJson, type ArchivoDescargado } from "./clienteApi";
import { TIEMPO_ESPERA_DESCARGA_MS, TIEMPO_ESPERA_IA_MS, TIEMPO_ESPERA_PDF_IA_MS } from "../configuracion";

// -----------------------------------------------------------------------
// Resúmenes con IA.
// Frontend → POST /api/resumenes (FastAPI) → OpenAI. Una sola llamada devuelve
// el resumen general y el esencial. El frontend nunca habla con OpenAI ni
// conoce ninguna API Key.
// Si el material es un PDF, se envía el archivo ORIGINAL a POST /api/resumenes/pdf
// (la IA analiza texto, tablas y diagramas; no se transcribe antes a texto).
// La descarga en PDF usa el resumen ya generado (POST /api/resumenes/descargar-pdf):
// no vuelve a llamar a la IA.
// -----------------------------------------------------------------------

/** Forma exacta de la respuesta del backend (snake_case). */
interface RespuestaResumenApi {
  resumen_general: {
    titulo: string;
    introduccion: string;
    secciones: { titulo: string; contenido: string; puntos: string[]; tabla?: { titulo: string; encabezados: string[]; filas: string[][] } | null }[];
    minutos_lectura: number;
    notas_de_fidelidad?: string[];
  };
  resumen_esencial: {
    idea_central: string;
    ideas_clave: string[];
    conceptos_clave: { termino: string; definicion: string }[];
    formulas_y_reglas?: { nombre: string; expresion: string; explicacion: string }[];
    notas_de_fidelidad?: string[];
    minutos_lectura: number;
  };
  metadatos: { modelo: string; generado_en: string; caracteres_entrada: number; entrada?: "texto" | "pdf"; paginas?: number | null };
}

function aResumenesGenerados(api: RespuestaResumenApi): ResumenesGenerados {
  const { resumen_general: general, resumen_esencial: esencial, metadatos } = api;
  return {
    general: {
      titulo: general.titulo,
      introduccion: general.introduccion,
      secciones: general.secciones,
      minutosLectura: general.minutos_lectura,
      notasDeFidelidad: general.notas_de_fidelidad ?? [],
    },
    esencial: {
      ideaCentral: esencial.idea_central,
      ideasClave: esencial.ideas_clave,
      conceptosClave: esencial.conceptos_clave,
      minutosLectura: esencial.minutos_lectura,
      formulasYReglas: esencial.formulas_y_reglas ?? [],
      notasDeFidelidad: esencial.notas_de_fidelidad ?? [],
    },
    metadatos: {
      origen: "ia",
      modelo: metadatos.modelo,
      generadoEn: metadatos.generado_en,
      caracteresEntrada: metadatos.caracteres_entrada,
      entrada: metadatos.entrada ?? "texto",
      paginas: metadatos.paginas ?? null,
    },
  };
}

export async function generarResumenes(texto: string, titulo: string, senal?: AbortSignal): Promise<ResumenesGenerados> {
  const respuesta = await enviarJson<RespuestaResumenApi>("/api/resumenes", { texto, titulo }, { senal, tiempoEsperaMs: TIEMPO_ESPERA_IA_MS });
  return aResumenesGenerados(respuesta);
}

/**
 * Genera ambos resúmenes a partir del PDF original. `indicaciones` es el mensaje opcional del
 * estudiante: se usa como contexto del análisis. El archivo no se guarda en el servidor.
 */
export async function generarResumenesDesdePdf(archivo: File, titulo: string, indicaciones: string, senal?: AbortSignal): Promise<ResumenesGenerados> {
  const respuesta = await enviarArchivo<RespuestaResumenApi>("/api/resumenes/pdf", "archivo", archivo, {
    senal,
    tiempoEsperaMs: TIEMPO_ESPERA_PDF_IA_MS,
    campos: { titulo, indicaciones },
  });
  return aResumenesGenerados(respuesta);
}

// --- Descarga en PDF ----------------------------------------------------------

const hayTexto = (valor: string | undefined | null) => Boolean(valor && valor.trim());

/** ¿Hay algo que descargar? Evita pedir un archivo vacío. */
export function resumenTieneContenido(resumenes: ResumenesGenerados | null | undefined, tipo: TipoResumen): boolean {
  if (!resumenes) return false;
  if (tipo === "esencial") {
    const { ideaCentral, ideasClave, conceptosClave } = resumenes.esencial;
    return hayTexto(ideaCentral) || ideasClave.some(hayTexto) || conceptosClave.length > 0;
  }
  return resumenes.general.secciones.some((s) => hayTexto(s.titulo) && hayTexto(s.contenido));
}

function cuerpoDescarga(resumenes: ResumenesGenerados, tipo: TipoResumen, tituloTema: string) {
  const { esencial, general, metadatos } = resumenes;
  const base = {
    tipo,
    titulo_tema: tituloTema,
    origen: metadatos.origen === "ejemplo" ? "Resumen de ejemplo" : "Generado con IA",
    generado_en: metadatos.generadoEn,
  };
  // Solo se envía el resumen pedido: cada botón descarga únicamente el suyo.
  if (tipo === "esencial") {
    return {
      ...base,
      esencial: {
        idea_central: esencial.ideaCentral,
        ideas_clave: esencial.ideasClave,
        conceptos_clave: esencial.conceptosClave,
        formulas_y_reglas: esencial.formulasYReglas ?? [],
        notas_de_fidelidad: esencial.notasDeFidelidad ?? [],
        minutos_lectura: esencial.minutosLectura,
      },
    };
  }
  return {
    ...base,
    general: {
      titulo: general.titulo,
      introduccion: general.introduccion,
      secciones: general.secciones.map((s) => ({ titulo: s.titulo, contenido: s.contenido, puntos: s.puntos, tabla: s.tabla ?? null })),
      notas_de_fidelidad: general.notasDeFidelidad ?? [],
      minutos_lectura: general.minutosLectura,
    },
  };
}

/** Pide al backend el PDF del resumen ya generado (sin llamar a OpenAI) y lo devuelve como archivo. */
export function obtenerPdfResumen(resumenes: ResumenesGenerados, tipo: TipoResumen, tituloTema: string, senal?: AbortSignal): Promise<ArchivoDescargado> {
  return descargarArchivo("/api/resumenes/descargar-pdf", cuerpoDescarga(resumenes, tipo, tituloTema), { senal, tiempoEsperaMs: TIEMPO_ESPERA_DESCARGA_MS });
}

/** Guarda un archivo en el dispositivo mediante un enlace temporal. */
export function guardarArchivo({ blob, nombreArchivo }: ArchivoDescargado) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function minutosLectura(...textos: string[]) {
  const palabras = textos.join(" ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(palabras / 200));
}

/** Convierte un resumen de ejemplo (datos demo) al mismo formato que devuelve el backend. */
function desdeEjemplo(ejemplo: ResumenTema): ResumenesGenerados {
  const { introduccion, conceptosClave, relaciones } = ejemplo.esencial;
  const secciones = ejemplo.completo.secciones.map((s) => ({ titulo: s.subtitulo, contenido: s.cuerpo, puntos: s.puntos ?? [] }));
  return {
    esencial: {
      ideaCentral: introduccion,
      ideasClave: relaciones,
      conceptosClave: conceptosClave.map(({ termino, definicion }) => ({ termino, definicion })),
      minutosLectura: minutosLectura(introduccion, ...relaciones, ...conceptosClave.map((c) => `${c.termino} ${c.definicion}`)),
    },
    general: {
      titulo: "",
      introduccion: "",
      secciones,
      minutosLectura: minutosLectura(...secciones.map((s) => `${s.titulo} ${s.contenido} ${s.puntos.join(" ")}`)),
    },
    metadatos: { origen: "ejemplo", modelo: null, generadoEn: "", caracteresEntrada: 0 },
  };
}

/** Resúmenes de ejemplo incluidos con los temas demo (no generados por IA). */
export function obtenerResumenesEjemplo(idTema: string): ResumenesGenerados | null {
  const ejemplo = resumenesEjemplo[idTema];
  return ejemplo ? desdeEjemplo(ejemplo) : null;
}
