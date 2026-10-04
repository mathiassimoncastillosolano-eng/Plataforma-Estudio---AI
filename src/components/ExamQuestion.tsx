import type { StudyQuestion } from "../types";

interface ExamQuestionProps {
  question: StudyQuestion;
  index: number;
  total: number;
  selectedOptionId?: string;
  openAnswerText?: string;
  onSelectOption: (optionId: string) => void;
  onChangeOpenAnswer: (text: string) => void;
}

export default function ExamQuestion({
  question,
  index,
  total,
  selectedOptionId,
  openAnswerText,
  onSelectOption,
  onChangeOpenAnswer,
}: ExamQuestionProps) {
  return (
    <div className="question-card">
      <div className="question-eyebrow">
        <span className="text-muted mono" style={{ fontSize: 13 }}>
          Pregunta {index + 1} de {total}
        </span>
      </div>

      <p className="question-prompt">{question.prompt}</p>

      {question.type === "abierta" ? (
        <textarea
          className="textarea"
          style={{ minHeight: 110 }}
          placeholder="Escribe tu respuesta..."
          value={openAnswerText ?? ""}
          onChange={(e) => onChangeOpenAnswer(e.target.value)}
        />
      ) : (
        <div className="answer-options">
          {question.options?.map((option) => (
            <button
              key={option.id}
              className={`answer-option ${option.id === selectedOptionId ? "selected" : ""}`}
              onClick={() => onSelectOption(option.id)}
            >
              <span className="option-marker">{option.id.toUpperCase()}</span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
