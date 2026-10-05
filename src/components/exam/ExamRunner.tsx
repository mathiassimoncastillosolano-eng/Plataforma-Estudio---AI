import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { ExamConfig, StudyQuestion } from "../../types";
import { QUESTION_WEIGHT, formatPoints } from "../../utils/examBuilder";
import { difficultyLabel } from "../../utils/format";
import type { AnswerMap } from "../../services/examService";
import Button from "../Button";
import Modal from "../Modal";
import ExamProgress from "./ExamProgress";

interface Props {
  topicTitle: string;
  questions: StudyQuestion[];
  config: ExamConfig;
  submitting: boolean;
  onSubmit: (payload: { answers: AnswerMap; seconds: number; timedOut: boolean }) => void;
  onExit: () => void;
}

/**
 * Modo concentración: pantalla completa sin sidebar ni header.
 * Solo pregunta, alternativas, progreso y tiempo.
 */
export default function ExamRunner({ topicTitle, questions, config, submitting, onSubmit, onExit }: Props) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [seconds, setSeconds] = useState(0);
  const [confirm, setConfirm] = useState<null | "finish" | "exit">(null);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

  const limitSeconds = config.timeLimitMinutes === null ? null : config.timeLimitMinutes * 60;
  const total = questions.length;
  const current = questions[index];
  const answer = answers[current.id];
  const isAnswered = (q: StudyQuestion) => {
    const a = answers[q.id];
    return q.type === "abierta" ? !!a?.openText?.trim() : !!a?.optionId;
  };
  const answeredCount = questions.filter(isAnswered).length;

  // Cronómetro basado en reloj real (no se desfasa si la pestaña queda en segundo plano)
  useEffect(() => {
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 250);
    return () => clearInterval(timer);
  }, []);

  function submit(timedOut: boolean) {
    if (doneRef.current) return;
    doneRef.current = true;
    onSubmit({ answers, seconds: limitSeconds !== null ? Math.min(seconds, limitSeconds) : seconds, timedOut });
  }

  // Fin automático al agotarse el tiempo
  useEffect(() => {
    if (limitSeconds !== null && seconds >= limitSeconds) submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds]);

  function goTo(next: number) {
    if (next < 0 || next >= total || next === index) return;
    setDir(next > index ? "next" : "prev");
    setIndex(next);
  }

  function selectOption(optionId: string) {
    setAnswers((prev) => ({ ...prev, [current.id]: { optionId } }));
  }

  function requestFinish() {
    if (answeredCount < total) setConfirm("finish");
    else submit(false);
  }

  // Atajos: ← → navegan · 1-4 / A-D eligen alternativa
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (confirm || submitting) return;
      const el = e.target as HTMLElement;
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return;
      if (e.key === "ArrowRight") goTo(index + 1);
      else if (e.key === "ArrowLeft") goTo(index - 1);
      else if (e.key === "Escape") setConfirm("exit");
      else if (current.type !== "abierta" && current.options) {
        const k = e.key.toLowerCase();
        const byNumber = "1234".indexOf(k);
        const byLetter = "abcd".indexOf(k);
        const idx = byNumber >= 0 ? byNumber : byLetter;
        const option = idx >= 0 ? current.options[idx] : undefined;
        if (option) selectOption(option.id);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const isLast = index === total - 1;

  // Portal al body: el modo concentración cubre toda la pantalla sin depender de los transforms del layout
  return createPortal(
    <div className="exam-focus" role="dialog" aria-modal="true" aria-label="Prueba en curso">
      <ExamProgress topicTitle={topicTitle} index={index} total={total} seconds={seconds} limitSeconds={limitSeconds} onExit={() => setConfirm("exit")} />

      <main className="focus-main">
        <div className="focus-col">
          <div className="focus-qmeta">
            <span className="mono">
              Pregunta {index + 1} de {total}
            </span>
            <span className={`pts-tag mix-${current.difficulty}-soft`} title={`Dificultad ${difficultyLabel(current.difficulty).toLowerCase()}`}>
              {formatPoints(QUESTION_WEIGHT[current.difficulty])} {QUESTION_WEIGHT[current.difficulty] === 1 ? "punto" : "puntos"}
            </span>
          </div>

          <div key={current.id} className={`focus-question q-enter-${dir}`}>
            <p className="focus-prompt">{current.prompt}</p>

            {current.type === "abierta" ? (
              <textarea
                className="textarea focus-textarea"
                placeholder="Escribe tu respuesta…"
                value={answer?.openText ?? ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [current.id]: { openText: e.target.value } }))}
              />
            ) : (
              <div className="focus-options" role="radiogroup" aria-label="Alternativas">
                {current.options?.map((option, i) => (
                  <button key={option.id} role="radio" aria-checked={answer?.optionId === option.id} className={`focus-option ${answer?.optionId === option.id ? "selected" : ""}`} onClick={() => selectOption(option.id)}>
                    <span className="focus-marker">{current.type === "verdadero-falso" ? i + 1 : String.fromCharCode(65 + i)}</span>
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="focus-nav">
            <Button variant="secondary" disabled={index === 0} onClick={() => goTo(index - 1)}>
              <ChevronLeft size={16} />
              Anterior
            </Button>
            <span className="focus-count hide-mobile">
              {answeredCount} de {total} respondidas
            </span>
            {isLast ? (
              <Button onClick={requestFinish} loading={submitting} icon={<Flag size={15} />}>
                Finalizar prueba
              </Button>
            ) : (
              <Button onClick={() => goTo(index + 1)}>
                Siguiente
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>

        <aside className="focus-rail" aria-label="Navegación entre preguntas">
          <p>Tus respuestas</p>
          <div className="navgrid">
            {questions.map((q, i) => (
              <button key={q.id} className={`navdot ${i === index ? "current" : ""} ${isAnswered(q) ? "done" : ""}`} onClick={() => goTo(i)} aria-label={`Ir a la pregunta ${i + 1}${isAnswered(q) ? " (respondida)" : ""}`} aria-current={i === index}>
                {i + 1}
              </button>
            ))}
          </div>
          <small>
            {answeredCount} de {total} respondidas
          </small>
          <small className="focus-keys hide-mobile">← → navegar · 1-4 elegir</small>
        </aside>
      </main>

      <Modal open={confirm === "finish"} onClose={() => setConfirm(null)} title="¿Finalizar la prueba?">
        <p className="text-muted" style={{ marginBottom: 18 }}>
          Tienes {total - answeredCount} {total - answeredCount === 1 ? "pregunta sin responder" : "preguntas sin responder"}. Se contarán como omitidas.
        </p>
        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Seguir revisando
          </Button>
          <Button
            onClick={() => {
              setConfirm(null);
              submit(false);
            }}
          >
            Finalizar prueba
          </Button>
        </div>
      </Modal>

      <Modal open={confirm === "exit"} onClose={() => setConfirm(null)} title="¿Salir de la prueba?">
        <p className="text-muted" style={{ marginBottom: 18 }}>
          Si sales ahora no se guardará tu progreso en esta prueba.
        </p>
        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <Button variant="secondary" onClick={() => setConfirm(null)}>
            Continuar prueba
          </Button>
          <Button variant="danger" onClick={onExit}>
            Salir sin guardar
          </Button>
        </div>
      </Modal>
    </div>,
    document.body
  );
}
