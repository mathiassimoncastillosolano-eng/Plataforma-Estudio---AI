import { TIEMPO_ESPERA_DESCARGA_MS, TIEMPO_ESPERA_IA_MS, TIEMPO_ESPERA_PDF_IA_MS } from "../configuracion";
import type { DatosAristaMapaMental, DatosNodoMapaMental, MapaMental } from "../tipos";
import { calcularPosiciones } from "../utilidades/distribucionMapa";
import { aplanarJerarquia, construirJerarquia, type MapaExportable, type PaletaExportacion } from "../utilidades/exportacionMapa";
import { ErrorApi, descargarArchivo, enviarArchivo, enviarJson, type ArchivoDescargado } from "./clienteApi";

// -----------------------------------------------------------------------
// Servicio de mapas conceptuales (MOD-05). Llama al backend real:
//   POST /api/mapas-conceptuales      (texto)
//   POST /api/mapas-conceptuales/pdf  (PDF original)
// El backend devuelve solo la estructura (nodos, definiciones y frases de
// enlace); las posiciones se calculan aquí de forma determinista.
// -----------------------------------------------------------------------

interface NodoApi {
  id: string;
  etiqueta: string;
  definicion: string;
  nivel: number;
  id_padre: string | null;
}

interface RelacionApi {
  id: string;
  origen: string;
  destino: string;
  frase_enlace: string;
  tipo: "jerarquica" | "cruzada";
}

interface RespuestaMapaApi {
  mapa: { titulo: string; nodos: NodoApi[]; relaciones: RelacionApi[] };
}

const RUTA = "/api/mapas-conceptuales";

function respuestaInutilizable(): ErrorApi {
  return new ErrorApi("RESPUESTA_INESPERADA", "Recibimos un mapa incompleto. Inténtalo de nuevo.");
}

/**
 * Convierte la respuesta del backend en el mapa que dibuja `MapaConceptual`.
 * Aunque el backend ya valida, aquí se vuelve a comprobar lo imprescindible para que
 * un dato inesperado nunca rompa la interfaz: elementos mal formados se omiten y, si no
 * queda un mapa utilizable, se lanza un error controlado.
 */
export function convertirRespuestaMapa(idTema: string, datos: RespuestaMapaApi | null | undefined): MapaMental {
  const bruto = datos?.mapa;
  if (!bruto || !Array.isArray(bruto.nodos) || !Array.isArray(bruto.relaciones)) throw respuestaInutilizable();

  const nodosValidos = bruto.nodos.filter(
    (n) => n && typeof n.id === "string" && n.id && typeof n.etiqueta === "string" && n.etiqueta.trim() && typeof n.definicion === "string"
  );
  const ids = new Set(nodosValidos.map((n) => n.id));
  if (ids.size !== nodosValidos.length || nodosValidos.length === 0) throw respuestaInutilizable();

  // Solo se dibujan las conexiones de cada rama (concepto superior → concepto). Las relaciones entre ramas distintas
  // ("cruzada") se descartan: las líneas largas entre ramas lejanas confundían más de lo que ayudaban.
  const relaciones = bruto.relaciones.filter(
    (r) =>
      r && r.tipo !== "cruzada" && typeof r.id === "string" && ids.has(r.origen) && ids.has(r.destino) && r.origen !== r.destino && typeof r.frase_enlace === "string" && r.frase_enlace.trim()
  );
  const frasePorHijo = new Map(relaciones.map((r) => [r.destino, r.frase_enlace]));

  const posiciones = calcularPosiciones(
    nodosValidos.map((n) => ({
      id: n.id,
      etiqueta: n.etiqueta,
      nivel: n.nivel,
      idPadre: n.id_padre && ids.has(n.id_padre) ? n.id_padre : null,
      frase: frasePorHijo.get(n.id),
    }))
  );

  const nodos: DatosNodoMapaMental[] = nodosValidos.map((n) => ({
    id: n.id,
    etiqueta: n.etiqueta,
    detalle: n.definicion.trim() || undefined,
    nivel: n.nivel <= 0 ? 0 : n.nivel === 1 ? 1 : 2,
    idPadre: n.id_padre && ids.has(n.id_padre) ? n.id_padre : null,
    x: posiciones.get(n.id)?.x ?? 0,
    y: posiciones.get(n.id)?.y ?? 0,
  }));
  const aristas: DatosAristaMapaMental[] = relaciones.map((r) => ({
    id: r.id,
    fuente: r.origen,
    objetivo: r.destino,
    etiqueta: r.frase_enlace.trim(),
  }));
  return { idTema, nodos, aristas };
}

export async function generarMapaConceptual(idTema: string, texto: string, titulo: string, senal?: AbortSignal): Promise<MapaMental> {
  const datos = await enviarJson<RespuestaMapaApi>(RUTA, { texto, titulo }, { senal, tiempoEsperaMs: TIEMPO_ESPERA_IA_MS });
  return convertirRespuestaMapa(idTema, datos);
}

export async function generarMapaConceptualDesdePdf(idTema: string, archivo: File, titulo: string, senal?: AbortSignal): Promise<MapaMental> {
  const datos = await enviarArchivo<RespuestaMapaApi>(`${RUTA}/pdf`, "archivo", archivo, {
    senal,
    tiempoEsperaMs: TIEMPO_ESPERA_PDF_IA_MS,
    campos: { titulo },
  });
  return convertirRespuestaMapa(idTema, datos);
}

/**
 * Pide al backend el PDF del mapa (POST /api/mapas-conceptuales/descargar-pdf). No llama a la IA:
 * envía la imagen del mapa ya dibujada (página 1) y los conceptos actuales en orden jerárquico (página 2).
 */
export function obtenerPdfMapa(mapa: MapaExportable, paleta: PaletaExportacion, imagenPngBase64: string, senal?: AbortSignal): Promise<ArchivoDescargado> {
  const conceptos = aplanarJerarquia(construirJerarquia(mapa)).map((c) => ({ etiqueta: c.etiqueta.slice(0, 300), descripcion: c.descripcion.slice(0, 5_000), profundidad: c.profundidad }));
  const cuerpo = {
    titulo: mapa.titulo.slice(0, 300),
    origen: mapa.origen,
    generado_en: new Date().toISOString(),
    imagen_png: imagenPngBase64,
    paleta: {
      solido: paleta.solido,
      tinte: paleta.tinte,
      medio: paleta.medio,
      tinta: paleta.tinta,
      texto: paleta.texto,
      texto_suave: paleta.textoSuave,
      borde: paleta.borde,
    },
    conceptos,
  };
  return descargarArchivo(`${RUTA}/descargar-pdf`, cuerpo, { senal, tiempoEsperaMs: TIEMPO_ESPERA_DESCARGA_MS });
}
