import type { DashboardStats, ProgressSnapshot } from "../types";
import {
  dashboardStats,
  masteryEvolution,
  masteryByCategory,
  questionsPerWeek,
} from "../data/progress";
import { mockDelay } from "../utils/mockDelay";

// -----------------------------------------------------------------------
// Servicio de progreso y estadísticas.
// A futuro: GET /api/progress/dashboard, GET /api/progress/history, etc.
// -----------------------------------------------------------------------

export async function getDashboardStats(): Promise<DashboardStats> {
  return mockDelay(dashboardStats, 400);
}

export async function getMasteryEvolution(): Promise<ProgressSnapshot[]> {
  return mockDelay(masteryEvolution, 500);
}

export async function getQuestionsPerWeek() {
  return mockDelay(questionsPerWeek, 500);
}

export async function getMasteryByCategory() {
  return mockDelay(masteryByCategory, 500);
}
