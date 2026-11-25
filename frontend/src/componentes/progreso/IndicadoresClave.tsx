import { Flame, Gauge, HelpCircle, Target } from "lucide-react";
import type { IndicadoresGlobales } from "../../utilidades/panelProgreso";
import VariacionPorcentual from "./VariacionPorcentual";

interface Props {
  indicadores: IndicadoresGlobales;
}

export default function IndicadoresClave({ indicadores }: Props) {
  const { dominioPromedio, preguntasRespondidas, precision, rachaActual, mejorRacha, variacionPrecision } = indicadores;
  return (
    <ul className="dash-kpis" aria-label="Indicadores clave">
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <Gauge size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Dominio global</span>
        <strong className="dash-kpi-valor">{dominioPromedio}%</strong>
        <span className="dash-kpi-nota">Promedio de tus temas</span>
      </li>
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <Flame size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Racha</span>
        <strong className="dash-kpi-valor">{rachaActual}</strong>
        <span className="dash-kpi-nota">Mejor racha: {mejorRacha}</span>
      </li>
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <HelpCircle size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Preguntas respondidas</span>
        <strong className="dash-kpi-valor">{preguntasRespondidas}</strong>
        <span className="dash-kpi-nota">En todos tus temas</span>
      </li>
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <Target size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Precisión</span>
        <strong className="dash-kpi-valor">{precision === null ? "—" : `${precision}%`}</strong>
        <span className="dash-kpi-nota">
          <VariacionPorcentual valor={variacionPrecision} sufijo="vs. periodo anterior" />
        </span>
      </li>
    </ul>
  );
}
