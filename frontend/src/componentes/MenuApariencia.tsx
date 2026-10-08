import { useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useClicFuera } from "../hooks/useClicFuera";
import SelectorTemaVisual from "./SelectorTemaVisual";
import SelectorEsquemaColor from "./SelectorEsquemaColor";

/** Botón del header que abre el panel de apariencia (modo + color de acento). */
export default function MenuApariencia() {
  const [abierto, establecerAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClicFuera(ref as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  return (
    <div className="dropdown" ref={ref}>
      <button className="header-icon-btn" onClick={() => establecerAbierto((o) => !o)} aria-haspopup="dialog" aria-expanded={abierto} aria-label="Apariencia" title="Apariencia">
        <Palette size={18} />
      </button>
      {abierto && (
        <div className="dropdown-panel appearance-panel" role="dialog" aria-label="Apariencia">
          <p className="panel-title">Apariencia</p>
          <p className="panel-label">Modo</p>
          <SelectorTemaVisual />
          <p className="panel-label">Color de acento</p>
          <SelectorEsquemaColor />
          <p className="panel-hint">Se aplica a toda la plataforma y se recuerda en este dispositivo.</p>
        </div>
      )}
    </div>
  );
}
