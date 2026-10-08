import { Clock, X } from "lucide-react";
import { formatearSegundos } from "../../utilidades/formato";

interface Props {
  tituloTema: string;
  indice: number;
  total: number;
  /** Segundos transcurridos. */
  segundos: number;
  /** Límite en segundos (null = sin límite → cronómetro progresivo). */
  limiteSegundos: number | null;
  alSalir: () => void;
}

/** Barra superior del modo concentración: salir, tema, tiempo y progreso. */
export default function ProgresoPrueba({ tituloTema, indice, total, segundos, limiteSegundos, alSalir }: Props) {
  const restantes = limiteSegundos === null ? null : Math.max(0, limiteSegundos - segundos);
  const tono = restantes === null ? "" : restantes <= 60 ? "danger" : restantes <= limiteSegundos! * 0.2 ? "warn" : "";
  const porcentaje = Math.round(((indice + 1) / total) * 100);

  return (
    <>
      <header className="focus-bar">
        <button className="focus-exit" onClick={alSalir} aria-label="Salir de la prueba">
          <X size={16} />
          <span className="hide-mobile">Salir</span>
        </button>
        <p className="focus-title">{tituloTema}</p>
        <div className={`focus-timer ${tono}`} role="timer" aria-label={restantes === null ? "Tiempo transcurrido" : "Tiempo restante"}>
          <Clock size={15} />
          <span className="mono">{formatearSegundos(restantes ?? segundos)}</span>
          <small className="hide-mobile">{restantes === null ? "transcurrido" : "restante"}</small>
        </div>
      </header>
      <div className="focus-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={indice + 1} aria-label={`Pregunta ${indice + 1} de ${total}`}>
        <i style={{ width: `${porcentaje}%` }} />
      </div>
    </>
  );
}
