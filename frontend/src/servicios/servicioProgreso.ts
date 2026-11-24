import type { EstadisticasPanel, InstantaneaProgreso } from "../tipos";
import {
  estadisticasPanel,
  evolucionDominio,
  dominioPorCategoria,
  preguntasPorSemana,
} from "../datos/progreso";
import { retardoSimulado } from "../utilidades/retardoSimulado";
import { obtenerTemasEstudio } from "./servicioEstudio";

// -----------------------------------------------------------------------
// Servicio de progreso y estadísticas.
// A futuro: GET /api/progreso/dashboard, GET /api/progreso/history, etc.
// -----------------------------------------------------------------------

export async function obtenerEstadisticasPanel(): Promise<EstadisticasPanel> {
  const temas = await obtenerTemasEstudio();
  const suma = (valor: (t: (typeof temas)[number]) => number) => temas.reduce((total, t) => total + valor(t), 0);
  return {
    ...estadisticasPanel,
    temasEstudiados: temas.length,
    preguntasRespondidas: suma((t) => t.preguntasRespondidas),
    dominioPromedio: temas.length > 0 ? Math.round(suma((t) => t.dominio) / temas.length) : 0,
  };
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
