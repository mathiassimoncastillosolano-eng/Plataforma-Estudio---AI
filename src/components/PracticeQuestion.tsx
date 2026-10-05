import { useState } from "react";
import { Check, X } from "lucide-react";
import type { StudyQuestion } from "../types";
import Badge from "./Badge";
import Button from "./Button";
import { difficultyLabel } from "../utils/format";

interface PracticeQuestionProps {
  question: StudyQuestion;
  index: number;
  total: number;
  onAnswered: (isCorrect: boolean) => void;
  onNext: () => void;
  isLast: boolean;
}

const difficultyTone: Record<string, "green" | "amber" | "red"> = {
  facil: "green",
  media: "amber",
  dificil: "red",
};

export default function PracticeQuestion({ question, index, total, onAnswered, onNext, isLast }: PracticeQuestionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState("");
  const [checked, setChecked] = useState(false);

  const isCorrect =
    question.type === "abierta"
      ? openAnswer.trim().length > 8
      : selectedId === question.correctOptionId;

  function handleCheck() {
    setChecked(true);
    onAnswered(isCorrect);
  }

  function handleNext() {
    setSelectedId(null);
    setOpenAnswer("");
    setChecked(false);
    onNext();
  }

  return (
    <div className="question-card">
      <div className="question-eyebrow">
        <span className="text-muted mono" style={{ fontSize: 13 }}>
          Pregunta {index + 1} de {total}
        </span>
        <Badge tone={difficultyTone[question.difficulty] ?? "neutral"}>
          {difficultyLabel(question.difficulty)}
        </Badge>
      </div>

      <p className="question-prompt">{question.prompt}</p>

      {question.type === "abierta" ? (
        <textarea
          className="textarea"
          style={{ minHeight: 110 }}
          placeholder="Escribe tu respuesta..."
          value={openAnswer}
          disabled={checked}
          onChange={(e) => setOpenAnswer(e.target.value)}
        />
      ) : (
        <div className="answer-options">
          {question.options?.map((option) => {
            let stateClass = "";
            if (checked) {
              if (option.id === question.correctOptionId) stateClass = "correct";
              else if (option.id === selectedId) stateClass = "incorrect";
            } else if (option.id === selectedId) {
              stateClass = "selected";
            }
            return (
              <button
                key={option.id}
                className={`answer-option ${stateClass}`}
                disabled={checked}
                onClick={() => setSelectedId(option.id)}
              >
                <span className="option-marker">
                  {checked && option.id === question.correctOptionId ? (
                    <Check size={13} />
                  ) : checked && option.id === selectedId ? (
                    <X size={13} />
                  ) : (
                    option.id.toUpperCase()
                  )}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {checked && (
        <div className={`feedback-panel ${isCorrect ? "correct" : "incorrect"}`}>
          <div>
            <h4>{isCorrect ? "✓ Correcto" : "✕ Incorrecto"}</h4>
            {!isCorrect && question.type !== "abierta" && (
              <p>
                <strong>Respuesta correcta: </strong>
                {question.options?.find((o) => o.id === question.correctOptionId)?.label}
              </p>
            )}
            {!isCorrect && question.type === "abierta" && (
              <p>
                <strong>Respuesta esperada: </strong>
                {question.correctAnswerText}
              </p>
            )}
            <p style={{ marginTop: 6 }}>{question.explanation}</p>
          </div>
        </div>
      )}

      <div className="question-nav-row">
        <span />
        {!checked ? (
          <Button
            onClick={handleCheck}
            disabled={question.type === "abierta" ? openAnswer.trim().length === 0 : !selectedId}
          >
            Comprobar respuesta
          </Button>
        ) : (
          <Button onClick={handleNext}>{isLast ? "Ver resumen" : "Siguiente pregunta"}</Button>
        )}
      </div>
    </div>
  );
}
