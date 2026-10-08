import type { HTMLAttributes, ReactNode } from "react";

interface PropsTarjeta extends HTMLAttributes<HTMLDivElement> {
  sinBorde?: boolean;
  children: ReactNode;
}

export default function Tarjeta({ sinBorde = false, className = "", children, ...rest }: PropsTarjeta) {
  return (
    <div className={`card ${sinBorde ? "card-flush" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}
