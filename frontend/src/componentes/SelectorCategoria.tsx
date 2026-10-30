import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Atom, Check, ChevronDown, Code2, Dna, FlaskConical, Landmark, Languages, Shapes, Sigma, type LucideIcon } from "lucide-react";
import { useClicFuera } from "../hooks/useClicFuera";

export const CATEGORIAS: { nombre: string; icono: LucideIcon }[] = [
  { nombre: "Biología", icono: Dna },
  { nombre: "Historia", icono: Landmark },
  { nombre: "Informática", icono: Code2 },
  { nombre: "Matemáticas", icono: Sigma },
  { nombre: "Física", icono: Atom },
  { nombre: "Química", icono: FlaskConical },
  { nombre: "Idiomas", icono: Languages },
  { nombre: "Otra", icono: Shapes },
];

interface Props {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
}

/**
 * Combo de categorías (patrón «select-only combobox» de WAI-ARIA): botón + lista.
 * Teclado: ↑ ↓ Inicio Fin, Enter/Espacio elige, Esc cierra, escribir la inicial salta a la opción.
 */
export default function SelectorCategoria({ etiqueta, valor, alCambiar }: Props) {
  const [abierto, establecerAbierto] = useState(false);
  const [activo, establecerActivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idBase = useId();
  const seleccion = Math.max(0, CATEGORIAS.findIndex((c) => c.nombre === valor));
  const Actual = CATEGORIAS[seleccion].icono;
  useClicFuera(raiz, () => establecerAbierto(false), abierto);

  useEffect(() => {
    if (abierto) establecerActivo(seleccion);
  }, [abierto, seleccion]);

  function elegir(i: number) {
    alCambiar(CATEGORIAS[i].nombre);
    establecerAbierto(false);
    boton.current?.focus();
  }

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>) {
    const ultimo = CATEGORIAS.length - 1;
    if (!abierto) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        establecerAbierto(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown": e.preventDefault(); establecerActivo((a) => Math.min(ultimo, a + 1)); break;
      case "ArrowUp": e.preventDefault(); establecerActivo((a) => Math.max(0, a - 1)); break;
      case "Home": e.preventDefault(); establecerActivo(0); break;
      case "End": e.preventDefault(); establecerActivo(ultimo); break;
      case "Enter":
      case " ": e.preventDefault(); elegir(activo); break;
      case "Escape": e.preventDefault(); establecerAbierto(false); break;
      case "Tab": establecerAbierto(false); break;
      default:
        if (e.key.length === 1) {
          const i = CATEGORIAS.findIndex((c, k) => k > activo && c.nombre.toLowerCase().startsWith(e.key.toLowerCase()));
          const j = i >= 0 ? i : CATEGORIAS.findIndex((c) => c.nombre.toLowerCase().startsWith(e.key.toLowerCase()));
          if (j >= 0) establecerActivo(j);
        }
    }
  }

  return (
    <div className="field combo" ref={raiz}>
      <label id={`${idBase}-etiqueta`}>{etiqueta}</label>
      <button
        ref={boton}
        type="button"
        className="combo-boton"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={`${idBase}-lista`}
        aria-labelledby={`${idBase}-etiqueta`}
        aria-activedescendant={abierto ? `${idBase}-op-${activo}` : undefined}
        onClick={() => establecerAbierto((v) => !v)}
        onKeyDown={alTeclear}
      >
        <Actual size={18} aria-hidden="true" />
        <span className="combo-valor">{CATEGORIAS[seleccion].nombre}</span>
        <ChevronDown size={18} aria-hidden="true" className="combo-flecha" />
      </button>
      {abierto && (
        <ul className="combo-lista" id={`${idBase}-lista`} role="listbox" aria-labelledby={`${idBase}-etiqueta`}>
          {CATEGORIAS.map(({ nombre, icono: Icono }, i) => (
            <li
              key={nombre}
              id={`${idBase}-op-${i}`}
              role="option"
              aria-selected={i === seleccion}
              data-activo={i === activo || undefined}
              className="combo-opcion"
              onMouseEnter={() => establecerActivo(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => elegir(i)}
            >
              <Icono size={18} aria-hidden="true" />
              <span>{nombre}</span>
              {i === seleccion && <Check size={16} aria-hidden="true" className="combo-marca" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
