import { Check, ChevronDown, RotateCcw } from "lucide-react";
import type { StudyQuestion } from "../types";
import type { QuestionStatus } from "../utils/questionStatus";
import { difficultyLabel } from "../utils/format";
import Badge from "./Badge";

interface QuestionCardProps {
  question: StudyQuestion;
  number: number;
  open: boolean;
  status?: QuestionStatus;
  related: string[];
  onToggle: () => void;
  onStatus: (status: QuestionStatus | null) => void;
}

const tone = { facil: "green", media: "amber", dificil: "red" } as const;

/**
 * Pregunta de estudio como fila desplegable (no como tarjeta):
 * enunciado + [Ver respuesta] → respuesta, explicación y conceptos relacionados.
 */
export default function QuestionCard({ question, number, open, status, related, onToggle, onStatus }: QuestionCardProps) {
  const panelId = `q-panel-${question.id}`;
  const correctLabel = question.type === "abierta" ? question.correctAnswerText : question.options?.find((o) => o.id === question.correctOptionId)?.label;

  return (
    <article className={`qitem ${open ? "open" : ""} ${status ? `is-${status}` : ""}`}>
      <button className="qitem-head" onClick={onToggle} aria-expanded={open} aria-controls={panelId}>
        <span className="qitem-num mono">{String(number).padStart(2, "0")}</span>
        <span className="qitem-prompt">{question.prompt}</span>
        <span className="qitem-side">
          <Badge tone={tone[question.difficulty]}>{difficultyLabel(question.difficulty)}</Badge>
          {status === "known" && (
            <span className="qstatus known" title="Respondida correctamente">
              <Check size={13} strokeWidth={3} />
            </span>
          )}
          {status === "review" && (
            <span className="qstatus review" title="Por repasar">
              <RotateCcw size={12} strokeWidth={3} />
            </span>
          )}
          <span className="qitem-toggle">
            {open ? "Ocultar" : "Ver respuesta"}
            <ChevronDown size={15} />
          </span>
        </span>
      </button>

      <div className="qitem-collapse" id={panelId} role="region" aria-hidden={!open}>
        <div className="qitem-collapse-inner">
          <div className="qitem-body">
            {question.type !== "abierta" && question.options && (
              <ul className="qitem-options">
                {question.options.map((o, i) => (
                  <li key={o.id} className={o.id === question.correctOptionId ? "correct" : ""}>
                    <span className="qitem-letter">{question.type === "verdadero-falso" ? (o.id === "v" ? "V" : "F") : String.fromCharCode(65 + i)}</span>
                    {o.label}
                    {o.id === question.correctOptionId && <Check size={14} strokeWidth={3} aria-label="Respuesta correcta" />}
                  </li>
                ))}
              </ul>
            )}

            <div className="qitem-section">
              <h4>Respuesta</h4>
              <p className="qitem-answer">{correctLabel}</p>
            </div>
            <div className="qitem-section">
              <h4>Explicación</h4>
              <p>{question.explanation}</p>
            </div>
            {related.length > 0 && (
              <div className="qitem-section">
                <h4>Conceptos relacionados</h4>
                <div className="chip-list">
                  {related.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="qitem-actions">
              <span>¿Qué tal te fue?</span>
              <button className={`mark-btn ${status === "known" ? "on-known" : ""}`} onClick={() => onStatus(status === "known" ? null : "known")} aria-pressed={status === "known"}>
                <Check size={14} /> La sabía
              </button>
              <button className={`mark-btn ${status === "review" ? "on-review" : ""}`} onClick={() => onStatus(status === "review" ? null : "review")} aria-pressed={status === "review"}>
                <RotateCcw size={14} /> Repasar
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
