import { useEffect, useState } from "react";

export function useContadorAnimado(desde: number, hasta: number, duracionMs = 1400): number {
  const [valor, establecerValor] = useState(desde);

  useEffect(() => {
    const sinMovimiento = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (sinMovimiento || desde === hasta) {
      establecerValor(hasta);
      return;
    }
    establecerValor(desde);
    const inicio = performance.now();
    let cuadro = 0;
    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / duracionMs);
      establecerValor(Math.round(desde + (hasta - desde) * (1 - Math.pow(1 - avance, 3))));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [desde, hasta, duracionMs]);

  return valor;
}
