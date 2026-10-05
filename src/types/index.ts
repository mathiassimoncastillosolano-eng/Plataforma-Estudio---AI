// ---------------------------------------------------------------------------
// Tipos centrales de la plataforma.
// Estas interfaces representan la futura forma de los recursos del backend
// (Spring Boot + PostgreSQL). Mantenerlas aquí facilita reemplazar los
// servicios mock por llamadas HTTP reales sin tocar los componentes.
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export type MasteryLevel = "inicial" | "en-progreso" | "buen-dominio" | "alto-dominio";

export interface StudyTopic {
  id: string;
  title: string;
  category: string;
  description?: string;
  mastery: number; // 0-100, indicador estimado de dominio
  masteryLevel: MasteryLevel;
  lastStudiedAt: string; // texto amigable ("Hoy", "Ayer", "Hace 3 días")
  createdAt: string;
  questionsAnswered: number;
  examsCompleted: number;
  sourceType: "pdf" | "text";
  sourceName?: string;
}

export interface SourceDraft {
  topicTitle: string;
  category: string;
  sourceType: "pdf" | "text";
  fileName?: string;
  fileSizeLabel?: string;
  rawText?: string;
}

export interface SummarySection {
  heading: string;
  body: string;
  bullets?: string[];
}

export interface KeyConcept {
  order: number;
  term: string;
  definition: string;
}

export interface TopicSummary {
  topicId: string;
  essential: {
    intro: string;
    keyConcepts: KeyConcept[];
    relations: string[];
  };
  complete: {
    sections: SummarySection[];
  };
}

export type QuestionDifficulty = "facil" | "media" | "dificil";
export type QuestionType = "opcion-multiple" | "verdadero-falso" | "abierta";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface StudyQuestion {
  id: string;
  topicId: string;
  prompt: string;
  type: QuestionType;
  difficulty: QuestionDifficulty;
  options?: QuestionOption[];
  correctOptionId?: string;
  correctAnswerText?: string;
  explanation: string;
}

export interface QuestionAttempt {
  questionId: string;
  selectedOptionId?: string;
  openAnswerText?: string;
  isCorrect: boolean;
}

export type ExamDifficulty = QuestionDifficulty;
export type ExamTimeLimit = number | null; // minutos; null = sin límite

/** Configuración elegida por el usuario antes de iniciar una prueba. */
export interface ExamConfig {
  topicId: string;
  questionCount: number;
  difficulty: ExamDifficulty;
  /** Duración en minutos. null = sin límite de tiempo. */
  timeLimitMinutes: ExamTimeLimit;
}

export type DifficultyCounts = Record<QuestionDifficulty, number>;

export interface ExamAttempt {
  id: string;
  topicId: string;
  startedAt: string;
  finishedAt?: string;
  answers: QuestionAttempt[];
  questionIds: string[];
  durationSeconds?: number;
}

export interface DifficultyPerformance {
  total: number;
  correct: number;
  /** puntos obtenidos / puntos máximos de este nivel */
  earned: number;
  max: number;
  percent: number;
}

export interface WeakConcept {
  term: string;
  missed: number;
  total: number;
}

export interface ExamResult {
  examId: string;
  topicId: string;
  config: ExamConfig;
  correctCount: number;
  incorrectCount: number;
  omittedCount: number;
  totalQuestions: number;
  /** Puntaje ponderado (fácil 0.5 · media 1 · difícil 2) */
  score: number;
  maxScore: number;
  /** Porcentaje ponderado = score / maxScore */
  scorePercent: number;
  durationSeconds: number;
  durationLabel: string;
  timedOut: boolean;
  byDifficulty: Record<QuestionDifficulty, DifficultyPerformance>;
  weakConcepts: WeakConcept[];
  reviewQuestionIds: string[];
}

export interface MindMapNodeData {
  id: string;
  label: string;
  detail?: string;
  level: 0 | 1 | 2;
  parentId?: string | null;
  x: number;
  y: number;
}

export interface MindMapEdgeData {
  id: string;
  source: string;
  target: string;
}

export interface MindMap {
  topicId: string;
  nodes: MindMapNodeData[];
  edges: MindMapEdgeData[];
}

export interface ProgressSnapshot {
  date: string; // etiqueta corta, ej. "Ene 12"
  masteryAverage: number;
}

export interface DashboardStats {
  topicsStudied: number;
  studyHours: number;
  questionsAnswered: number;
  averageMastery: number;
}

export interface AsyncState<T> {
  status: "idle" | "loading" | "success" | "error";
  data?: T;
  error?: string;
}
