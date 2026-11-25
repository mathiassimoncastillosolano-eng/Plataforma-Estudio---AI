import type { PeriodoProgreso } from "../../utilidades/panelProgreso";
import VariacionPorcentual from "./VariacionPorcentual";

interface Props {
  periodos: PeriodoProgreso[];
}

const ANCHO = 560;
const ALTO = 190;
const MARGEN = { arriba: 14, derecha: 18, abajo: 28, izquierda: 34 };

export default function EvolucionPeriodos({ periodos }: Props) {
  if (periodos.length === 0) {
    return <p className="dash-vacio">Responde preguntas para ver cómo cambia tu nivel entre periodos de 15 respuestas.</p>;
  }
  const util = { ancho: ANCHO - MARGEN.izquierda - MARGEN.derecha, alto: ALTO - MARGEN.arriba - MARGEN.abajo };
  const x = (i: number) => MARGEN.izquierda + (periodos.length === 1 ? util.ancho / 2 : (i / (periodos.length - 1)) * util.ancho);
  const y = (valor: number) => MARGEN.arriba + util.alto - (valor / 100) * util.alto;
  const linea = periodos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.porcentaje)}`).join(" ");
  const ultimo = periodos[periodos.length - 1];
  return (
    <div className="dash-evolucion">
      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label={`Precisión por periodo. Último periodo: ${ultimo.porcentaje}%`}>
        {[0, 50, 100].map((marca) => (
          <g key={marca}>
            <line x1={MARGEN.izquierda} x2={ANCHO - MARGEN.derecha} y1={y(marca)} y2={y(marca)} className="dash-eje" />
            <text x={MARGEN.izquierda - 8} y={y(marca) + 4} textAnchor="end" className="dash-eje-texto">
              {marca}
            </text>
          </g>
        ))}
        {periodos.length > 1 && <path d={linea} className="dash-linea" fill="none" />}
        {periodos.map((p, i) => (
          <g key={p.numero}>
            <circle cx={x(i)} cy={y(p.porcentaje)} r={5} className={p.completo ? "dash-punto" : "dash-punto is-parcial"} />
            <text x={x(i)} y={ALTO - 8} textAnchor="middle" className="dash-eje-texto">
              P{p.numero}
            </text>
          </g>
        ))}
      </svg>
      <ul className="dash-periodos">
        {periodos
          .slice(-3)
          .reverse()
          .map((p) => (
            <li key={p.numero}>
              <span>
                Periodo {p.numero}
                {!p.completo && " (en curso)"}
              </span>
              <strong>{p.porcentaje}%</strong>
              <span className="dash-periodo-detalle">
                {p.correctas}/{p.preguntas} correctas
              </span>
              <VariacionPorcentual valor={p.variacion} />
            </li>
          ))}
      </ul>
    </div>
  );
}
