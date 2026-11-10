// MOD-03 · H-03/H-05: la práctica registra sus respuestas en el motor adaptativo (MOD-07) y toma de él el dominio.
import { enviarJson } from "./clienteApi";
import { guardarEstadoAdaptacion, obtenerEstadoAdaptacion } from "../almacen/almacenSesion";
import type { EstadoAdaptacion } from "../utilidades/adaptacion";

export type DificultadPractica = "facil" | "media" | "dificil";

export interface RespuestaPractica {
  dificultad: DificultadPractica;
  correcta: boolean;
}

interface RespuestaApi {
  id_tema: string;
  estado: EstadoAdaptacion;
  periodos_cerrados: unknown[];
  dificultad_objetivo: DificultadPractica;
}

export interface ResultadoRegistro {
  /** Dominio 0-100 solo si el motor cerró al menos un período; si no, null (se conserva el actual). */
  dominio: number | null;
  dificultadObjetivo: DificultadPractica;
  periodosCerrados: number;
}

const MAXIMO_POR_ENVIO = 100; // límite de SolicitudRegistrar.respuestas en el backend

// El estado del motor vive en el almacén de sesión (MOD-08), que lo persiste entre recargas.
// Las respuestas que no se pudieron enviar se conservan solo en memoria.
const porEnviar = new Map<string, RespuestaPractica[]>();

/** PROVISIONAL (H-07): conversión motor 0-1 -> interfaz 0-100. Único punto a cambiar cuando se defina la escala. */
export function nivelADominio(nivel: number): number {
  return Math.round(Math.min(1, Math.max(0, nivel)) * 100);
}

/**
 * Registra las respuestas de una práctica. Si el backend falla, las conserva y las reenvía en el siguiente intento.
 * Devuelve null si no hubo nada que enviar o si el envío falló: la práctica nunca se rompe por esto.
 */
export async function registrarPractica(idTema: string, respuestas: RespuestaPractica[]): Promise<ResultadoRegistro | null> {
  const lote = [...(porEnviar.get(idTema) ?? []), ...respuestas].slice(-MAXIMO_POR_ENVIO);
  porEnviar.set(idTema, lote);
  if (lote.length === 0) return null;
  const estado = obtenerEstadoAdaptacion(idTema);
  try {
    const datos = await enviarJson<RespuestaApi>("/api/adaptacion/registrar", {
      id_tema: idTema,
      ...(estado ? { estado } : {}),
      respuestas: lote,
    });
    guardarEstadoAdaptacion(idTema, datos.estado);
    porEnviar.delete(idTema);
    const cerrados = datos.periodos_cerrados.length;
    return {
      dominio: cerrados > 0 ? nivelADominio(datos.estado.nivel) : null,
      dificultadObjetivo: datos.dificultad_objetivo,
      periodosCerrados: cerrados,
    };
  } catch {
    return null;
  }
}

/** Vacía solo las respuestas sin enviar; el estado del motor se borra con el almacén (tema o cierre de sesión). */
export function reiniciarAdaptacion(): void {
  porEnviar.clear();
}