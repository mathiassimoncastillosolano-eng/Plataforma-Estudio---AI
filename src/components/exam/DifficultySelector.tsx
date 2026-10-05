import type { ExamDifficulty } from "../../types";
import { DIFFICULTIES, DIFFICULTY_PROFILES } from "../../utils/examBuilder";

const info: Record<ExamDifficulty, { label: string; desc: string }> = {
  facil: { label: "Fácil", desc: "Sobre todo comprensión básica: definiciones y conceptos centrales." },
  media: { label: "Media", desc: "Equilibrio entre conceptos básicos y preguntas de análisis." },
  dificil: { label: "Difícil", desc: "Predominan análisis y aplicación; pocas preguntas directas." },
};

/** Dificultad con explicación y composición del perfil (no es solo una etiqueta). */
export default function DifficultySelector({ value, onChange }: { value: ExamDifficulty; onChange: (d: ExamDifficulty) => void }) {
  const levels = ["facil", "media", "dificil"] as const;
  return (
    <div className="opt-grid" role="radiogroup" aria-label="Dificultad">
      {(["facil", "media", "dificil"] as ExamDifficulty[]).map((d) => (
        <button key={d} type="button" role="radio" aria-checked={value === d} className={`opt opt-card ${value === d ? "active" : ""}`} onClick={() => onChange(d)}>
          <span className="opt-title">{info[d].label}</span>
          <span className="opt-desc">{info[d].desc}</span>
          <span className="mix-bar" aria-hidden="true">
            {levels.map((l) => (
              <i key={l} className={`mix-${l}`} style={{ flexGrow: DIFFICULTY_PROFILES[d][l] }} />
            ))}
          </span>
          <span className="opt-mix">
            {DIFFICULTIES.map((l) => `${DIFFICULTY_PROFILES[d][l]}%`).join(" · ")}
          </span>
        </button>
      ))}
    </div>
  );
}
