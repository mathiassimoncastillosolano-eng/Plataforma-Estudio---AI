import { Clock, X } from "lucide-react";
import { formatSeconds } from "../../utils/format";

interface Props {
  topicTitle: string;
  index: number;
  total: number;
  /** Segundos transcurridos. */
  seconds: number;
  /** Límite en segundos (null = sin límite → cronómetro progresivo). */
  limitSeconds: number | null;
  onExit: () => void;
}

/** Barra superior del modo concentración: salir, tema, tiempo y progreso. */
export default function ExamProgress({ topicTitle, index, total, seconds, limitSeconds, onExit }: Props) {
  const remaining = limitSeconds === null ? null : Math.max(0, limitSeconds - seconds);
  const tone = remaining === null ? "" : remaining <= 60 ? "danger" : remaining <= limitSeconds! * 0.2 ? "warn" : "";
  const percent = Math.round(((index + 1) / total) * 100);

  return (
    <>
      <header className="focus-bar">
        <button className="focus-exit" onClick={onExit} aria-label="Salir de la prueba">
          <X size={16} />
          <span className="hide-mobile">Salir</span>
        </button>
        <p className="focus-title">{topicTitle}</p>
        <div className={`focus-timer ${tone}`} role="timer" aria-label={remaining === null ? "Tiempo transcurrido" : "Tiempo restante"}>
          <Clock size={15} />
          <span className="mono">{formatSeconds(remaining ?? seconds)}</span>
          <small className="hide-mobile">{remaining === null ? "transcurrido" : "restante"}</small>
        </div>
      </header>
      <div className="focus-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={index + 1} aria-label={`Pregunta ${index + 1} de ${total}`}>
        <i style={{ width: `${percent}%` }} />
      </div>
    </>
  );
}
