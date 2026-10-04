import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  flush?: boolean;
  children: ReactNode;
}

export default function Card({ flush = false, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`card ${flush ? "card-flush" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}
