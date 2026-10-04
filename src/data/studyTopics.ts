import type { StudyTopic } from "../types";

export const studyTopics: StudyTopic[] = [
  {
    id: "1",
    title: "Sistema circulatorio humano",
    category: "Biología",
    description: "Anatomía y funcionamiento del corazón, la sangre y los vasos sanguíneos.",
    mastery: 78,
    masteryLevel: "buen-dominio",
    lastStudiedAt: "Hoy",
    createdAt: "2026-08-12",
    questionsAnswered: 42,
    examsCompleted: 2,
    sourceType: "pdf",
    sourceName: "sistema-circulatorio-apuntes.pdf",
  },
  {
    id: "2",
    title: "Revolución Francesa",
    category: "Historia",
    description: "Causas, etapas y consecuencias del proceso revolucionario de 1789.",
    mastery: 64,
    masteryLevel: "en-progreso",
    lastStudiedAt: "Ayer",
    createdAt: "2026-08-05",
    questionsAnswered: 31,
    examsCompleted: 1,
    sourceType: "text",
  },
  {
    id: "3",
    title: "Programación orientada a objetos",
    category: "Informática",
    description: "Clases, objetos, herencia, polimorfismo y encapsulamiento.",
    mastery: 91,
    masteryLevel: "alto-dominio",
    lastStudiedAt: "Hace 3 días",
    createdAt: "2026-07-20",
    questionsAnswered: 67,
    examsCompleted: 4,
    sourceType: "pdf",
    sourceName: "poo-fundamentos.pdf",
  },
  {
    id: "4",
    title: "Cálculo diferencial",
    category: "Matemáticas",
    description: "Límites, derivadas y sus aplicaciones al estudio de funciones.",
    mastery: 45,
    masteryLevel: "en-progreso",
    lastStudiedAt: "Hace 5 días",
    createdAt: "2026-07-15",
    questionsAnswered: 18,
    examsCompleted: 1,
    sourceType: "text",
  },
  {
    id: "5",
    title: "Sistema nervioso",
    category: "Biología",
    description: "Organización del sistema nervioso central y periférico.",
    mastery: 22,
    masteryLevel: "inicial",
    lastStudiedAt: "Hace 1 semana",
    createdAt: "2026-07-02",
    questionsAnswered: 9,
    examsCompleted: 0,
    sourceType: "pdf",
    sourceName: "neurociencia-basica.pdf",
  },
];

export function getMasteryLevel(mastery: number): StudyTopic["masteryLevel"] {
  if (mastery <= 25) return "inicial";
  if (mastery <= 50) return "en-progreso";
  if (mastery <= 75) return "buen-dominio";
  return "alto-dominio";
}

export const masteryLevelLabels: Record<StudyTopic["masteryLevel"], string> = {
  inicial: "Nivel inicial",
  "en-progreso": "En progreso",
  "buen-dominio": "Buen dominio",
  "alto-dominio": "Alto dominio",
};

export const masteryLevelCopy: Record<StudyTopic["masteryLevel"], string> = {
  inicial: "Estás dando tus primeros pasos con este tema. Sigue explorando el resumen esencial.",
  "en-progreso": "Vas avanzando. Refuerza los conceptos que más se te resisten con más preguntas.",
  "buen-dominio": "Has demostrado un buen dominio de los conceptos principales.",
  "alto-dominio": "Dominas este tema con solidez. Considera pasar a un examen más exigente.",
};

export type TopicStatus = "pendiente" | "en-progreso" | "completado";

export function getTopicStatus(topic: StudyTopic): TopicStatus {
  if (topic.questionsAnswered === 0 && topic.examsCompleted === 0) return "pendiente";
  if (topic.mastery >= 95) return "completado";
  return "en-progreso";
}

export const topicStatusLabels: Record<TopicStatus, string> = {
  pendiente: "Pendiente",
  "en-progreso": "En progreso",
  completado: "Completado",
};
