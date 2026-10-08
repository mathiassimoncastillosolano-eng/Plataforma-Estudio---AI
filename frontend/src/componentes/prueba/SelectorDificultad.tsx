import type { DificultadPrueba } from "../../tipos";
import { DIFICULTADES, PERFILES_DIFICULTAD } from "../../utilidades/constructorPruebas";

const informacion: Record<DificultadPrueba, { etiqueta: string; descripcion: string }> = {
  facil: { etiqueta: "Fácil", descripcion: "Sobre todo comprensión básica: definiciones y conceptos centrales." },
  media: { etiqueta: "Media", descripcion: "Equilibrio entre conceptos básicos y preguntas de análisis." },
  dificil: { etiqueta: "Difícil", descripcion: "Predominan análisis y aplicación; pocas preguntas directas." },
};

/** Dificultad con explicación y composición del perfil (no es solo una etiqueta). */
export default function SelectorDificultad({ valor, alCambiar }: { valor: DificultadPrueba; alCambiar: (d: DificultadPrueba) => void }) {
  const niveles = ["facil", "media", "dificil"] as const;
  return (
    <div className="opt-grid" role="radiogroup" aria-label="Dificultad">
      {(["facil", "media", "dificil"] as DificultadPrueba[]).map((d) => (
        <button key={d} type="button" role="radio" aria-checked={valor === d} className={`opt opt-card ${valor === d ? "active" : ""}`} onClick={() => alCambiar(d)}>
          <span className="opt-title">{informacion[d].etiqueta}</span>
          <span className="opt-desc">{informacion[d].descripcion}</span>
          <span className="mix-bar" aria-hidden="true">
            {niveles.map((l) => (
              <i key={l} className={`mix-${l}`} style={{ flexGrow: PERFILES_DIFICULTAD[d][l] }} />
            ))}
          </span>
          <span className="opt-mix">
            {DIFICULTADES.map((l) => `${PERFILES_DIFICULTAD[d][l]}%`).join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );
}
