import type { EventoBuddy } from "./tipos";

export interface EstadoCola {
  actual: EventoBuddy | null;
  saliendo: boolean;
  pendientes: EventoBuddy[];
}

export type AccionCola =
  | { tipo: "anunciar"; evento: EventoBuddy }
  | { tipo: "cerrar" }
  | { tipo: "terminarSalida" }
  | { tipo: "cancelarRuta"; ruta: string }
  | { tipo: "quitar"; id: string }
  | { tipo: "bloquear" }
  | { tipo: "reiniciar" };

export const colaInicial: EstadoCola = { actual: null, saliendo: false, pendientes: [] };

const conservable = (evento: EventoBuddy) => evento.prioridad <= 2 || evento.retener;

function insertar(lista: EventoBuddy[], evento: EventoBuddy): EventoBuddy[] {
  let posicion = lista.length;
  for (let i = 0; i < lista.length; i += 1) {
    if (lista[i].prioridad > evento.prioridad) {
      posicion = i;
      break;
    }
  }
  return [...lista.slice(0, posicion), evento, ...lista.slice(posicion)];
}

function avanzar(pendientes: EventoBuddy[]): EstadoCola {
  const [siguiente, ...resto] = pendientes;
  return { actual: siguiente ?? null, saliendo: false, pendientes: resto };
}

export function reducirCola(estado: EstadoCola, accion: AccionCola): EstadoCola {
  switch (accion.tipo) {
    case "anunciar": {
      const { evento } = accion;
      if (estado.actual?.id === evento.id || estado.pendientes.some((p) => p.id === evento.id)) return estado;
      if (!estado.actual) return { actual: evento, saliendo: false, pendientes: estado.pendientes };
      if (!estado.saliendo && evento.prioridad < estado.actual.prioridad) {
        const desplazado = estado.actual;
        const pendientes = conservable(desplazado) ? insertar(estado.pendientes, desplazado) : estado.pendientes;
        return { actual: evento, saliendo: false, pendientes };
      }
      return conservable(evento) ? { ...estado, pendientes: insertar(estado.pendientes, evento) } : estado;
    }
    case "cerrar":
      return estado.actual && !estado.saliendo ? { ...estado, saliendo: true } : estado;
    case "terminarSalida":
      return estado.saliendo ? avanzar(estado.pendientes) : estado;
    case "cancelarRuta": {
      const vigente = (evento: EventoBuddy) => !evento.cancelarAlNavegar || evento.ruta === undefined || evento.ruta === accion.ruta;
      const pendientes = estado.pendientes.filter(vigente);
      if (estado.actual && !vigente(estado.actual)) return avanzar(pendientes);
      return pendientes.length === estado.pendientes.length ? estado : { ...estado, pendientes };
    }
    case "quitar": {
      if (estado.actual?.id === accion.id) return estado.saliendo ? estado : { ...estado, saliendo: true };
      const pendientes = estado.pendientes.filter((p) => p.id !== accion.id);
      return pendientes.length === estado.pendientes.length ? estado : { ...estado, pendientes };
    }
    case "bloquear": {
      const pendientes = estado.pendientes.filter((p) => p.modo === "tutorial");
      if (estado.actual && estado.actual.modo !== "tutorial") return avanzar(pendientes);
      return { ...estado, pendientes };
    }
    case "reiniciar":
      return colaInicial;
  }
}
