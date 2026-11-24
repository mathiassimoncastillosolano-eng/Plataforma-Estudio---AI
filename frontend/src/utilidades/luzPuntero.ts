const OBJETIVOS = ".card, .recommend-card, .mastery-row, .source-choice-card, .opt-card, .mod-card, .stat-strip";

export function activarLuzPuntero(): void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  if (!window.matchMedia("(hover: hover)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let marco = 0;
  window.addEventListener(
    "pointermove",
    (evento) => {
      const objetivo = (evento.target as Element | null)?.closest<HTMLElement>(OBJETIVOS);
      if (!objetivo) return;
      cancelAnimationFrame(marco);
      marco = requestAnimationFrame(() => {
        const caja = objetivo.getBoundingClientRect();
        objetivo.style.setProperty("--mx", `${evento.clientX - caja.left}px`);
        objetivo.style.setProperty("--my", `${evento.clientY - caja.top}px`);
      });
    },
    { passive: true }
  );
}
