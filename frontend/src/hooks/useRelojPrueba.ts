import { useCallback, useEffect, useRef, useState } from "react";
import type { TiempoPrueba } from "../tipos/prueba";

/**
 * Reloj de pantalla de la prueba. NO decide el tiempo: se ancla a cada respuesta del servidor
 * (`restanteSegundos` en ese instante) y descuenta con `performance.now()` entre respuestas.
 * Cada respuesta nueva reajusta el reloj, así que una pestaña dormida o un reloj del equipo
 * cambiado no pueden desviarlo.
 */
export function useRelojPrueba(tiempo: TiempoPrueba | null, alAgotar: () => void) {
  const ancla = useRef<{ restante: number | null; marca: number; corriendo: boolean }>({ restante: null, marca: 0, corriendo: false });
  const [restante, establecerRestante] = useState<number | null>(tiempo?.restanteSegundos ?? null);
  const agotado = useRef(false);
  const alAgotarRef = useRef(alAgotar);
  alAgotarRef.current = alAgotar;

  const calcular = useCallback(() => {
    const a = ancla.current;
    if (a.restante === null) return null;
    return Math.max(0, a.restante - (a.corriendo ? (performance.now() - a.marca) / 1000 : 0));
  }, []);

  // Nueva medida del servidor → nueva ancla.
  useEffect(() => {
    ancla.current = { restante: tiempo?.restanteSegundos ?? null, marca: performance.now(), corriendo: tiempo?.estado === "en_curso" };
    agotado.current = false;
    establecerRestante(calcular());
  }, [tiempo, calcular]);

  // Latido de pantalla (4 veces por segundo para no desfasar el segundo mostrado).
  useEffect(() => {
    if (tiempo?.estado !== "en_curso" || tiempo.restanteSegundos === null) return;
    const id = window.setInterval(() => {
      const valor = calcular();
      establecerRestante(valor);
      if (valor !== null && valor <= 0 && !agotado.current) {
        agotado.current = true;
        alAgotarRef.current();
      }
    }, 250);
    return () => window.clearInterval(id);
  }, [tiempo, calcular]);

  return restante;
}
