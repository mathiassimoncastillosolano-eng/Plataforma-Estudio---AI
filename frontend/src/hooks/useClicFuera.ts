import { useEffect, type RefObject } from "react";

export function useClicFuera(ref: RefObject<HTMLElement>, alFuera: () => void, activo = true) {
  useEffect(() => {
    if (!activo) return;

    function manejarClic(evento: MouseEvent) {
      if (ref.current && !ref.current.contains(evento.target as Node)) {
        alFuera();
      }
    }
    function manejarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") alFuera();
    }

    document.addEventListener("mousedown", manejarClic);
    document.addEventListener("keydown", manejarTecla);
    return () => {
      document.removeEventListener("mousedown", manejarClic);
      document.removeEventListener("keydown", manejarTecla);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo]);
}
