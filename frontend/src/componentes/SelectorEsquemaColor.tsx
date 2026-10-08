import { Check } from "lucide-react";
import { useTemaVisual, type Acento } from "../hooks/useTemaVisual";

// Muestras fijas: representan cada acento aunque el tema activo sea el otro.
const opciones: { id: Acento; etiqueta: string; from: string; to: string }[] = [
  { id: "blue", etiqueta: "Azul", from: "#2563eb", to: "#38bdf8" },
  { id: "purple", etiqueta: "Morado", from: "#5b5ff0", to: "#8b5cf6" },
];

/** Selector de color de acento (azul / morado). */
export default function SelectorEsquemaColor() {
  const { acento, establecerAcento } = useTemaVisual();
  return (
    <div className="swatch-group" role="radiogroup" aria-label="Color de acento">
      {opciones.map(({ id, etiqueta, from, to }) => (
        <button key={id} type="button" role="radio" aria-checked={acento === id} className={`swatch ${acento === id ? "active" : ""}`} onClick={() => establecerAcento(id)}>
          <span className="swatch-dot" style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
            {acento === id && <Check size={13} strokeWidth={3} />}
          </span>
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
