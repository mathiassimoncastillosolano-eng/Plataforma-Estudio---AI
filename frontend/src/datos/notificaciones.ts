export type TipoNotificacion = "recordatorio" | "logro" | "prueba" | "sistema";

export interface NotificacionApp {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  tiempo: string;
  leida: boolean;
}

export const notificaciones: NotificacionApp[] = [
  {
    id: "n1",
    tipo: "recordatorio",
    titulo: "Llevas 3 días sin repasar Cálculo diferencial.",
    tiempo: "Hace 2 horas",
    leida: false,
  },
  {
    id: "n2",
    tipo: "logro",
    titulo: "¡Alcanzaste 91% de dominio en POO!",
    tiempo: "Ayer",
    leida: false,
  },
  {
    id: "n3",
    tipo: "prueba",
    titulo: "Tu resultado en Sistema circulatorio fue 82%.",
    tiempo: "Hace 3 días",
    leida: true,
  },
  {
    id: "n4",
    tipo: "sistema",
    titulo: "Nuevo mapa conceptual disponible para Revolución Francesa.",
    tiempo: "Hace 5 días",
    leida: true,
  },
];
