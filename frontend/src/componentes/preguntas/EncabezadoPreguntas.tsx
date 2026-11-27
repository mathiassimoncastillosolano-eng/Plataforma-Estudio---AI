import { Dumbbell, Flame, RotateCcw, Target } from "lucide-react";
import Boton from "../Boton";

interface PropsEncabezadoPreguntas {
  ronda: number;
  respondidasRonda: number;
  totalRonda: number;
  respondidas: number;
  conocidas: number;
  repasar: number;
  textoPracticar: string;
  practicarDeshabilitado: boolean;
  alPracticar: () => void;
}

export default function EncabezadoPreguntas({ ronda, respondidasRonda, totalRonda, respondidas, conocidas, repasar, textoPracticar, practicarDeshabilitado, alPracticar }: PropsEncabezadoPreguntas) {
  const porcentaje = totalRonda > 0 ? Math.round((respondidasRonda / totalRonda) * 100) : 0;
  const precision = respondidas > 0 ? Math.round((conocidas / respondidas) * 100) : null;

  return (
    <section className="preg-cabecera" aria-label="Resumen de la ronda">
      <div className="preg-cabecera-principal">
        <div className="preg-cabecera-titulo">
          <span className="preg-ronda mono">Ronda {ronda}</span>
          <strong>
            {respondidasRonda} <span>de {totalRonda} respondidas</span>
          </strong>
        </div>
        <div className="preg-barra" role="progressbar" aria-valuenow={porcentaje} aria-valuemin={0} aria-valuemax={100} aria-label="Preguntas respondidas">
          <span style={{ width: `${porcentaje}%` }} />
        </div>
      </div>

      <dl className="preg-cifras">
        <div className="preg-cifra" data-tipo="ok">
          <dt>
            <Target size={14} aria-hidden="true" /> Aciertos
          </dt>
          <dd className="mono">{precision === null ? "—" : `${precision}%`}</dd>
        </div>
        <div className="preg-cifra" data-tipo="ok">
          <dt>
            <Flame size={14} aria-hidden="true" /> Dominadas
          </dt>
          <dd className="mono">{conocidas}</dd>
        </div>
        <div className="preg-cifra" data-tipo="repaso">
          <dt>
            <RotateCcw size={14} aria-hidden="true" /> Por repasar
          </dt>
          <dd className="mono">{repasar}</dd>
        </div>
      </dl>

      <Boton variante="primary" tamano="sm" icono={<Dumbbell size={15} />} disabled={practicarDeshabilitado} onClick={alPracticar} data-tour="preguntas-practicar">
        {textoPracticar}
      </Boton>
    </section>
  );
}
