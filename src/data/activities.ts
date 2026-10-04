export type ActivityKind = "summary" | "questions" | "exam" | "mindmap" | "topic-created";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  topicTitle: string;
  description: string;
  time: string;
}

export const recentActivity: ActivityItem[] = [
  {
    id: "a1",
    kind: "exam",
    topicTitle: "Sistema circulatorio humano",
    description: "Completaste una prueba con 82% de aciertos.",
    time: "Hoy, 10:24",
  },
  {
    id: "a2",
    kind: "questions",
    topicTitle: "Programación orientada a objetos",
    description: "Practicaste 6 preguntas nuevas.",
    time: "Ayer, 19:02",
  },
  {
    id: "a3",
    kind: "summary",
    topicTitle: "Revolución Francesa",
    description: "Revisaste el resumen completo del tema.",
    time: "Hace 2 días",
  },
  {
    id: "a4",
    kind: "mindmap",
    topicTitle: "Sistema circulatorio humano",
    description: "Editaste el mapa conceptual del tema.",
    time: "Hace 3 días",
  },
  {
    id: "a5",
    kind: "topic-created",
    topicTitle: "Sistema nervioso",
    description: "Creaste un nuevo tema de estudio.",
    time: "Hace 1 semana",
  },
];
