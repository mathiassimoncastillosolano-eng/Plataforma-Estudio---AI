import { AlertTriangle, Info, Play } from "lucide-react";
import type { ConfiguracionPrueba } from "../../tipos";
import type { PlanPrueba } from "../../utilidades/constructorPruebas";
import { DIFICULTADES, formatearPuntos, segundosPorPregunta } from "../../utilidades/constructorPruebas";
import { etiquetaDificultad } from "../../utilidades/formato";
import Boton from "../Boton";
import DistribucionPrueba from "./DistribucionPrueba";

interface Props {
  configuracion: ConfiguracionPrueba;
  plan: PlanPrueba;
  alIniciar: () => void;
}

/** Resumen dinámico: se recalcula en tiempo real con cada cambio de configuración. */
export default function ResumenPrueba({ configuracion, plan, alIniciar }: Props) {
  const segundosPorPreguntaCalculado = segundosPorPregunta(configuracion);
  const compacto = segundosPorPreguntaCalculado !== null && segundosPorPreguntaCalculado < 30;

  return (
    <aside className="exam-summary" aria-live="polite" aria-label="Resumen de tu prueba">
      <p className="eyebrow">Prepara tu prueba</p>
      <h2 className="exam-summary-title">
        <span key={configuracion.cantidadPreguntas} className="num-pop">
          {configuracion.cantidadPreguntas}
        </span>{" "}
        preguntas
      </h2>

      <dl className="exam-facts">
        <div>
          <dt>Dificultad</dt>
          <dd>{etiquetaDificultad(configuracion.dificultad)}</dd>
        </div>
        <div>
          <dt>Tiempo</dt>
          <dd>{configuracion.limiteTiempoMinutos === null ? "Sin límite" : `${configuracion.limiteTiempoMinutos} minutos`}</dd>
        </div>
      </dl>

      <p className="exam-block-label">Distribución</p>
      <DistribucionPrueba plan={plan} />

      <div className="exam-max">
        <span>Puntaje máximo</span>
        <strong>
          <span key={plan.puntajeMaximo} className="num-pop">
            {formatearPuntos(plan.puntajeMaximo)}
          </span>{" "}
          puntos
        </strong>
      </div>

      {!plan.factible && (
        <p className="exam-note danger" role="alert">
          <AlertTriangle size={15} />
          Este tema tiene solo {plan.disponibles} preguntas disponibles. Elige una cantidad menor.
        </p>
      )}
      {plan.factible && plan.ajustado && (
        <p className="exam-note info">
          <Info size={15} />
          <span>
            Ajustamos la mezcla: el tema solo tiene {plan.disponibles} preguntas en total. Lo ideal para esta dificultad sería{" "}
            {DIFICULTADES.map((l) => plan.objetivo[l]).join(" / ")} (fáciles / medias / difíciles).
          </span>
        </p>
      )}
      {compacto && (
        <p className="exam-note warn">
          <AlertTriangle size={15} />
          Tiempo muy ajustado: ≈ {segundosPorPreguntaCalculado} s por pregunta.
        </p>
      )}

      <Boton tamano="lg" anchoCompleto icono={<Play size={16} />} onClick={alIniciar} disabled={!plan.factible}>
        Comenzar prueba
      </Boton>
    </aside>
  );
}
