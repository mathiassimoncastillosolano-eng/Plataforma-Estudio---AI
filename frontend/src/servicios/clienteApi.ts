import { URL_BASE_API } from "../configuracion";

// -----------------------------------------------------------------------
// Cliente HTTP del backend. Entiende el contrato de respuestas:
//   éxito → { exito: true, datos }
//   error → { exito: false, error: { codigo, mensaje } }
// y convierte cualquier fallo (red, timeout, JSON inválido) en un ErrorApi
// con un mensaje apto para mostrarse al usuario.
// -----------------------------------------------------------------------

export class ErrorApi extends Error {
  constructor(
    public readonly codigo: string,
    mensaje: string,
    public readonly estado?: number
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

interface SobreExito<T> {
  exito: true;
  datos: T;
}

interface SobreError {
  exito: false;
  error: { codigo: string; mensaje: string };
}

const MENSAJE_RESPALDO = "No pudimos completar la solicitud. Inténtalo de nuevo.";

export interface OpcionesSolicitud {
  senal?: AbortSignal;
  tiempoEsperaMs?: number;
}

/** Hace el fetch con tiempo máximo y cancelación; convierte los fallos de red en ErrorApi. */
async function ejecutarFetch(ruta: string, inicio: RequestInit, { senal, tiempoEsperaMs }: OpcionesSolicitud): Promise<Response> {
  const controlador = new AbortController();
  let tiempoAgotado = false;
  const temporizador = tiempoEsperaMs
    ? window.setTimeout(() => {
        tiempoAgotado = true;
        controlador.abort();
      }, tiempoEsperaMs)
    : undefined;
  const alAbortar = () => controlador.abort();
  senal?.addEventListener("abort", alAbortar);

  try {
    return await fetch(`${URL_BASE_API}${ruta}`, { ...inicio, signal: controlador.signal });
  } catch {
    if (tiempoAgotado) throw new ErrorApi("TIEMPO_AGOTADO", "La solicitud tardó demasiado. Inténtalo de nuevo.");
    if (senal?.aborted) throw new ErrorApi("SOLICITUD_CANCELADA", "Solicitud cancelada.");
    throw new ErrorApi("ERROR_DE_RED", "No pudimos conectar con el servidor. Comprueba que el backend esté en ejecución.");
  } finally {
    window.clearTimeout(temporizador);
    senal?.removeEventListener("abort", alAbortar);
  }
}

async function solicitar<T>(ruta: string, inicio: RequestInit, opciones: OpcionesSolicitud): Promise<T> {
  const respuestaHttp = await ejecutarFetch(ruta, inicio, opciones);

  let carga: SobreExito<T> | SobreError | null = null;
  try {
    carga = (await respuestaHttp.json()) as SobreExito<T> | SobreError;
  } catch {
    /* cuerpo vacío o no JSON: se trata abajo */
  }

  if (carga && carga.exito === true) return carga.datos;
  if (carga && carga.exito === false && carga.error?.mensaje) {
    throw new ErrorApi(carga.error.codigo, carga.error.mensaje, respuestaHttp.status);
  }
  throw new ErrorApi("RESPUESTA_INESPERADA", MENSAJE_RESPALDO, respuestaHttp.status);
}

export function enviarJson<T>(ruta: string, cuerpo: unknown, opciones: OpcionesSolicitud = {}): Promise<T> {
  return solicitar<T>(ruta, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) }, opciones);
}

/**
 * Envía un archivo como multipart/form-data (el navegador fija el Content-Type con su boundary).
 * `campos` agrega campos de texto al mismo formulario (los vacíos se omiten).
 */
export function enviarArchivo<T>(
  ruta: string,
  campo: string,
  archivo: File,
  opciones: OpcionesSolicitud & { campos?: Record<string, string | undefined> } = {}
): Promise<T> {
  const { campos, ...opcionesSolicitud } = opciones;
  const datos = new FormData();
  datos.append(campo, archivo);
  Object.entries(campos ?? {}).forEach(([nombre, valor]) => {
    if (valor && valor.trim()) datos.append(nombre, valor);
  });
  return solicitar<T>(ruta, { method: "POST", body: datos }, opcionesSolicitud);
}

export interface ArchivoDescargado {
  blob: Blob;
  nombreArchivo: string;
}

/** POST con cuerpo JSON que devuelve un archivo binario (p. ej. un PDF). Los errores del backend llegan como JSON. */
export async function descargarArchivo(ruta: string, cuerpo: unknown, opciones: OpcionesSolicitud = {}): Promise<ArchivoDescargado> {
  const respuestaHttp = await ejecutarFetch(
    ruta,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(cuerpo) },
    opciones
  );

  if (respuestaHttp.ok && !(respuestaHttp.headers.get("Content-Type") ?? "").includes("application/json")) {
    const blob = await respuestaHttp.blob();
    if (blob.size === 0) throw new ErrorApi("ARCHIVO_VACIO", "El archivo generado está vacío. Inténtalo de nuevo.", respuestaHttp.status);
    const nombre = /filename="?([^";]+)"?/i.exec(respuestaHttp.headers.get("Content-Disposition") ?? "")?.[1];
    return { blob, nombreArchivo: nombre ?? "descarga.pdf" };
  }

  let carga: SobreError | null = null;
  try {
    carga = (await respuestaHttp.json()) as SobreError;
  } catch {
    /* cuerpo vacío o no JSON */
  }
  if (carga && carga.exito === false && carga.error?.mensaje) throw new ErrorApi(carga.error.codigo, carga.error.mensaje, respuestaHttp.status);
  throw new ErrorApi("RESPUESTA_INESPERADA", MENSAJE_RESPALDO, respuestaHttp.status);
}
