export type Expresion = "neutral" | "feliz" | "entusiasmo" | "sorpresa" | "curiosidad" | "concentracion" | "duda" | "tristeza" | "orgullo" | "motivacion";

export type Gesto =
  | "ninguno"
  | "saludar"
  | "senalar-izquierda"
  | "senalar-derecha"
  | "senalar-arriba"
  | "senalar-abajo"
  | "senalar-objetivo"
  | "brazos-arriba"
  | "saltar"
  | "inclinar"
  | "aprobar"
  | "celebrar"
  | "reflexionar"
  | "animar";

export type EstadoBuddy =
  | "idle"
  | "greeting"
  | "explaining"
  | "pointing"
  | "thinking"
  | "encouraging"
  | "happy"
  | "celebrating"
  | "congratulating"
  | "concerned"
  | "success";

export type ModoBuddy = "burbuja" | "tarjeta" | "invitacion" | "tutorial";

export type Particulas = "ninguna" | "suaves" | "intensas";

export const PRIORIDAD = { celebracion: 1, resultado: 2, tutorial: 3, modulo: 4, reposo: 5 } as const;

export const PRESENCIA_ESTADO: Record<EstadoBuddy, { expresion: Expresion; gesto: Gesto }> = {
  idle: { expresion: "feliz", gesto: "ninguno" },
  greeting: { expresion: "feliz", gesto: "saludar" },
  explaining: { expresion: "curiosidad", gesto: "senalar-derecha" },
  pointing: { expresion: "entusiasmo", gesto: "senalar-objetivo" },
  thinking: { expresion: "duda", gesto: "reflexionar" },
  encouraging: { expresion: "motivacion", gesto: "animar" },
  happy: { expresion: "feliz", gesto: "aprobar" },
  celebrating: { expresion: "entusiasmo", gesto: "celebrar" },
  congratulating: { expresion: "orgullo", gesto: "brazos-arriba" },
  concerned: { expresion: "tristeza", gesto: "inclinar" },
  success: { expresion: "entusiasmo", gesto: "saltar" },
};

export interface AccionBuddy {
  etiqueta: string;
  ruta?: string;
  alPulsar?: () => void;
}

export interface EventoBuddy {
  id: string;
  modo: ModoBuddy;
  prioridad: number;
  estado: EstadoBuddy;
  expresion: Expresion;
  gesto: Gesto;
  titulo?: string;
  mensaje: string;
  detalles?: string[];
  duracionMs: number | null;
  cerrable: boolean;
  accion?: AccionBuddy;
  accionSecundaria?: AccionBuddy;
  enfriamientoMs?: number;
  retener: boolean;
  cancelarAlNavegar: boolean;
  particulas: Particulas;
  ruta?: string;
}

export type EventoParcial = Pick<EventoBuddy, "id" | "mensaje"> & Partial<Omit<EventoBuddy, "id" | "mensaje">>;

export function crearEvento(parcial: EventoParcial, ruta?: string): EventoBuddy {
  const estado = parcial.estado ?? "idle";
  const presencia = PRESENCIA_ESTADO[estado];
  return {
    modo: "burbuja",
    prioridad: PRIORIDAD.modulo,
    estado,
    expresion: presencia.expresion,
    gesto: presencia.gesto,
    duracionMs: 4500,
    cerrable: true,
    retener: false,
    cancelarAlNavegar: true,
    particulas: "ninguna",
    ruta,
    ...parcial,
  };
}
