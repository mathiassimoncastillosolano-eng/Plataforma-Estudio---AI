import { QUESTION_COUNTS } from "../../utils/examBuilder";

interface Props {
  value: number;
  /** Total de preguntas disponibles en el banco del tema. */
  available: number;
  onChange: (count: number) => void;
}

/** Cantidad de preguntas: 10 · 15 · 20 · 25. Deshabilita lo que el banco no puede cubrir. */
export default function QuestionCountSelector({ value, available, onChange }: Props) {
  // Bancos muy pequeños: se ofrece usar todas las preguntas disponibles.
  const options: { value: number; disabled: boolean }[] = QUESTION_COUNTS.map((n) => ({ value: n, disabled: n > available }));
  if (available > 0 && available < QUESTION_COUNTS[0]) options.unshift({ value: available, disabled: false });

  return (
    <div className="opt-row" role="radiogroup" aria-label="Cantidad de preguntas">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          title={o.disabled ? `Este tema tiene ${available} preguntas disponibles` : undefined}
          className={`opt opt-num ${value === o.value ? "active" : ""}`}
          onClick={() => onChange(o.value)}
        >
          {o.value}
        </button>
      ))}
    </div>
  );
}
