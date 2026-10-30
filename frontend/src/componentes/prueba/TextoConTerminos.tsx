import { useId, useRef, useState } from "react";
import type { TerminoAyuda } from "../../tipos/prueba";
import { segmentarEnunciado } from "../../utilidades/definiciones";
import { useClicFuera } from "../../hooks/useClicFuera";

/**
 * Enunciado con términos subrayados (modo asistido). Las definiciones llegan ya calculadas con la
 * prueba: abrir una no hace ninguna llamada de red. Todo es texto plano (React lo escapa).
 */
export default function TextoConTerminos({ enunciado, terminos }: { enunciado: string; terminos: TerminoAyuda[] }) {
  const [abierto, establecerAbierto] = useState<number | null>(null);
  const raiz = useRef<HTMLSpanElement>(null);
  const idBase = useId();
  useClicFuera(raiz, () => establecerAbierto(null), abierto !== null);

  const segmentos = segmentarEnunciado(enunciado, terminos);
  return (
    <span ref={raiz}>
      {segmentos.map((s, i) =>
        s.termino ? (
          <span key={i} className="pr-termino-contenedor">
            <button
              type="button"
              className="pr-termino"
              aria-expanded={abierto === i}
              aria-describedby={abierto === i ? `${idBase}-${i}` : undefined}
              onClick={() => establecerAbierto(abierto === i ? null : i)}
            >
              {s.texto}
            </button>
            {abierto === i && (
              <span id={`${idBase}-${i}`} role="note" className="pr-termino-globo">
                <strong>{s.texto}:</strong> {s.termino.definicion}
              </span>
            )}
          </span>
        ) : (
          <span key={i}>{s.texto}</span>
        )
      )}
    </span>
  );
}
