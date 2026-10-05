import type { DifficultyPerformance, ExamConfig, ExamResult, QuestionDifficulty, QuestionAttempt, StudyQuestion, TopicSummary, WeakConcept } from "../types";
import { defaultExamConfigs, pastExams, type PastExam } from "../data/exams";
import { mockDelay } from "../utils/mockDelay";
import { DIFFICULTIES, QUESTION_COUNTS, QUESTION_WEIGHT, TIME_OPTIONS, emptyCounts, maxScoreFor } from "../utils/examBuilder";
import { classifyQuestion } from "../utils/concepts";
import { formatSeconds } from "../utils/format";

// -----------------------------------------------------------------------
// Servicio de exámenes.
// A futuro llamará a endpoints como POST /api/exams, POST /api/exams/:id/submit.
// -----------------------------------------------------------------------

const configKey = (topicId: string) => `cursa.examConfig.${topicId}`;
const resultKey = (topicId: string) => `cursa.lastResult.${topicId}`;

function isValid(c: Partial<ExamConfig> | null | undefined): c is ExamConfig {
  return (
    !!c &&
    (QUESTION_COUNTS as readonly number[]).includes(c.questionCount as number) &&
    DIFFICULTIES.includes(c.difficulty as QuestionDifficulty) &&
    TIME_OPTIONS.includes(c.timeLimitMinutes as number | null)
  );
}

/** Última configuración usada para el tema, o el valor por defecto. */
export async function getExamConfig(topicId: string): Promise<ExamConfig> {
  let config: ExamConfig = defaultExamConfigs[topicId] ?? { topicId, questionCount: 10, difficulty: "media", timeLimitMinutes: 15 };
  try {
    const raw = localStorage.getItem(configKey(topicId));
    if (raw) {
      const saved = JSON.parse(raw) as ExamConfig;
      if (isValid(saved)) config = { ...saved, topicId };
    }
  } catch {
    /* configuración corrupta: se usa la de defecto */
  }
  return mockDelay(config, 150);
}

export function saveExamConfig(config: ExamConfig) {
  try {
    localStorage.setItem(configKey(config.topicId), JSON.stringify(config));
  } catch {
    /* no crítico */
  }
}

export interface GradeInput {
  questions: StudyQuestion[];
  attempts: QuestionAttempt[];
  config: ExamConfig;
  durationSeconds: number;
  timedOut: boolean;
  summary?: TopicSummary;
}

/** Una pregunta se considera omitida si no tiene respuesta. */
export function isOmitted(q: StudyQuestion, a?: QuestionAttempt): boolean {
  if (!a) return true;
  return q.type === "abierta" ? !(a.openAnswerText?.trim().length) : !a.selectedOptionId;
}

export function gradeExam({ questions, attempts, config, durationSeconds, timedOut, summary }: GradeInput): ExamResult {
  const byId = new Map(attempts.map((a) => [a.questionId, a]));

  const perLevel: Record<QuestionDifficulty, DifficultyPerformance> = {
    facil: { total: 0, correct: 0, earned: 0, max: 0, percent: 0 },
    media: { total: 0, correct: 0, earned: 0, max: 0, percent: 0 },
    dificil: { total: 0, correct: 0, earned: 0, max: 0, percent: 0 },
  };

  let correctCount = 0;
  let omittedCount = 0;
  let score = 0;
  const review: string[] = [];
  const missedByHeading = new Map<string, { missed: number; total: number }>();
  const totalsByHeading = new Map<string, number>();

  for (const q of questions) {
    const attempt = byId.get(q.id);
    const weight = QUESTION_WEIGHT[q.difficulty];
    const omitted = isOmitted(q, attempt);
    const correct = !omitted && !!attempt?.isCorrect;
    const heading = classifyQuestion(q, summary);

    perLevel[q.difficulty].total += 1;
    perLevel[q.difficulty].max += weight;
    if (heading) totalsByHeading.set(heading, (totalsByHeading.get(heading) ?? 0) + 1);

    if (correct) {
      correctCount += 1;
      score += weight;
      perLevel[q.difficulty].correct += 1;
      perLevel[q.difficulty].earned += weight;
    } else {
      review.push(q.id);
      if (omitted) omittedCount += 1;
      if (heading) {
        const cur = missedByHeading.get(heading) ?? { missed: 0, total: 0 };
        missedByHeading.set(heading, { missed: cur.missed + 1, total: 0 });
      }
    }
  }

  for (const level of DIFFICULTIES) {
    const p = perLevel[level];
    p.percent = p.total > 0 ? Math.round((p.earned / p.max) * 100) : 0;
  }

  const counts = emptyCounts();
  questions.forEach((q) => (counts[q.difficulty] += 1));
  const maxScore = maxScoreFor(counts);
  const totalQuestions = questions.length;

  const weakConcepts: WeakConcept[] = [...missedByHeading.entries()]
    .map(([term, v]) => ({ term, missed: v.missed, total: totalsByHeading.get(term) ?? v.missed }))
    .sort((a, b) => b.missed / b.total - a.missed / a.total || b.missed - a.missed)
    .slice(0, 3);

  return {
    examId: `exam-${Date.now()}`,
    topicId: questions[0]?.topicId ?? config.topicId,
    config,
    correctCount,
    incorrectCount: totalQuestions - correctCount - omittedCount,
    omittedCount,
    totalQuestions,
    score,
    maxScore,
    scorePercent: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    durationSeconds,
    durationLabel: formatSeconds(durationSeconds),
    timedOut,
    byDifficulty: perLevel,
    weakConcepts,
    reviewQuestionIds: review,
  };
}

export interface StoredResult {
  result: ExamResult;
  questions: StudyQuestion[];
  attempts: QuestionAttempt[];
}

/** Guarda el último resultado para que /results sobreviva a un refresco. */
export function saveLastResult(data: StoredResult) {
  try {
    sessionStorage.setItem(resultKey(data.result.topicId), JSON.stringify(data));
  } catch {
    /* no crítico */
  }
}

export function loadLastResult(topicId: string): StoredResult | null {
  try {
    const raw = sessionStorage.getItem(resultKey(topicId));
    return raw ? (JSON.parse(raw) as StoredResult) : null;
  } catch {
    return null;
  }
}

export async function getPastExams(): Promise<PastExam[]> {
  return mockDelay(pastExams, 400);
}

export type AnswerMap = Record<string, { optionId?: string; openText?: string }>;

/** Convierte las respuestas del usuario en intentos evaluados. */
export function buildAttempts(questions: StudyQuestion[], answers: AnswerMap): QuestionAttempt[] {
  return questions.map((q) => {
    const answer = answers[q.id];
    const isCorrect = q.type === "abierta" ? (answer?.openText?.trim().length ?? 0) > 8 : !!answer?.optionId && answer.optionId === q.correctOptionId;
    return { questionId: q.id, selectedOptionId: answer?.optionId, openAnswerText: answer?.openText, isCorrect };
  });
}
