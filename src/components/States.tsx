import type { ReactNode } from "react";
import { Loader2, Inbox, AlertTriangle } from "lucide-react";
import Button from "./Button";

export function LoadingState({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="state-block">
      <div className="state-icon loading">
        <Loader2 size={24} className="spin" />
      </div>
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="state-block">
      <div className="state-icon empty">{icon ?? <Inbox size={24} />}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "No pudimos generar el contenido.",
  description = "Ocurrió un problema inesperado. Inténtalo nuevamente.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-block">
      <div className="state-icon error">
        <AlertTriangle size={24} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Intentar nuevamente
        </Button>
      )}
    </div>
  );
}
