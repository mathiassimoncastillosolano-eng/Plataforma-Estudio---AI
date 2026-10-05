import { AlertTriangle, Info, Play } from "lucide-react";
import type { ExamConfig } from "../../types";
import type { ExamPlan } from "../../utils/examBuilder";
import { DIFFICULTIES, formatPoints, secondsPerQuestion } from "../../utils/examBuilder";
import { difficultyLabel } from "../../utils/format";
import Button from "../Button";
import ExamDistribution from "./ExamDistribution";

interface Props {
  config: ExamConfig;
  plan: ExamPlan;
  onStart: () => void;
}

/** Resumen dinámico: se recalcula en tiempo real con cada cambio de configuración. */
export default function ExamSummary({ config, plan, onStart }: Props) {
  const spq = secondsPerQuestion(config);
  const tight = spq !== null && spq < 30;

  return (
    <aside className="exam-summary" aria-live="polite" aria-label="Resumen de tu prueba">
      <p className="eyebrow">Prepara tu prueba</p>
      <h2 className="exam-summary-title">
        <span key={config.questionCount} className="num-pop">
          {config.questionCount}
        </span>{" "}
        preguntas
      </h2>

      <dl className="exam-facts">
        <div>
          <dt>Dificultad</dt>
          <dd>{difficultyLabel(config.difficulty)}</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>{config.timeLimitMinutes === null ? "Sin límite" : `${config.timeLimitMinutes} minutos`}</dd>
        </div>
      </dl>

      <p className="exam-block-label">Distribución</p>
      <ExamDistribution plan={plan} />

      <div className="exam-max">
        <span>Puntaje máximo</span>
        <strong>
          <span key={plan.maxScore} className="num-pop">
            {formatPoints(plan.maxScore)}
          </span>{" "}
          puntos
        </strong>
      </div>

      {!plan.feasible && (
        <p className="exam-note danger" role="alert">
          <AlertTriangle size={15} />
          Este tema tiene solo {plan.available} preguntas disponibles. Elige una cantidad menor.
        </p>
      )}
      {plan.feasible && plan.adjusted && (
        <p className="exam-note info">
          <Info size={15} />
          <span>
            Ajustamos la mezcla: el tema solo tiene {plan.available} preguntas en total. Lo ideal para esta dificultad sería{" "}
            {DIFFICULTIES.map((l) => plan.target[l]).join(" / ")} (fáciles / medias / difíciles).
          </span>
        </p>
      )}
      {tight && (
        <p className="exam-note warn">
          <AlertTriangle size={15} />
          Tiempo muy ajustado: ≈ {spq} s por pregunta.
        </p>
      )}

      <Button size="lg" fullWidth icon={<Play size={16} />} onClick={onStart} disabled={!plan.feasible}>
        Comenzar prueba
      </Button>
    </aside>
  );
}
