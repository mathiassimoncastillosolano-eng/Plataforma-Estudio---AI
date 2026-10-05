import type { ExamResult, QuestionDifficulty } from "../types";
import { DIFFICULTIES } from "./examBuilder";

export interface Recommendation {
  tone: "good" | "warn" | "info";
  text: string;
}

const levelName: Record<QuestionDifficulty, string> = { facil: "fáciles", media: "medias", dificil: "difíciles" };

/**
 * Convierte un resultado en acciones concretas ("¿qué necesito estudiar ahora?").
 * Reglas simples y transparentes; el backend podría sustituirlas por IA.
 */
export function buildRecommendations(result: ExamResult): Recommendation[] {
  const out: Recommendation[] = [];
  const levels = DIFFICULTIES.filter((l) => result.byDifficulty[l].total > 0);

  if (result.timedOut) {
    out.push({ tone: "warn", text: "Se acabó el tiempo antes de terminar. Prueba con más minutos o practica a un ritmo menor a 1 minuto por pregunta." });
  } else if (result.omittedCount > 0) {
    out.push({ tone: "warn", text: `Dejaste ${result.omittedCount} ${result.omittedCount === 1 ? "pregunta" : "preguntas"} sin responder. Si dudas, descarta opciones y elige la más probable.` });
  }

  for (const w of result.weakConcepts) {
    out.push({ tone: "warn", text: `Repasa «${w.term}»: fallaste ${w.missed} de ${w.total} ${w.total === 1 ? "pregunta" : "preguntas"} de este bloque.` });
  }

  const weakest = [...levels].sort((a, b) => result.byDifficulty[a].percent - result.byDifficulty[b].percent)[0];
  if (weakest && result.byDifficulty[weakest].percent < 70 && result.byDifficulty[weakest].total >= 2) {
    out.push({ tone: "info", text: `Refuerza las preguntas ${levelName[weakest]}: tu acierto fue ${result.byDifficulty[weakest].percent}%.` });
  }

  if (result.scorePercent >= 85 && result.config.difficulty !== "dificil") {
    out.push({ tone: "good", text: "Dominas este nivel. Sube la dificultad para seguir progresando." });
  } else if (result.scorePercent >= 85) {
    out.push({ tone: "good", text: "Excelente resultado incluso en dificultad alta. Puedes pasar al siguiente tema." });
  } else if (result.scorePercent < 50) {
    out.push({ tone: "info", text: "Lee de nuevo el resumen completo antes de volver a intentarlo; después, practica con preguntas sueltas." });
  }

  return out.slice(0, 5);
}

export function resultHeadline(percent: number): { title: string; tone: "good" | "mid" | "low" } {
  if (percent >= 85) return { title: "¡Excelente resultado!", tone: "good" };
  if (percent >= 70) return { title: "Muy buen trabajo", tone: "good" };
  if (percent >= 50) return { title: "Vas por buen camino", tone: "mid" };
  return { title: "Todavía hay conceptos por reforzar", tone: "low" };
}
