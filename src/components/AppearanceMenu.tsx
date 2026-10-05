import { useRef, useState } from "react";
import { Palette } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";
import ThemeSelector from "./ThemeSelector";
import ColorSchemeSelector from "./ColorSchemeSelector";

/** Botón del header que abre el panel de apariencia (modo + color de acento). */
export default function AppearanceMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref as React.RefObject<HTMLElement>, () => setOpen(false), open);

  return (
    <div className="dropdown" ref={ref}>
      <button className="header-icon-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} aria-label="Apariencia" title="Apariencia">
        <Palette size={18} />
      </button>
      {open && (
        <div className="dropdown-panel appearance-panel" role="dialog" aria-label="Apariencia">
          <p className="panel-title">Apariencia</p>
          <p className="panel-label">Modo</p>
          <ThemeSelector />
          <p className="panel-label">Color de acento</p>
          <ColorSchemeSelector />
          <p className="panel-hint">Se aplica a toda la plataforma y se recuerda en este dispositivo.</p>
        </div>
      )}
    </div>
  );
}
