import { useEffect, useRef, useState } from "react";

const DURACION_MS = 900;

export function useContador(objetivo: number, duracion: number = DURACION_MS): number {
  const [valor, establecerValor] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      anterior.current = objetivo;
      establecerValor(objetivo);
      return;
    }
    const inicio = performance.now();
    const desde = anterior.current;
    let cuadro = 0;
    const paso = (ahora: number) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suavizado = 1 - Math.pow(1 - t, 3);
      const actual = Math.round(desde + (objetivo - desde) * suavizado);
      anterior.current = actual;
      establecerValor(actual);
      if (t < 1) cuadro = requestAnimationFrame(paso);
    };
    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [objetivo, duracion]);

  return valor;
}
