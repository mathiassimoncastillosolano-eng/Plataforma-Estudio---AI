/**
 * Simula la latencia de una llamada de red real.
 * Cuando el backend exista, esta utilidad deja de usarse: los servicios
 * simplemente pasarán a hacer `await fetch(...)`.
 */
export function retardoSimulado<T>(valor: T, ms = 700): Promise<T> {
  return new Promise((resolver) => {
    setTimeout(() => resolver(valor), ms);
  });
}

export function idAleatorio(prefijo = "id"): string {
  return `${prefijo}-${Math.random().toString(36).slice(2, 10)}`;
}
