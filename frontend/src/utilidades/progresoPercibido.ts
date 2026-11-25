const TOPE = 94;
const CONSTANTE_MS = 9000;
export const DURACION_ETAPA_MS = 2600;

export function progresoPercibido(transcurridoMs: number): number {
  return Math.round(TOPE * (1 - Math.exp(-Math.max(0, transcurridoMs) / CONSTANTE_MS)));
}

export function etapaActual(transcurridoMs: number, totalEtapas: number): number {
  if (totalEtapas <= 0) return 0;
  return Math.min(totalEtapas - 1, Math.floor(Math.max(0, transcurridoMs) / DURACION_ETAPA_MS));
}
