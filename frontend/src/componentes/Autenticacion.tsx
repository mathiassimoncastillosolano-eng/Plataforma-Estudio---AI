import type { ReactNode } from "react";
import { BookOpen, ClipboardCheck, HelpCircle, Moon, Sun } from "lucide-react";
import MarcaLogo from "./MarcaLogo";
import { useTemaVisual } from "../hooks/useTemaVisual";

/** Panel de marca (lado izquierdo en escritorio). */
export function VisualAutenticacion({ mensaje, descripcion }: { mensaje: ReactNode; descripcion: string }) {
  return (
    <aside className="auth-visual" aria-label="Presentación de Cursa">
      <div className="auth-visual-top reveal" style={{ ["--i" as string]: 0 }}>
        <MarcaLogo tamano={40} />
        <span className="auth-visual-brand">Cursa</span>
      </div>

      <div className="auth-visual-copy">
        <h2 className="auth-visual-quote reveal" style={{ ["--i" as string]: 1 }}>
          {mensaje}
        </h2>
        <p className="auth-visual-text reveal" style={{ ["--i" as string]: 2 }}>
          {descripcion}
        </p>
      </div>

      <div className="auth-preview" aria-hidden="true">
        <div className="auth-chip auth-chip-a">
          <span className="auth-chip-icon">
            <BookOpen size={18} />
          </span>
          <div>
            <strong>Resumen listo</strong>
            <small>Ideas clave de tu material</small>
          </div>
        </div>
        <div className="auth-chip auth-chip-b">
          <span className="auth-chip-icon">
            <HelpCircle size={18} />
          </span>
          <div>
            <strong>Preguntas de práctica</strong>
            <small>Con retroalimentación</small>
          </div>
        </div>
        <div className="auth-chip auth-chip-c">
          <span className="auth-chip-icon">
            <ClipboardCheck size={18} />
          </span>
          <div>
            <strong>Tu dominio</strong>
            <div className="auth-mini-bar">
              <i />
            </div>
          </div>
        </div>
      </div>

      <p className="auth-visual-foot">Cursa — estudio asistido por IA</p>
    </aside>
  );
}

/** Hero compacto de marca para móvil (el panel lateral solo aparece en escritorio). */
export function PortadaMovilAutenticacion({ mensaje }: { mensaje: string }) {
  return (
    <div className="auth-mobile-hero">
      <div className="auth-visual-top">
        <MarcaLogo tamano={36} />
        <span className="auth-visual-brand">Cursa</span>
      </div>
      <p>{mensaje}</p>
    </div>
  );
}

/** Alternar claro / oscuro desde la pantalla de acceso. */
export function AlternadorTemaAutenticacion() {
  const { temaVisual, alternarTemaVisual } = useTemaVisual();
  const esOscuro = temaVisual === "dark";
  return (
    <button
      type="button"
      className="auth-theme-toggle"
      onClick={alternarTemaVisual}
      aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {esOscuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
