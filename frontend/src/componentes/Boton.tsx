import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface PropsBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primary" | "secondary" | "ghost" | "danger";
  tamano?: "sm" | "md" | "lg";
  anchoCompleto?: boolean;
  cargando?: boolean;
  icono?: ReactNode;
}

export default function Boton({
  variante = "primary",
  tamano = "md",
  anchoCompleto = false,
  cargando = false,
  icono,
  disabled,
  children,
  className = "",
  ...rest
}: PropsBoton) {
  const claseTamano = tamano === "sm" ? "btn-sm" : tamano === "lg" ? "btn-lg" : "";
  const clases = [
    "btn",
    `btn-${variante}`,
    claseTamano,
    anchoCompleto ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={clases} disabled={disabled || cargando} data-loading={cargando || undefined} aria-busy={cargando || undefined} {...rest}>
      {cargando ? <Loader2 size={16} className="spin" /> : icono}
      {children}
    </button>
  );
}
