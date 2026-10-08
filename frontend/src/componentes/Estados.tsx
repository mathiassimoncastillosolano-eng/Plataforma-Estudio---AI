import type { ReactNode } from "react";
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import Boton from "./Boton";

export function EstadoCarga({ mensaje = "Cargando..." }: { mensaje?: string }) {
  return (
    <div className="state-block">
      <div className="state-icon loading">
        <Loader2 size={24} className="spin" />
      </div>
      <p>{mensaje}</p>
    </div>
  );
}

export function EmptyState({
  titulo,
  descripcion,
  accion,
  icono,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  icono?: ReactNode;
}) {
  return (
    <div className="state-block">
      <div className="state-icon empty">{icono ?? <Inbox size={24} />}</div>
      <h3>{titulo}</h3>
      {descripcion && <p>{descripcion}</p>}
      {accion}
    </div>
  );
}

export function ErrorState({
  titulo = "No pudimos generar el contenido.",
  descripcion = "Ocurrió un problema inesperado. Inténtalo nuevamente.",
  alReintentar,
}: {
  titulo?: string;
  descripcion?: string;
  alReintentar?: () => void;
}) {
  return (
    <div className="state-block">
      <div className="state-icon error">
        <AlertTriangle size={24} />
      </div>
      <h3>{titulo}</h3>
      <p>{descripcion}</p>
      {alReintentar && (
        <Boton variante="secondary" onClick={alReintentar}>
          Intentar nuevamente
        </Boton>
      )}
    </div>
  );
}
