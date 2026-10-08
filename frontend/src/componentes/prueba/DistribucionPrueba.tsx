import type { DificultadPregunta } from "../../tipos";
import type { PlanPrueba } from "../../utilidades/constructorPruebas";
import { DIFICULTADES, PESO_PREGUNTA, formatearPuntos } from "../../utilidades/constructorPruebas";

const etiquetas: Record<DificultadPregunta, [string, string]> = {
  facil: ["fácil", "fáciles"],
  media: ["media", "medias"],
  dificil: ["difícil", "difíciles"],
};

/** Composición de la prueba: barra proporcional + desglose con su peso en puntos. */
export default function DistribucionPrueba({ plan }: { plan: PlanPrueba }) {
  const total = DIFICULTADES.reduce((n, l) => n + plan.actual[l], 0) || 1;
  return (
    <div className="exam-dist">
      <div className="dist-bar" aria-hidden="true">
        {DIFICULTADES.map((l) => (
          <i key={l} className={`mix-${l}`} style={{ width: `${(plan.actual[l] / total) * 100}%` }} />
        ))}
      </div>
      <ul className="dist-list">
        {DIFICULTADES.map((l) => (
          <li key={l}>
            <span className={`dist-dot mix-${l}`} />
            <span className="dist-name">
              <strong>{plan.actual[l]}</strong> {plan.actual[l] === 1 ? etiquetas[l][0] : etiquetas[l][1]}
            </span>
            <span className="dist-pts">
              {formatearPuntos(plan.actual[l] * PESO_PREGUNTA[l])} pts <small>({formatearPuntos(PESO_PREGUNTA[l])} c/u)</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
