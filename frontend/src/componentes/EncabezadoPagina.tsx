import type { ReactNode } from "react";

interface PropsEncabezadoPagina {
  titulo: ReactNode;
  descripcion?: ReactNode;
  sobretitulo?: string;
  acciones?: ReactNode;
}

/** Encabezado estándar de página: misma tipografía y espaciado en toda la app. */
export default function EncabezadoPagina({ titulo, descripcion, sobretitulo, acciones }: PropsEncabezadoPagina) {
  return (
    <header className="page-header reveal">
      <div className="page-header-text">
        {sobretitulo && <span className="eyebrow">{sobretitulo}</span>}
        <h1>{titulo}</h1>
        {descripcion && <p>{descripcion}</p>}
      </div>
      {acciones && <div className="page-header-actions">{acciones}</div>}
    </header>
  );
}
