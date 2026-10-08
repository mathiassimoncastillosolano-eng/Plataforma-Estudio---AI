import { useId } from "react";

interface PropsMarcaLogo {
  tamano?: number;
}

/**
 * Marca de CURSA: una "C" abierta (el camino de aprendizaje) con un punto de
 * luz en la apertura (el momento en que algo se entiende).
 */
export default function MarcaLogo({ tamano = 36 }: PropsMarcaLogo) {
  const idGradiente = useId();
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 40 40" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={idGradiente} x1="4" y1="2" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop style={{ stopColor: "var(--logo-a, var(--color-primary-solid))" }} />
          <stop offset="1" style={{ stopColor: "var(--logo-b, var(--color-accent))" }} />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill={`url(#${idGradiente})`} />
      <path
        d="M27.2 13.4A10.4 10.4 0 1 0 27.2 26.6"
        stroke="#fff"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <circle cx="29.2" cy="20" r="2.6" fill="#fff" />
    </svg>
  );
}
