import type { ExamConfig, ExamResult, QuestionAttempt, StudyQuestion } from "../types";
import { defaultExamConfigs, pastExams, type PastExam } from "../data/exams";
import { mockDelay } from "../utils/mockDelay";

// -----------------------------------------------------------------------
// Servicio de exámenes.
// A futuro llamará a endpoints como POST /api/exams, POST /api/exams/:id/submit.
// -----------------------------------------------------------------------

export async function getExamConfig(topicId: string): Promise<ExamConfig> {
  const config =
    defaultExamConfigs[topicId] ??
    ({ topicId, questionCount: 5, difficulty: "mixta", estimatedMinutes: 7 } as ExamConfig);
  return mockDelay(config, 300);
}

export function gradeExam(
  questions: StudyQuestion[],
  answers: QuestionAttempt[],
  durationSeconds: number
): ExamResult {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = questions.length;
  const incorrectCount = totalQuestions - correctCount;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  return {
    examId: `exam-${Date.now()}`,
    topicId: questions[0]?.topicId ?? "",
    correctCount,
    incorrectCount,
    totalQuestions,
    scorePercent,
    durationLabel: `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`,
    reviewQuestionIds: answers.filter((a) => !a.isCorrect).map((a) => a.questionId),
  };
}

export async function getPastExams(): Promise<PastExam[]> {
  return mockDelay(pastExams, 400);
}
