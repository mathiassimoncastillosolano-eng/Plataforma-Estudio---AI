import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import * as studyService from "../services/studyService";
import { getMasteryLevel } from "../data/studyTopics";
import type { StudyQuestion } from "../types";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import QuestionCard from "../components/QuestionCard";
import MasteryGauge from "../components/MasteryGauge";
import Button from "../components/Button";
import Card from "../components/Card";

export default function QuestionsPage() {
  const { topic, setTopic } = useTopicContext();
  const [questions, setQuestions] = useState<StudyQuestion[] | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  async function load() {
    setStatus("loading");
    setCurrentIndex(0);
    setCorrect(0);
    setIncorrect(0);
    setFinished(false);
    try {
      const result = await aiService.generateQuestions(topic.id, topic.title);
      setQuestions(result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  function handleAnswered(isCorrect: boolean) {
    if (isCorrect) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
  }

  async function handleNext() {
    if (!questions) return;
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
      const answered = correct + incorrect;
      const sessionScore = answered > 0 ? Math.round((correct / answered) * 100) : topic.mastery;
      // Combina el dominio previo con el resultado de esta práctica para una transición suave.
      const blended = Math.min(100, Math.round(topic.mastery * 0.4 + sessionScore * 0.6));
      const updated = await studyService.updateTopicMastery(topic.id, blended);
      await studyService.incrementQuestionsAnswered(topic.id, questions.length);
      if (updated) setTopic(updated);
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }

  if (status === "loading") return <LoadingState message="Generando preguntas..." />;
  if (status === "error") return <ErrorState onRetry={load} />;
  if (!questions || questions.length === 0) {
    return <EmptyState title="No hay preguntas disponibles" description="Todavía no se generaron preguntas para este tema." />;
  }

  if (finished) {
    const total = correct + incorrect;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="questions-shell">
        <Card>
          <div className="results-hero" style={{ padding: "10px 0 6px" }}>
            <MasteryGauge value={percent} label="Aciertos" size={140} />
            <h2 style={{ marginTop: 20 }}>Práctica completada</h2>
            <p className="text-muted" style={{ marginTop: 8 }}>
              Respondiste correctamente {correct} de {total} preguntas.
            </p>
            <div className="results-actions">
              <Button variant="secondary" onClick={load}>
                <RotateCcw size={15} />
                Practicar de nuevo
              </Button>
              <Link to={`/study/${topic.id}/exam`} className="btn btn-primary">
                Ir a la prueba
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const current = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="questions-shell">
      <p style={{ fontFamily: "var(--font-display)", fontSize: 19, marginBottom: 18 }}>Comprueba cuánto sabes</p>

      <div className="questions-progress-bar">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
      <div className="questions-tally">
        <span className="text-muted">
          Correctas: <strong style={{ color: "var(--green)" }}>{correct}</strong>
        </span>
        <span className="text-muted">
          Incorrectas: <strong style={{ color: "var(--red)" }}>{incorrect}</strong>
        </span>
      </div>

      <QuestionCard
        key={current.id}
        question={current}
        index={currentIndex}
        total={questions.length}
        onAnswered={handleAnswered}
        onNext={handleNext}
        isLast={currentIndex + 1 >= questions.length}
      />
    </div>
  );
}
