import type { NivelDominio } from "../../tipos";
import { etiquetasNivelDominio } from "../../datos/temasEstudio";

const NIVELES: { nivel: NivelDominio; from: number }[] = [
  { nivel: "inicial", from: 0 },
  { nivel: "en-progreso", from: 26 },
  { nivel: "buen-dominio", from: 51 },
  { nivel: "alto-dominio", from: 76 },
];

/** Siguiente nivel y puntos que faltan para alcanzarlo (null si ya está en el máximo). */
export function siguienteHito(valor: number): { etiqueta: string; faltante: number } | null {
  const siguiente = NIVELES.find((l) => l.from > valor);
  return siguiente ? { etiqueta: etiquetasNivelDominio[siguiente.nivel], faltante: siguiente.from - valor } : null;
}

/** Camino de dominio: cuatro tramos con un marcador en el punto actual. */
export default function RutaNiveles({ valor }: { valor: number }) {
  const acotado = Math.max(0, Math.min(100, valor));
  return (
    <div className="level-path" role="img" aria-label={`Dominio promedio ${acotado}%`}>
      <div className="level-path-track">
        {NIVELES.map(({ nivel, from }, i) => {
          const to = NIVELES[i + 1]?.from ?? 101;
          const alcanzado = acotado >= from;
          const fill = alcanzado ? Math.min(100, ((acotado - from) / (to - from)) * 100) : 0;
          return (
            <span key={nivel} className="level-path-seg">
              <i style={{ width: `${fill}%` }} />
            </span>
          );
        })}
        <span className="level-path-marker" style={{ left: `${acotado}%` }} />
      </div>
      <div className="level-path-labels">
        {NIVELES.map(({ nivel, from }) => (
          <span key={nivel} className={acotado >= from ? "is-reached" : ""}>
            {etiquetasNivelDominio[nivel]}
          </span>
        ))}
      </div>
    </div>
  );
}
