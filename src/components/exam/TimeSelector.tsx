import type { ExamTimeLimit } from "../../types";
import { TIME_OPTIONS, timeLabel } from "../../utils/examBuilder";

export default function TimeSelector({ value, onChange }: { value: ExamTimeLimit; onChange: (m: ExamTimeLimit) => void }) {
  return (
    <div className="opt-row" role="radiogroup" aria-label="Tiempo disponible">
      {TIME_OPTIONS.map((m) => (
        <button key={String(m)} type="button" role="radio" aria-checked={value === m} className={`opt opt-time ${value === m ? "active" : ""}`} onClick={() => onChange(m)}>
          {timeLabel(m)}
        </button>
      ))}
    </div>
  );
}
