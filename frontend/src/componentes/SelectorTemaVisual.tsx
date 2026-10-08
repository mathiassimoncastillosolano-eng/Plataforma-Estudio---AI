import { Moon, Sun } from "lucide-react";
import { useTemaVisual, type TemaVisual } from "../hooks/useTemaVisual";

const opciones: { id: TemaVisual; etiqueta: string; icono: typeof Sun }[] = [
  { id: "light", etiqueta: "Claro", icono: Sun },
  { id: "dark", etiqueta: "Oscuro", icono: Moon },
];

/** Selector de modo (claro / oscuro) como control segmentado. */
export default function SelectorTemaVisual() {
  const { temaVisual, establecerTemaVisual } = useTemaVisual();
  return (
    <div className="seg" role="radiogroup" aria-label="Modo de apariencia">
      {opciones.map(({ id, etiqueta, icono: Icono }) => (
        <button key={id} type="button" role="radio" aria-checked={temaVisual === id} className={`seg-btn ${temaVisual === id ? "active" : ""}`} onClick={() => establecerTemaVisual(id)}>
          <Icono size={15} />
          {etiqueta}
        </button>
      ))}
    </div>
  );
}
