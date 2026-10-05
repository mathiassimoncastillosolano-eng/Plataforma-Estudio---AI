import type { DifficultyCounts, ExamConfig, ExamDifficulty, QuestionDifficulty, StudyQuestion } from "../types";

// ---------------------------------------------------------------------------
// Lógica pura (sin React) del sistema de pruebas.
// Todo lo que decide la composición y el puntaje de una prueba vive aquí para
// que sea fácil de probar y de reemplazar por una API real más adelante.
// ---------------------------------------------------------------------------

export const DIFFICULTIES: QuestionDifficulty[] = ["facil", "media", "dificil"];
export const QUESTION_COUNTS = [10, 15, 20, 25] as const;
/** Minutos disponibles. null = sin límite. */
export const TIME_OPTIONS: (number | null)[] = [5, 10, 15, 20, 30, null];

/** Peso de cada pregunta, en medios puntos para operar siempre con enteros. */
const WEIGHT_HALF_POINTS: Record<QuestionDifficulty, number> = { facil: 1, media: 2, dificil: 4 };
export const QUESTION_WEIGHT: Record<QuestionDifficulty, number> = { facil: 0.5, media: 1, dificil: 2 };

/** Perfiles de dificultad en porcentaje entero. Cada fila suma 100. */
export const DIFFICULTY_PROFILES: Record<ExamDifficulty, Record<QuestionDifficulty, number>> = {
  facil: { facil: 75, media: 20, dificil: 5 },
  media: { facil: 20, media: 60, dificil: 20 },
  dificil: { facil: 5, media: 20, dificil: 75 },
};

export const emptyCounts = (): DifficultyCounts => ({ facil: 0, media: 0, dificil: 0 });
export const sumCounts = (c: DifficultyCounts) => c.facil + c.media + c.dificil;

/**
 * Reparte `count` preguntas según el perfil con el método del resto mayor.
 * Aritmética entera: la suma es SIEMPRE exactamente `count`.
 * En empate de restos gana el nivel con mayor porcentaje en el perfil.
 */
export function computeDistribution(count: number, difficulty: ExamDifficulty): DifficultyCounts {
  const profile = DIFFICULTY_PROFILES[difficulty];
  const result = emptyCounts();
  const remainders: { level: QuestionDifficulty; rem: number; pct: number }[] = [];

  for (const level of DIFFICULTIES) {
    const exactTimes100 = count * profile[level];
    result[level] = Math.floor(exactTimes100 / 100);
    remainders.push({ level, rem: exactTimes100 % 100, pct: profile[level] });
  }

  let missing = count - sumCounts(result);
  remainders.sort((a, b) => b.rem - a.rem || b.pct - a.pct);
  for (let i = 0; missing > 0; i = (i + 1) % remainders.length) {
    result[remainders[i].level] += 1;
    missing -= 1;
  }
  return result;
}

export function countByDifficulty(pool: StudyQuestion[]): DifficultyCounts {
  const counts = emptyCounts();
  for (const q of pool) counts[q.difficulty] += 1;
  return counts;
}

export function maxScoreFor(counts: DifficultyCounts): number {
  const half = DIFFICULTIES.reduce((acc, level) => acc + counts[level] * WEIGHT_HALF_POINTS[level], 0);
  return half / 2;
}

export function pointsFor(level: QuestionDifficulty): number {
  return QUESTION_WEIGHT[level];
}

export function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export interface ExamPlan {
  /** Composición ideal según el perfil. */
  target: DifficultyCounts;
  /** Composición real que el banco puede entregar (suma = count si es factible). */
  actual: DifficultyCounts;
  /** true si `actual` difiere de `target` por falta de preguntas de algún nivel. */
  adjusted: boolean;
  /** false si el banco no alcanza para `count` preguntas. */
  feasible: boolean;
  available: number;
  maxScore: number;
}

/**
 * Calcula, sin azar, qué composición se puede construir con el banco disponible.
 * Si falta de un nivel, el faltante se cubre con el nivel más afín al perfil
 * elegido. Nunca devuelve una prueba con menos preguntas de las pedidas:
 * si el banco total no alcanza, `feasible` es false.
 */
export function planExam(available: DifficultyCounts, count: number, difficulty: ExamDifficulty): ExamPlan {
  const target = computeDistribution(count, difficulty);
  const total = sumCounts(available);
  const actual: DifficultyCounts = {
    facil: Math.min(target.facil, available.facil),
    media: Math.min(target.media, available.media),
    dificil: Math.min(target.dificil, available.dificil),
  };

  if (total < count) {
    return { target, actual, adjusted: false, feasible: false, available: total, maxScore: maxScoreFor(target) };
  }

  const profile = DIFFICULTY_PROFILES[difficulty];
  const priority = [...DIFFICULTIES].sort((a, b) => profile[b] - profile[a]);
  let missing = count - sumCounts(actual);
  while (missing > 0) {
    const level = priority.find((l) => actual[l] < available[l]);
    if (!level) break; // no debería ocurrir: total >= count
    actual[level] += 1;
    missing -= 1;
  }

  const adjusted = DIFFICULTIES.some((l) => actual[l] !== target[l]);
  return { target, actual, adjusted, feasible: true, available: total, maxScore: maxScoreFor(actual) };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface BuiltExam {
  questions: StudyQuestion[];
  plan: ExamPlan;
}

/** Construye la prueba real. Devuelve null si el banco no alcanza. */
export function buildExam(pool: StudyQuestion[], config: ExamConfig, rng: () => number = Math.random): BuiltExam | null {
  const plan = planExam(countByDifficulty(pool), config.questionCount, config.difficulty);
  if (!plan.feasible) return null;

  const picked: StudyQuestion[] = [];
  for (const level of DIFFICULTIES) {
    const bucket = shuffle(
      pool.filter((q) => q.difficulty === level),
      rng
    );
    picked.push(...bucket.slice(0, plan.actual[level]));
  }
  return { questions: shuffle(picked, rng), plan };
}

/** Segundos por pregunta disponibles; sirve para avisar de tiempos muy ajustados. */
export function secondsPerQuestion(config: Pick<ExamConfig, "questionCount" | "timeLimitMinutes">): number | null {
  if (config.timeLimitMinutes === null) return null;
  return Math.round((config.timeLimitMinutes * 60) / config.questionCount);
}

export function timeLabel(minutes: number | null): string {
  return minutes === null ? "Sin límite" : `${minutes} min`;
}
