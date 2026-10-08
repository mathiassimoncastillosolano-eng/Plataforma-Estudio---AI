import type { ReactNode } from "react";

interface PropsTarjetaEstadistica {
  icono: ReactNode;
  valor: string;
  etiqueta: string;
}

export default function TarjetaEstadistica({ icono, valor, etiqueta }: PropsTarjetaEstadistica) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <div className="stat-card-icon">{icono}</div>
        <div className="stat-card-label">{etiqueta}</div>
      </div>
      <div className="stat-card-value">{valor}</div>
    </div>
  );
}
