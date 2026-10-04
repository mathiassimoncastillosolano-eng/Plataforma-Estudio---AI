import type { DashboardStats, ProgressSnapshot } from "../types";

export const dashboardStats: DashboardStats = {
  topicsStudied: 12,
  studyHours: 18.5,
  questionsAnswered: 247,
  averageMastery: 78,
};

export const masteryEvolution: ProgressSnapshot[] = [
  { date: "Ago 1", masteryAverage: 52 },
  { date: "Ago 8", masteryAverage: 58 },
  { date: "Ago 15", masteryAverage: 61 },
  { date: "Ago 22", masteryAverage: 65 },
  { date: "Ago 29", masteryAverage: 69 },
  { date: "Sep 5", masteryAverage: 71 },
  { date: "Sep 12", masteryAverage: 74 },
  { date: "Sep 19", masteryAverage: 78 },
];

export const questionsPerWeek = [
  { week: "Sem 1", answered: 24 },
  { week: "Sem 2", answered: 31 },
  { week: "Sem 3", answered: 18 },
  { week: "Sem 4", answered: 40 },
  { week: "Sem 5", answered: 29 },
  { week: "Sem 6", answered: 35 },
];

export const masteryByCategory = [
  { category: "Biología", mastery: 65 },
  { category: "Historia", mastery: 64 },
  { category: "Informática", mastery: 91 },
  { category: "Matemáticas", mastery: 45 },
];
