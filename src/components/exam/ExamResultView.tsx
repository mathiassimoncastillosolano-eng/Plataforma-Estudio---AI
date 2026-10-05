import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, Check, Lightbulb, Minus, RotateCcw, X } from "lucide-react";
import type { ExamResult, QuestionAttempt, QuestionDifficulty, StudyQuestion } from "../../types";
import { DIFFICULTIES, QUESTION_WEIGHT, formatPoints, timeLabel } from "../../utils/examBuilder";
import { buildRecommendations, resultHeadline } from "../../utils/recommendations";
import { difficultyLabel, formatSeconds } from "../../utils/format";
import { isOmitted } from "../../services/examService";
import MasteryGauge from "../MasteryGauge";
import Button from "../Button";
import Badge from "../Badge";

interface Props {
  result: ExamResult;
  questions: StudyQuestion[];
  attempts: QuestionAttempt[];
  topicId: string;
}

const levelPlural: Record<QuestionDifficulty, string> = { facil: "Fáciles", media: "Medias", dificil: "Difíciles" };
const tone: Record<QuestionDifficulty, "green" | "amber" | "red"> = { facil: "green", media: "amber", dificil: "red" };
type Filter = "fallos" | "correctas" | "todas";

/** Pantalla de resultados: responde "¿qué necesito estudiar ahora?" */
export default function ExamResultView({ result, questions, attempts, topicId }: Props) {
  const navigate = useNavigate();
  const headline = resultHeadline(result.scorePercent);
  const recommendations = buildRecommendations(result);
  const byId = new Map(attempts.map((a) => [a.questionId, a]));
  const [filter, setFilter] = useState<Filter>(result.reviewQuestionIds.length > 0 ? "fallos" : "todas");

  const visible = questions.filter((q) => {
    const ok = !!byId.get(q.id)?.isCorrect;
    return filter === "todas" ? true : filter === "fallos" ? !ok : ok;
  });

  const barTotal = result.totalQuestions || 1;
  const goQuestions = (f?: string) => navigate(`/study/${topicId}/questions${f ? `?f=${f}` : ""}`);

  return (
    <div className="results stagger">
      {/* ------------------------------------------------ Resultado principal */}
      <section className="result-hero">
        <MasteryGauge value={result.scorePercent} label="Puntaje" size={176} strokeWidth={12} />
        <div className="result-hero-body">
          <p className="eyebrow">Prueba completada</p>
          <h2 className="result-headline">{headline.title}</h2>
          <p className="result-sub">
            {result.config.questionCount} preguntas · Dificultad {difficultyLabel(result.config.difficulty).toLowerCase()} · {timeLabel(result.config.timeLimitMinutes)}
            {result.timedOut && " · Se agotó el tiempo"}
          </p>
          <dl className="result-figures">
            <div>
              <dt>Puntaje</dt>
              <dd>
                {formatPoints(Math.round(result.score * 10) / 10)} <small>/ {formatPoints(result.maxScore)}</small>
              </dd>
            </div>
            <div>
              <dt>Correctas</dt>
              <dd>
                {result.correctCount} <small>/ {result.totalQuestions}</small>
              </dd>
            </div>
            <div>
              <dt>Tiempo utilizado</dt>
              <dd className="mono">{formatSeconds(result.durationSeconds)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------ Rendimiento + respuestas */}
      <section className="result-split">
        <div>
          <h3 className="result-h">Rendimiento por dificultad</h3>
          <ul className="perf-list">
            {DIFFICULTIES.map((l) => {
              const p = result.byDifficulty[l];
              return (
                <li key={l} className={p.total === 0 ? "empty" : ""}>
                  <div className="perf-top">
                    <span className="perf-name">
                      <span className={`dist-dot mix-${l}`} />
                      {levelPlural[l]}
                    </span>
                    <strong>{p.total === 0 ? "—" : `${p.percent}%`}</strong>
                  </div>
                  <div className="perf-track">
                    <i className={`mix-${l}`} style={{ width: `${p.percent}%` }} />
                  </div>
                  <small>{p.total === 0 ? "No hubo preguntas de este nivel" : `${p.correct} de ${p.total} correctas · ${formatPoints(p.earned)} / ${formatPoints(p.max)} pts`}</small>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="result-h">Tus respuestas</h3>
          <div className="answers-bar" aria-hidden="true">
            <i className="ok" style={{ width: `${(result.correctCount / barTotal) * 100}%` }} />
            <i className="bad" style={{ width: `${(result.incorrectCount / barTotal) * 100}%` }} />
            <i className="skip" style={{ width: `${(result.omittedCount / barTotal) * 100}%` }} />
          </div>
          <ul className="answers-legend">
            <li>
              <span className="lg ok" />
              <strong>{result.correctCount}</strong> correctas
            </li>
            <li>
              <span className="lg bad" />
              <strong>{result.incorrectCount}</strong> incorrectas
            </li>
            <li>
              <span className="lg skip" />
              <strong>{result.omittedCount}</strong> omitidas
            </li>
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ Qué estudiar ahora */}
      <section className="next-steps">
        <h3 className="result-h">
          <Lightbulb size={18} /> ¿Qué estudiar ahora?
        </h3>

        {result.weakConcepts.length > 0 && (
          <div className="weak-list" aria-label="Temas con mayor error">
            <p className="weak-label">Temas con mayor error</p>
            {result.weakConcepts.map((w) => (
              <div key={w.term} className="weak-item">
                <AlertTriangle size={15} />
                <span>{w.term}</span>
                <small>
                  {w.missed} de {w.total} falladas
                </small>
              </div>
            ))}
          </div>
        )}

        {recommendations.length > 0 ? (
          <ul className="reco-list">
            {recommendations.map((r, i) => (
              <li key={i} className={r.tone}>
                {r.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Mantén el ritmo: practica un poco cada día para consolidar lo aprendido.</p>
        )}

        <div className="results-actions">
          {result.reviewQuestionIds.length > 0 && (
            <Button onClick={() => goQuestions("repasar")} icon={<RotateCcw size={15} />}>
              Practicar las {result.reviewQuestionIds.length} por repasar
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate(`/study/${topicId}/summary`)} icon={<BookOpen size={15} />}>
            Repasar el resumen
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/study/${topicId}/exam`)}>
            Nueva prueba
            <ArrowRight size={15} />
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------ Revisión */}
      <section id="revision">
        <div className="review-head">
          <h3 className="result-h">Revisión de respuestas</h3>
          <div className="seg seg-sm" role="tablist" aria-label="Filtrar revisión">
            {(["fallos", "correctas", "todas"] as Filter[]).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={`seg-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
                {f === "fallos" ? `Por repasar (${result.reviewQuestionIds.length})` : f === "correctas" ? `Correctas (${result.correctCount})` : "Todas"}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="text-muted" style={{ padding: "18px 0" }}>
            No hay preguntas en este filtro.
          </p>
        ) : (
          <ol className="review-items">
            {visible.map((q) => {
              const attempt = byId.get(q.id);
              const omitted = isOmitted(q, attempt);
              const ok = !!attempt?.isCorrect;
              const given = q.type === "abierta" ? attempt?.openAnswerText : q.options?.find((o) => o.id === attempt?.selectedOptionId)?.label;
              const right = q.type === "abierta" ? q.correctAnswerText : q.options?.find((o) => o.id === q.correctOptionId)?.label;
              return (
                <li key={q.id} className="review-item">
                  <span className={`review-status ${ok ? "ok" : omitted ? "skip" : "bad"}`} aria-label={ok ? "Correcta" : omitted ? "Omitida" : "Incorrecta"}>
                    {ok ? <Check size={14} strokeWidth={3} /> : omitted ? <Minus size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                  </span>
                  <div className="review-body">
                    <p className="review-prompt">{q.prompt}</p>
                    <div className="review-meta">
                      <Badge tone={tone[q.difficulty]}>{difficultyLabel(q.difficulty)}</Badge>
                      <span>{formatPoints(QUESTION_WEIGHT[q.difficulty])} pts</span>
                    </div>
                    <p>
                      <strong>Tu respuesta: </strong>
                      <span className={ok ? "t-ok" : omitted ? "text-muted" : "t-bad"}>{given || "Sin responder"}</span>
                    </p>
                    {!ok && (
                      <p>
                        <strong>Respuesta correcta: </strong>
                        <span className="t-ok">{right}</span>
                      </p>
                    )}
                    <p className="review-expl">{q.explanation}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
