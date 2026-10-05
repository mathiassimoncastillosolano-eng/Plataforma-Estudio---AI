import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import * as examService from "../services/examService";
import * as studyService from "../services/studyService";
import type { ExamConfig, StudyQuestion, TopicSummary } from "../types";
import { QUESTION_COUNTS, buildExam } from "../utils/examBuilder";
import { setStatuses, type StatusMap } from "../utils/questionStatus";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import ExamConfigurator from "../components/exam/ExamConfigurator";
import ExamRunner from "../components/exam/ExamRunner";

type Phase = "loading" | "config" | "running" | "error";

export default function ExamPage() {
  const { topic, setTopic } = useTopicContext();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [pool, setPool] = useState<StudyQuestion[]>([]);
  const [summary, setSummary] = useState<TopicSummary | undefined>();
  const [examQuestions, setExamQuestions] = useState<StudyQuestion[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setPhase("loading");
    try {
      const [saved, questions, concepts] = await Promise.all([examService.getExamConfig(topic.id), aiService.generateQuestions(topic.id, topic.title), aiService.getTopicConcepts(topic.id, topic.title)]);
      // Si la configuración guardada pide más preguntas de las disponibles, se ajusta.
      let questionCount = saved.questionCount;
      if (questionCount > questions.length) {
        const fits = [...QUESTION_COUNTS].filter((n) => n <= questions.length);
        questionCount = fits.length > 0 ? fits[fits.length - 1] : questions.length;
      }
      setConfig({ ...saved, questionCount });
      setPool(questions);
      setSummary(concepts.summary);
      setPhase("config");
    } catch {
      setPhase("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  function startExam() {
    if (!config) return;
    const built = buildExam(pool, config);
    if (!built) return; // el botón ya está deshabilitado si no es factible
    examService.saveExamConfig(config);
    setExamQuestions(built.questions);
    setPhase("running");
  }

  async function handleSubmit({ answers, seconds, timedOut }: { answers: examService.AnswerMap; seconds: number; timedOut: boolean }) {
    if (!config) return;
    setSubmitting(true);
    try {
      const attempts = examService.buildAttempts(examQuestions, answers);
      const result = examService.gradeExam({ questions: examQuestions, attempts, config, durationSeconds: seconds, timedOut, summary });

      // Cada pregunta queda marcada para el modo estudio: acertada o por repasar
      const updates: StatusMap = {};
      attempts.forEach((a) => (updates[a.questionId] = a.isCorrect ? "known" : "review"));
      setStatuses(topic.id, updates);

      await studyService.incrementExamsCompleted(topic.id);
      const blended = Math.min(100, Math.round(topic.mastery * 0.35 + result.scorePercent * 0.65));
      const updated = await studyService.updateTopicMastery(topic.id, blended);
      if (updated) setTopic(updated);

      const stored = { result, questions: examQuestions, attempts };
      examService.saveLastResult(stored);
      navigate(`/study/${topic.id}/results`, { state: stored });
    } catch {
      setSubmitting(false);
      setPhase("error");
    }
  }

  if (phase === "loading") return <LoadingState message="Preparando tu prueba..." />;
  if (phase === "error" || !config) return <ErrorState onRetry={load} />;
  if (pool.length === 0) {
    return <EmptyState title="Este tema aún no tiene preguntas" description="Cuando la IA genere preguntas para el tema, podrás configurar una prueba." />;
  }

  if (phase === "running") {
    return <ExamRunner topicTitle={topic.title} questions={examQuestions} config={config} submitting={submitting} onSubmit={handleSubmit} onExit={() => setPhase("config")} />;
  }

  return <ExamConfigurator topicTitle={topic.title} pool={pool} config={config} onChange={setConfig} onStart={startExam} />;
}
