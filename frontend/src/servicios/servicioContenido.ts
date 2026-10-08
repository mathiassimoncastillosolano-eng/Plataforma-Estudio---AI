import type { ContenidoPdf } from "../tipos";
import { TIEMPO_ESPERA_PDF_MS } from "../configuracion";
import { enviarArchivo } from "./clienteApi";

/**
 * Pide al backend que extraiga el texto de un PDF.
 * El archivo se procesa en memoria en el servidor y no se almacena.
 */
export function extraerTextoPdf(archivo: File, senal?: AbortSignal): Promise<ContenidoPdf> {
  return enviarArchivo<ContenidoPdf>("/api/contenido/extraer-pdf", "archivo", archivo, { senal, tiempoEsperaMs: TIEMPO_ESPERA_PDF_MS });
}
