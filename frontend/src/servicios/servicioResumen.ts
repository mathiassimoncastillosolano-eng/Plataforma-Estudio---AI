import type { ResumenesGenerados, ResumenTema } from "../tipos";
import { resumenes as resumenesEjemplo } from "../datos/resumenes";
import { enviarJson } from "./clienteApi";
import { TIEMPO_ESPERA_IA_MS } from "../configuracion";

// -----------------------------------------------------------------------
// Resúmenes con IA.
// Frontend → POST /api/resumenes (FastAPI) → OpenAI. Una sola llamada devuelve
// el resumen general y el esencial. El frontend nunca habla con OpenAI ni
// conoce ninguna API Key.
// -----------------------------------------------------------------------

/** Forma exacta de la respuesta del backend (snake_case). */
interface RespuestaResumenApi {
  resumen_general: {
    titulo: string;
    introduccion: string;
    secciones: { titulo: string; contenido: string; puntos: string[] }[];
    minutos_lectura: number;
  };
  resumen_esencial: {
    idea_central: string;
    ideas_clave: string[];
    conceptos_clave: { termino: string; definicion: string }[];
    minutos_lectura: number;
  };
  metadatos: { modelo: string; generado_en: string; caracteres_entrada: number };
}

function aResumenesGenerados(api: RespuestaResumenApi): ResumenesGenerados {
  const { resumen_general: general, resumen_esencial: esencial, metadatos } = api;
  return {
    general: {
      titulo: general.titulo,
      introduccion: general.introduccion,
      secciones: general.secciones,
      minutosLectura: general.minutos_lectura,
    },
    esencial: {
      ideaCentral: esencial.idea_central,
      ideasClave: esencial.ideas_clave,
      conceptosClave: esencial.conceptos_clave,
      minutosLectura: esencial.minutos_lectura,
    },
    metadatos: { origen: "ia", modelo: metadatos.modelo, generadoEn: metadatos.generado_en, caracteresEntrada: metadatos.caracteres_entrada },
  };
}

export async function generarResumenes(texto: string, titulo: string, senal?: AbortSignal): Promise<ResumenesGenerados> {
  const respuesta = await enviarJson<RespuestaResumenApi>("/api/resumenes", { texto, titulo }, { senal, tiempoEsperaMs: TIEMPO_ESPERA_IA_MS });
  return aResumenesGenerados(respuesta);
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
