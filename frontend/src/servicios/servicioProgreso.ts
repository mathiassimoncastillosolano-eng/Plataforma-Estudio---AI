import type { EstadisticasPanel, InstantaneaProgreso } from "../tipos";
import {
  estadisticasPanel,
  evolucionDominio,
  dominioPorCategoria,
  preguntasPorSemana,
} from "../datos/progreso";
import { retardoSimulado } from "../utilidades/retardoSimulado";

// -----------------------------------------------------------------------
// Servicio de progreso y estadísticas.
// A futuro: GET /api/progreso/dashboard, GET /api/progreso/history, etc.
// -----------------------------------------------------------------------

export async function obtenerEstadisticasPanel(): Promise<EstadisticasPanel> {
  return retardoSimulado(estadisticasPanel, 400);
}

export async function obtenerEvolucionDominio(): Promise<InstantaneaProgreso[]> {
  return retardoSimulado(evolucionDominio, 500);
}

export async function obtenerPreguntasPorSemana() {
  return retardoSimulado(preguntasPorSemana, 500);
}

export async function obtenerDominioPorCategoria() {
  return retardoSimulado(dominioPorCategoria, 500);
}
