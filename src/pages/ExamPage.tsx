import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import * as examService from "../services/examService";
import * as studyService from "../services/studyService";
import { formatSeconds, difficultyLabel } from "../utils/format";
import type { ExamConfig, QuestionAttempt, StudyQuestion } from "../types";
import { LoadingState, ErrorState } from "../components/States";
import Card from "../components/Card";
import Button from "../components/Button";
import ExamQuestion from "../components/ExamQuestion";

type Phase = "loading" | "intro" | "running" | "error";

export default function ExamPage() {
  const { topic } = useTopicContext();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>("loading");
  const [config, setConfig] = useState<ExamConfig | null>(null);
  const [questions, setQuestions] = useState<StudyQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { optionId?: string; openText?: string }>>({});
  const [seconds, setSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setPhase("loading");
    try {
      const [examConfig, allQuestions] = await Promise.all([
        examService.getExamConfig(topic.id),
        aiService.generateQuestions(topic.id, topic.title),
      ]);
      setConfig(examConfig);
      setQuestions(allQuestions.slice(0, examConfig.questionCount));
      setPhase("intro");
    } catch {
      setPhase("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  useEffect(() => {
    if (phase !== "running") return;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [phase]);

  function startExam() {
    setSeconds(0);
    setIndex(0);
    setAnswers({});
    setPhase("running");
  }

  function selectOption(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { optionId } }));
  }

  function setOpenAnswer(questionId: string, text: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: { openText: text } }));
  }

  async function finishExam() {
    setSubmitting(true);
    const attempts: QuestionAttempt[] = questions.map((q) => {
      const answer = answers[q.id];
      const isCorrect =
        q.type === "abierta"
          ? (answer?.openText?.trim().length ?? 0) > 8
          : answer?.optionId === q.correctOptionId;
      return {
        questionId: q.id,
        selectedOptionId: answer?.optionId,
        openAnswerText: answer?.openText,
        isCorrect,
      };
    });

    const result = examService.gradeExam(questions, attempts, seconds);
    await studyService.incrementExamsCompleted(topic.id);
    const blended = Math.min(100, Math.round(topic.mastery * 0.35 + result.scorePercent * 0.65));
    await studyService.updateTopicMastery(topic.id, blended);

    navigate(`/study/${topic.id}/results`, {
      state: { result, questions, attempts },
    });
  }

  if (phase === "loading") return <LoadingState message="Preparando tu prueba..." />;
  if (phase === "error" || !config) return <ErrorState onRetry={load} />;

  if (phase === "intro") {
    return (
      <Card className="exam-intro-card">
        <div className="exam-intro-icon">
          <ClipboardCheck size={26} />
        </div>
        <h2>Prueba de conocimientos</h2>
        <p className="text-muted" style={{ marginTop: 6 }}>
          {topic.title}
        </p>

        <div className="exam-intro-meta">
          <div className="exam-intro-meta-item">
            <strong>{config.questionCount}</strong>
            <span>preguntas</span>
          </div>
          <div className="exam-intro-meta-item">
            <strong>{difficultyLabel(config.difficulty)}</strong>
            <span>dificultad</span>
          </div>
          <div className="exam-intro-meta-item">
            <strong>{config.estimatedMinutes} min</strong>
            <span>estimado</span>
          </div>
        </div>

        <Button size="lg" onClick={startExam}>
          Comenzar prueba
        </Button>
      </Card>
    );
  }

  const current = questions[index];
  const currentAnswer = answers[current.id];
  const progressPercent = Math.round(((index + 1) / questions.length) * 100);

  return (
    <div className="questions-shell">
      <div className="questions-top-row">
        <span>Prueba de conocimientos</span>
        <span className="exam-timer">{formatSeconds(seconds)}</span>
      </div>
      <div className="questions-progress-bar" style={{ marginBottom: 22 }}>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <ExamQuestion
        question={current}
        index={index}
        total={questions.length}
        selectedOptionId={currentAnswer?.optionId}
        openAnswerText={currentAnswer?.openText}
        onSelectOption={(optionId) => selectOption(current.id, optionId)}
        onChangeOpenAnswer={(text) => setOpenAnswer(current.id, text)}
      />

      <div className="question-nav-row">
        <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <ChevronLeft size={15} />
          Anterior
        </Button>
        {index + 1 < questions.length ? (
          <Button onClick={() => setIndex((i) => i + 1)}>
            Siguiente
            <ChevronRight size={15} />
          </Button>
        ) : (
          <Button onClick={finishExam} loading={submitting}>
            Finalizar prueba
          </Button>
        )}
      </div>
    </div>
  );
}
