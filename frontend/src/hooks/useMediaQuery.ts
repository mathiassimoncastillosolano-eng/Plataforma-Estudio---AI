import { useEffect, useState } from "react";

export function useMediaQuery(consulta: string): boolean {
  const [coincidencias, establecerCoincidencias] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(consulta).matches : false
  );

  useEffect(() => {
    const listaMediaQuery = window.matchMedia(consulta);
    const oyente = () => establecerCoincidencias(listaMediaQuery.matches);
    oyente();
    listaMediaQuery.addEventListener("change", oyente);
    return () => listaMediaQuery.removeEventListener("change", oyente);
  }, [consulta]);

  return coincidencias;
}
