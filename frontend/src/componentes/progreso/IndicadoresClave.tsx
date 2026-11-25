import { Flame, Gauge, HelpCircle, Target } from "lucide-react";
import type { IndicadoresGlobales } from "../../utilidades/panelProgreso";
import VariacionPorcentual from "./VariacionPorcentual";
import { useContador } from "../../hooks/useContador";

interface Props {
  indicadores: IndicadoresGlobales;
}

export default function IndicadoresClave({ indicadores }: Props) {
  const { dominioPromedio, preguntasRespondidas, precision, rachaActual, mejorRacha, variacionPrecision } = indicadores;
  const dominioAnimado = useContador(dominioPromedio);
  const rachaAnimada = useContador(rachaActual);
  const preguntasAnimadas = useContador(preguntasRespondidas);
  const precisionAnimada = useContador(precision ?? 0);
  return (
    <ul className="dash-kpis" aria-label="Indicadores clave">
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <Gauge size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Dominio global</span>
        <strong className="dash-kpi-valor">{dominioAnimado}%</strong>
        <span className="dash-kpi-nota">Promedio de tus temas</span>
      </li>
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <Flame size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Racha</span>
        <strong className="dash-kpi-valor">{rachaAnimada}</strong>
        <span className="dash-kpi-nota">Mejor racha: {mejorRacha}</span>
      </li>
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <HelpCircle size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Preguntas respondidas</span>
        <strong className="dash-kpi-valor">{preguntasAnimadas}</strong>
        <span className="dash-kpi-nota">En todos tus temas</span>
      </li>
      <li className="dash-kpi">
        <span className="dash-kpi-icono">
          <Target size={18} aria-hidden="true" />
        </span>
        <span className="dash-kpi-etiqueta">Precisión</span>
        <strong className="dash-kpi-valor">{precision === null ? "—" : `${precisionAnimada}%`}</strong>
        <span className="dash-kpi-nota">
          <VariacionPorcentual valor={variacionPrecision} sufijo="vs. periodo anterior" />
        </span>
      </li>
    </ul>
  );
}
