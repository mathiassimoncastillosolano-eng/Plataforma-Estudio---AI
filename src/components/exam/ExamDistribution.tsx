import type { QuestionDifficulty } from "../../types";
import type { ExamPlan } from "../../utils/examBuilder";
import { DIFFICULTIES, QUESTION_WEIGHT, formatPoints } from "../../utils/examBuilder";

const labels: Record<QuestionDifficulty, [string, string]> = {
  facil: ["fácil", "fáciles"],
  media: ["media", "medias"],
  dificil: ["difícil", "difíciles"],
};

/** Composición de la prueba: barra proporcional + desglose con su peso en puntos. */
export default function ExamDistribution({ plan }: { plan: ExamPlan }) {
  const total = DIFFICULTIES.reduce((n, l) => n + plan.actual[l], 0) || 1;
  return (
    <div className="exam-dist">
      <div className="dist-bar" aria-hidden="true">
        {DIFFICULTIES.map((l) => (
          <i key={l} className={`mix-${l}`} style={{ width: `${(plan.actual[l] / total) * 100}%` }} />
        ))}
      </div>
      <ul className="dist-list">
        {DIFFICULTIES.map((l) => (
          <li key={l}>
            <span className={`dist-dot mix-${l}`} />
            <span className="dist-name">
              <strong>{plan.actual[l]}</strong> {plan.actual[l] === 1 ? labels[l][0] : labels[l][1]}
            </span>
            <span className="dist-pts">
              {formatPoints(plan.actual[l] * QUESTION_WEIGHT[l])} pts <small>({formatPoints(QUESTION_WEIGHT[l])} c/u)</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
