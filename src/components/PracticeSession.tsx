import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import type { StudyQuestion } from "../types";
import { useTopicContext } from "../layouts/topicContext";
import * as studyService from "../services/studyService";
import PracticeQuestion from "./PracticeQuestion";
import MasteryGauge from "./MasteryGauge";
import Button from "./Button";

interface Props {
  questions: StudyQuestion[];
  /** Notifica cada respuesta para registrar el estado de la pregunta. */
  onAnswered: (questionId: string, isCorrect: boolean) => void;
  onExit: () => void;
}

/**
 * Práctica guiada (comportamiento original): una pregunta a la vez, con
 * retroalimentación inmediata y actualización del indicador de dominio.
 */
export default function PracticeSession({ questions, onAnswered, onExit }: Props) {
  const { topic, setTopic } = useTopicContext();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [finished, setFinished] = useState(false);
  const [round, setRound] = useState(0);

  function handleAnswered(questionId: string, isCorrect: boolean) {
    if (isCorrect) setCorrect((c) => c + 1);
    else setIncorrect((c) => c + 1);
    onAnswered(questionId, isCorrect);
  }

  async function handleNext() {
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

  function restart() {
    setCurrentIndex(0);
    setCorrect(0);
    setIncorrect(0);
    setFinished(false);
    setRound((r) => r + 1);
  }

  if (finished) {
    const total = correct + incorrect;
    const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="practice-done">
        <MasteryGauge value={percent} label="Aciertos" size={150} />
        <h2>Práctica completada</h2>
        <p className="text-muted">
          Respondiste correctamente {correct} de {total} preguntas.
        </p>
        <div className="results-actions">
          <Button variant="secondary" onClick={restart}>
            <RotateCcw size={15} />
            Practicar de nuevo
          </Button>
          <Button variant="secondary" onClick={onExit}>
            Volver a la lista
          </Button>
          <Link to={`/study/${topic.id}/exam`} className="btn btn-primary">
            Ir a la prueba
          </Link>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const progressPercent = Math.round((currentIndex / questions.length) * 100);

  return (
    <div className="practice">
      <div className="practice-top">
        <div className="progress-track" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="practice-tally">
          <span className="text-muted">
            Correctas: <strong style={{ color: "var(--color-success)" }}>{correct}</strong>
          </span>
          <span className="text-muted">
            Incorrectas: <strong style={{ color: "var(--color-danger)" }}>{incorrect}</strong>
          </span>
        </div>
      </div>

      <PracticeQuestion
        key={`${round}-${current.id}`}
        question={current}
        index={currentIndex}
        total={questions.length}
        onAnswered={(ok) => handleAnswered(current.id, ok)}
        onNext={handleNext}
        isLast={currentIndex + 1 >= questions.length}
      />
    </div>
  );
}
