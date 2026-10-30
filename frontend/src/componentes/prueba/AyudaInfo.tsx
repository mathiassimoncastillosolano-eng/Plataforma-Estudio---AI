import { useId, useRef, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { useClicFuera } from "../../hooks/useClicFuera";

/**
 * Botón «?» con explicación breve. Funciona con teclado (Enter/Espacio, Esc cierra), con toque y con
 * lector de pantalla (aria-expanded + aria-controls); no depende del hover.
 */
export default function AyudaInfo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  const [abierta, establecerAbierta] = useState(false);
  const raiz = useRef<HTMLSpanElement>(null);
  const id = useId();
  useClicFuera(raiz, () => establecerAbierta(false), abierta);

  return (
    <span className="pr-ayuda" ref={raiz}>
      <button type="button" className="pr-ayuda-boton" aria-expanded={abierta} aria-controls={id} aria-label={`Ayuda: ${etiqueta}`} onClick={() => establecerAbierta((v) => !v)}>
        <HelpCircle size={15} aria-hidden="true" />
      </button>
      {abierta && (
        <span id={id} role="note" className="pr-ayuda-globo">
          {children}
        </span>
      )}
    </span>
  );
}
