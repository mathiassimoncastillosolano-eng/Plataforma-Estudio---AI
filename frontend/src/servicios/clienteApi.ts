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

async function solicitar<T>(ruta: string, inicio: RequestInit, { senal, tiempoEsperaMs }: OpcionesSolicitud): Promise<T> {
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

  let respuestaHttp: Response;
  try {
    respuestaHttp = await fetch(`${URL_BASE_API}${ruta}`, { ...inicio, signal: controlador.signal });
  } catch {
    if (tiempoAgotado) throw new ErrorApi("TIEMPO_AGOTADO", "La solicitud tardó demasiado. Inténtalo de nuevo.");
    if (senal?.aborted) throw new ErrorApi("SOLICITUD_CANCELADA", "Solicitud cancelada.");
    throw new ErrorApi("ERROR_DE_RED", "No pudimos conectar con el servidor. Comprueba que el backend esté en ejecución.");
  } finally {
    window.clearTimeout(temporizador);
    senal?.removeEventListener("abort", alAbortar);
  }

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

/** Envía un archivo como multipart/form-data (el navegador fija el Content-Type con su boundary). */
export function enviarArchivo<T>(ruta: string, campo: string, archivo: File, opciones: OpcionesSolicitud = {}): Promise<T> {
  const datos = new FormData();
  datos.append(campo, archivo);
  return solicitar<T>(ruta, { method: "POST", body: datos }, opciones);
}
