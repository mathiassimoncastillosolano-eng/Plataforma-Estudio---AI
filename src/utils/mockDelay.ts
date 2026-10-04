/**
 * Simula la latencia de una llamada de red real.
 * Cuando el backend exista, esta utilidad deja de usarse: los servicios
 * simplemente pasarán a hacer `await fetch(...)`.
 */
export function mockDelay<T>(value: T, ms = 700): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), ms);
  });
}

export function randomId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
