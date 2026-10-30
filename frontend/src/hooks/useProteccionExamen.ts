import { useEffect, type RefObject } from "react";

/**
 * Desalienta copiar el contenido del examen. Solo actúa DENTRO del contenedor: el resto de la
 * aplicación conserva clic derecho, selección y copiar con normalidad.
 *
 * Limitación honesta: es una barrera de conveniencia, no una garantía anti-trampa. Quien use otro
 * dispositivo, una captura de pantalla o las herramientas del navegador puede saltársela.
 */
export function useProteccionExamen(contenedor: RefObject<HTMLElement>, activo: boolean) {
  useEffect(() => {
    const el = contenedor.current;
    if (!activo || !el) return;

    const bloquear = (e: Event) => e.preventDefault();
    const teclas = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "a", "p", "s"].includes(e.key.toLowerCase())) e.preventDefault();
    };

    const eventos = ["copy", "cut", "contextmenu", "dragstart", "selectstart"] as const;
    eventos.forEach((n) => el.addEventListener(n, bloquear));
    el.addEventListener("keydown", teclas);
    return () => {
      eventos.forEach((n) => el.removeEventListener(n, bloquear));
      el.removeEventListener("keydown", teclas);
    };
  }, [contenedor, activo]);
}
