import { Check } from "lucide-react";
import { useTheme, type Accent } from "../hooks/useTheme";

// Muestras fijas: representan cada acento aunque el tema activo sea el otro.
const options: { id: Accent; label: string; from: string; to: string }[] = [
  { id: "blue", label: "Azul", from: "#2563eb", to: "#38bdf8" },
  { id: "purple", label: "Morado", from: "#5b5ff0", to: "#8b5cf6" },
];

/** Selector de color de acento (azul / morado). */
export default function ColorSchemeSelector() {
  const { accent, setAccent } = useTheme();
  return (
    <div className="swatch-group" role="radiogroup" aria-label="Color de acento">
      {options.map(({ id, label, from, to }) => (
        <button key={id} type="button" role="radio" aria-checked={accent === id} className={`swatch ${accent === id ? "active" : ""}`} onClick={() => setAccent(id)}>
          <span className="swatch-dot" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
            {accent === id && <Check size={13} strokeWidth={3} />}
          </span>
          {label}
        </button>
      ))}
    </div>
  );
}
