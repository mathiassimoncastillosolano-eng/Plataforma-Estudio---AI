import type { FilaDificultad } from "../../utilidades/panelProgreso";

interface Props {
  filas: FilaDificultad[];
}

const ETIQUETAS: Record<FilaDificultad["nivel"], string> = { facil: "Fácil", media: "Media", dificil: "Difícil" };

export default function DistribucionDificultad({ filas }: Props) {
  const total = filas.reduce((suma, f) => suma + f.preguntas, 0);
  if (total === 0) return <p className="dash-vacio">Aún no hay respuestas para mostrar la distribución por dificultad.</p>;
  return (
    <ul className="dash-dificultad">
      {filas.map((fila) => {
        const peso = Math.round((fila.preguntas / total) * 100);
        return (
          <li key={fila.nivel} data-nivel={fila.nivel}>
            <div className="dash-dificultad-cabecera">
              <span>{ETIQUETAS[fila.nivel]}</span>
              <span>
                {fila.preguntas} {fila.preguntas === 1 ? "pregunta" : "preguntas"} · {peso}%
              </span>
            </div>
            <div className="dash-mini-barra is-ancha" role="img" aria-label={`Acierto en ${ETIQUETAS[fila.nivel]}: ${fila.porcentaje ?? 0}%`}>
              <span style={{ width: `${fila.porcentaje ?? 0}%` }} />
            </div>
            <span className="dash-dificultad-acierto">{fila.porcentaje === null ? "Sin respuestas" : `${fila.porcentaje}% de acierto`}</span>
          </li>
        );
      })}
    </ul>
  );
}
