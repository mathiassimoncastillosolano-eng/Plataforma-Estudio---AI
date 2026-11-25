export const TIEMPO_CARGA_PRECARGADA_MS = 3000;

export function restanteHasta(inicioMs: number, minimoMs: number, ahoraMs: number = Date.now()): number {
  return Math.max(0, minimoMs - (ahoraMs - inicioMs));
}

export function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

export async function esperarMinimo(inicioMs: number, minimoMs: number): Promise<void> {
  const restante = restanteHasta(inicioMs, minimoMs);
  if (restante > 0) await esperar(restante);
}
