// La práctica registra sus respuestas en el backend y el dominio mostrado es el nivel que estima el modelo de ML.
import { enviarJson } from "./clienteApi";
import { guardarEstadoAdaptacion, obtenerEstadoAdaptacion } from "../almacen/almacenSesion";
import type { EstadoAdaptacion } from "../utilidades/adaptacion";
import type { TemaEstudio } from "../tipos";
import { actualizarDominioTema, incrementarPreguntasRespondidas } from "./servicioEstudio";

export type DificultadPractica = "facil" | "media" | "dificil";

export interface RespuestaPractica {
  dificultad: DificultadPractica;
  correcta: boolean;
  segundos: number;
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

/** Conversión del nivel estimado por el modelo (0-1) a la interfaz (0-100). */
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

export async function consolidarPractica(idTema: string, respuestas: RespuestaPractica[], preguntasRespondidas: number): Promise<TemaEstudio | null> {
  const resultado = await registrarPractica(idTema, respuestas);
  await incrementarPreguntasRespondidas(idTema, preguntasRespondidas);
  const actualizado = resultado?.dominio != null ? await actualizarDominioTema(idTema, resultado.dominio) : null;
  return actualizado ?? null;
}

/** Vacía solo las respuestas sin enviar; el estado del motor se borra con el almacén (tema o cierre de sesión). */
export function reiniciarAdaptacion(): void {
  porEnviar.clear();
}