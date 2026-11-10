import type { NivelPregunta } from "../tipos/prueba";

// -----------------------------------------------------------------------
// MOD-08 · Estado del motor adaptativo por tema (nivel, período y respuestas pendientes).
//
// Es la misma forma que `EstadoAdaptativo` de backend/app/adaptacion/esquemas.py, con los mismos
// nombres (snake_case) y la escala 0–1 del motor, para guardar y reenviar el estado de /registrar
// SIN conversiones. La conversión a la escala de la interfaz (0–100) no se hace aquí (H-07).
// -----------------------------------------------------------------------

/** Respuestas que aún no completan un período; el motor cierra el período al llegar a 15. */
export const MAX_PENDIENTES_ADAPTACION = 14;
/** Tope de `numero_periodo` que acepta el backend. */
export const MAX_NUMERO_PERIODO = 10_000;

const DIFICULTADES: readonly NivelPregunta[] = ["facil", "media", "dificil"];

export interface RespuestaPendiente {
  dificultad: NivelPregunta;
  correcta: boolean;
}

export interface EstadoAdaptacion {
  /** 0–1. */
  nivel: number;
  /** Período en curso (desde 1). */
  numero_periodo: number;
  /** Porcentaje (0–1) del último período cerrado; null si aún no se cerró ninguno. */
  ultimo_porcentaje: number | null;
  pendientes: RespuestaPendiente[];
}

const esFraccion = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;

const esRespuestaPendiente = (v: unknown): v is RespuestaPendiente =>
  typeof v === "object" && v !== null && (DIFICULTADES as readonly unknown[]).includes((v as RespuestaPendiente).dificultad) && typeof (v as RespuestaPendiente).correcta === "boolean";

/** Comprueba que `v` es un estado que el backend aceptaría; se usa al restaurar datos guardados. */
export function esEstadoAdaptacion(v: unknown): v is EstadoAdaptacion {
  if (typeof v !== "object" || v === null) return false;
  const e = v as Record<string, unknown>;
  return (
    esFraccion(e.nivel) &&
    typeof e.numero_periodo === "number" &&
    Number.isInteger(e.numero_periodo) &&
    e.numero_periodo >= 1 &&
    e.numero_periodo <= MAX_NUMERO_PERIODO &&
    (e.ultimo_porcentaje === null || esFraccion(e.ultimo_porcentaje)) &&
    Array.isArray(e.pendientes) &&
    e.pendientes.length <= MAX_PENDIENTES_ADAPTACION &&
    e.pendientes.every(esRespuestaPendiente)
  );
}

/** Copia independiente: lo guardado no cambia si quien lo entregó modifica después su objeto. */
export const copiarEstadoAdaptacion = (e: EstadoAdaptacion): EstadoAdaptacion => ({ ...e, pendientes: e.pendientes.map((p) => ({ ...p })) });
