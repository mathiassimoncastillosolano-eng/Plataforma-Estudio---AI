interface TareaActiva<T> {
  huella: string;
  promesa: Promise<T>;
  controlador: AbortController;
}

export interface RegistroTareas<T> {
  iniciar(clave: string, huella: string, ejecutar: (senal: AbortSignal) => Promise<T>, alTerminar?: (valor: T) => void): Promise<T>;
  enCurso(clave: string, huella?: string): Promise<T> | undefined;
  cancelar(clave: string): void;
}

export function crearRegistroTareas<T>(): RegistroTareas<T> {
  const activas = new Map<string, TareaActiva<T>>();

  function cancelar(clave: string) {
    activas.get(clave)?.controlador.abort();
    activas.delete(clave);
  }

  function enCurso(clave: string, huella?: string) {
    const tarea = activas.get(clave);
    if (!tarea || (huella !== undefined && tarea.huella !== huella)) return undefined;
    return tarea.promesa;
  }

  function iniciar(clave: string, huella: string, ejecutar: (senal: AbortSignal) => Promise<T>, alTerminar?: (valor: T) => void) {
    const existente = enCurso(clave, huella);
    if (existente) return existente;
    cancelar(clave);
    const controlador = new AbortController();
    const promesa = ejecutar(controlador.signal).then(
      (valor) => {
        if (activas.get(clave)?.controlador === controlador && !controlador.signal.aborted) {
          activas.delete(clave);
          alTerminar?.(valor);
        }
        return valor;
      },
      (fallo) => {
        if (activas.get(clave)?.controlador === controlador) activas.delete(clave);
        throw fallo;
      }
    );
    activas.set(clave, { huella, promesa, controlador });
    return promesa;
  }

  return { iniciar, enCurso, cancelar };
}
