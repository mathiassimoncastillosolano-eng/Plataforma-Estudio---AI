import { CANTIDADES_PREGUNTAS } from "../../utilidades/constructorPruebas";

interface Props {
  valor: number;
  /** Total de preguntas disponibles en el banco del tema. */
  disponibles: number;
  alCambiar: (cantidad: number) => void;
}

/** Cantidad de preguntas: 10 · 15 · 20 · 25. Deshabilita lo que el banco no puede cubrir. */
export default function SelectorCantidadPreguntas({ valor, disponibles, alCambiar }: Props) {
  // Bancos muy pequeños: se ofrece usar todas las preguntas disponibles.
  const opciones: { valor: number; disabled: boolean }[] = CANTIDADES_PREGUNTAS.map((n) => ({ valor: n, disabled: n > disponibles }));
  if (disponibles > 0 && disponibles < CANTIDADES_PREGUNTAS[0]) opciones.unshift({ valor: disponibles, disabled: false });

  return (
    <div className="opt-row" role="radiogroup" aria-label="Cantidad de preguntas">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          disabled={o.disabled}
          title={o.disabled ? `Este tema tiene ${disponibles} preguntas disponibles` : undefined}
          className={`opt opt-num ${valor === o.valor ? "active" : ""}`}
          onClick={() => alCambiar(o.valor)}
        >
          {o.valor}
        </button>
      ))}
    </div>
  );
}
