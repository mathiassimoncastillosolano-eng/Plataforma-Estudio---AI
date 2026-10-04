import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, Check, X } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import type { ExamResult, QuestionAttempt, StudyQuestion } from "../types";
import Card from "../components/Card";
import Button from "../components/Button";
import { EmptyState } from "../components/States";

interface ResultsState {
  result: ExamResult;
  questions: StudyQuestion[];
  attempts: QuestionAttempt[];
}

export default function ResultsPage() {
  const { topic } = useTopicContext();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ResultsState | undefined;

  if (!state) {
    return (
      <EmptyState
        title="Todavía no tienes un resultado que mostrar"
        description="Completa una prueba para ver aquí tu resultado y tu retroalimentación."
        action={
          <Button onClick={() => navigate(`/study/${topic.id}/exam`)}>Ir a la prueba</Button>
        }
        icon={<AlertTriangle size={22} />}
      />
    );
  }

  const { result, questions, attempts } = state;
  const reviewQuestions = questions.filter((q) => result.reviewQuestionIds.includes(q.id));

  const scoreTone = result.scorePercent >= 76 ? "var(--green)" : result.scorePercent >= 51 ? "var(--blue)" : "var(--amber)";

  return (
    <div className="questions-shell">
      <Card>
        <div className="results-hero">
          <p className="text-muted" style={{ fontWeight: 600 }}>¡Prueba completada!</p>
          <div className="results-score" style={{ color: scoreTone }}>
            {result.scorePercent}%
          </div>
          <p className="text-muted">
            {result.correctCount} / {result.totalQuestions} respuestas correctas
          </p>

          <div className="results-stats-row">
            <div className="results-stat">
              <strong>{result.correctCount}</strong>
              <span>Correctas</span>
            </div>
            <div className="results-stat">
              <strong>{result.incorrectCount}</strong>
              <span>Incorrectas</span>
            </div>
            <div className="results-stat">
              <strong>{result.durationLabel}</strong>
              <span>Tiempo</span>
            </div>
          </div>

          {reviewQuestions.length > 0 && (
            <div className="review-banner">
              <AlertTriangle size={20} color="#b45309" />
              <div style={{ textAlign: "left" }}>
                <strong style={{ color: "#92400e", fontSize: 14 }}>Preguntas que necesitas repasar</strong>
                <p style={{ fontSize: 13, color: "#92400e", marginTop: 2 }}>
                  {reviewQuestions.length} {reviewQuestions.length === 1 ? "pregunta requiere" : "preguntas requieren"} mayor atención.
                </p>
              </div>
            </div>
          )}

          <div className="results-actions">
            <a
              href="#revision"
              className="btn btn-secondary"
              style={{ display: reviewQuestions.length > 0 ? "inline-flex" : "none" }}
            >
              Revisar respuestas
            </a>
            <Button variant="secondary" onClick={() => navigate(`/study/${topic.id}`)}>
              Volver al tema
            </Button>
            <Button onClick={() => navigate(`/study/${topic.id}/exam`)}>Intentar nuevamente</Button>
          </div>
        </div>
      </Card>

      {reviewQuestions.length > 0 && (
        <div id="revision" style={{ marginTop: 28 }}>
          <h2 style={{ fontSize: 19, marginBottom: 16 }}>Revisión de respuestas</h2>
          <div className="review-list">
            {questions.map((q) => {
              const attempt = attempts.find((a) => a.questionId === q.id);
              if (!attempt) return null;
              return (
                <Card key={q.id}>
                  <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                    {attempt.isCorrect ? (
                      <span className="state-icon" style={{ width: 28, height: 28, background: "var(--green-light)", color: "var(--green)" }}>
                        <Check size={14} />
                      </span>
                    ) : (
                      <span className="state-icon" style={{ width: 28, height: 28, background: "var(--red-light)", color: "var(--red)" }}>
                        <X size={14} />
                      </span>
                    )}
                    <p style={{ fontWeight: 600, color: "var(--color-text)", fontSize: 14.5 }}>{q.prompt}</p>
                  </div>
                  {q.type !== "abierta" ? (
                    <p className="text-soft" style={{ fontSize: 13.5 }}>
                      <strong>Respuesta correcta: </strong>
                      {q.options?.find((o) => o.id === q.correctOptionId)?.label}
                    </p>
                  ) : (
                    <p className="text-soft" style={{ fontSize: 13.5 }}>
                      <strong>Respuesta esperada: </strong>
                      {q.correctAnswerText}
                    </p>
                  )}
                  <p className="text-muted" style={{ fontSize: 13, marginTop: 6 }}>
                    {q.explanation}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
