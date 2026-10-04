export type NotificationKind = "reminder" | "achievement" | "exam" | "system";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  time: string;
  read: boolean;
}

export const notifications: AppNotification[] = [
  {
    id: "n1",
    kind: "reminder",
    title: "Llevas 3 días sin repasar Cálculo diferencial.",
    time: "Hace 2 horas",
    read: false,
  },
  {
    id: "n2",
    kind: "achievement",
    title: "¡Alcanzaste 91% de dominio en POO!",
    time: "Ayer",
    read: false,
  },
  {
    id: "n3",
    kind: "exam",
    title: "Tu resultado en Sistema circulatorio fue 82%.",
    time: "Hace 3 días",
    read: true,
  },
  {
    id: "n4",
    kind: "system",
    title: "Nuevo mapa conceptual disponible para Revolución Francesa.",
    time: "Hace 5 días",
    read: true,
  },
];
