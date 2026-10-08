import type { LimiteTiempoPrueba } from "../../tipos";
import { OPCIONES_TIEMPO, etiquetaTiempo } from "../../utilidades/constructorPruebas";

export default function SelectorTiempo({ valor, alCambiar }: { valor: LimiteTiempoPrueba; alCambiar: (m: LimiteTiempoPrueba) => void }) {
  return (
    <div className="opt-row" role="radiogroup" aria-label="Tiempo disponible">
      {OPCIONES_TIEMPO.map((m) => (
        <button key={String(m)} type="button" role="radio" aria-checked={valor === m} className={`opt opt-time ${valor === m ? "active" : ""}`} onClick={() => alCambiar(m)}>
          {etiquetaTiempo(m)}
        </button>
      ))}
    </div>
  );
}
