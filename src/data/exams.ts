import type { ExamConfig } from "../types";

export const defaultExamConfigs: Record<string, ExamConfig> = {
  "1": { topicId: "1", questionCount: 8, difficulty: "mixta", estimatedMinutes: 10 },
  "2": { topicId: "2", questionCount: 6, difficulty: "mixta", estimatedMinutes: 8 },
  "3": { topicId: "3", questionCount: 6, difficulty: "mixta", estimatedMinutes: 8 },
  "4": { topicId: "4", questionCount: 5, difficulty: "media", estimatedMinutes: 7 },
  "5": { topicId: "5", questionCount: 4, difficulty: "media", estimatedMinutes: 6 },
};

export interface PastExam {
  id: string;
  topicId: string;
  topicTitle: string;
  date: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
}

export const pastExams: PastExam[] = [
  { id: "ex-1", topicId: "1", topicTitle: "Sistema circulatorio humano", date: "18 sep 2026", scorePercent: 82, correctCount: 7, totalQuestions: 8 },
  { id: "ex-2", topicId: "3", topicTitle: "Programación orientada a objetos", date: "16 sep 2026", scorePercent: 100, correctCount: 6, totalQuestions: 6 },
  { id: "ex-3", topicId: "2", topicTitle: "Revolución Francesa", date: "12 sep 2026", scorePercent: 67, correctCount: 4, totalQuestions: 6 },
  { id: "ex-4", topicId: "1", topicTitle: "Sistema circulatorio humano", date: "5 sep 2026", scorePercent: 75, correctCount: 6, totalQuestions: 8 },
  { id: "ex-5", topicId: "4", topicTitle: "Cálculo diferencial", date: "1 sep 2026", scorePercent: 60, correctCount: 3, totalQuestions: 5 },
];
