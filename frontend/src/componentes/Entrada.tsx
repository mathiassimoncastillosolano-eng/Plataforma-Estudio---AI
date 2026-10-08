import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface PropsEnvolturaCampo {
  id: string;
  etiqueta?: string;
  pista?: string;
  error?: string;
  children: ReactNode;
}

function EnvolturaCampo({ id, etiqueta, pista, error, children }: PropsEnvolturaCampo) {
  return (
    <div className="field">
      {etiqueta && <label htmlFor={id}>{etiqueta}</label>}
      {children}
      {error ? (
        <span className="field-error" id={`${id}-error`} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </span>
      ) : pista ? (
        <span className="field-hint" id={`${id}-hint`}>
          {pista}
        </span>
      ) : null}
    </div>
  );
}

function descritoPor(id: string, error?: string, pista?: string) {
  if (error) return `${id}-error`;
  if (pista) return `${id}-hint`;
  return undefined;
}

interface PropsEntrada extends InputHTMLAttributes<HTMLInputElement> {
  etiqueta?: string;
  pista?: string;
  error?: string;
}

export function Entrada({ etiqueta, pista, error, className = "", id, type: tipo, ...rest }: PropsEntrada) {
  const idAutomatico = useId();
  const idCampo = id ?? idAutomatico;
  const [revelada, establecerRevelada] = useState(false);
  const esContrasena = tipo === "password";

  const control = (
    <input
      id={idCampo}
      className={`input ${error ? "input-error" : ""} ${className}`}
      type={esContrasena && revelada ? "text" : tipo}
      aria-invalid={error ? true : undefined}
      aria-describedby={descritoPor(idCampo, error, pista)}
      {...rest}
    />
  );

  return (
    <EnvolturaCampo id={idCampo} etiqueta={etiqueta} pista={pista} error={error}>
      {esContrasena ? (
        <div className="input-wrap">
          {control}
          <button
            type="button"
            className="input-toggle"
            onClick={() => establecerRevelada((v) => !v)}
            aria-label={revelada ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revelada}
          >
            {revelada ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      ) : (
        control
      )}
    </EnvolturaCampo>
  );
}

interface PropsAreaTexto extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  etiqueta?: string;
  pista?: string;
  error?: string;
}

export function AreaTexto({ etiqueta, pista, error, className = "", id, ...rest }: PropsAreaTexto) {
  const idAutomatico = useId();
  const idCampo = id ?? idAutomatico;
  return (
    <EnvolturaCampo id={idCampo} etiqueta={etiqueta} pista={pista} error={error}>
      <textarea
        id={idCampo}
        className={`textarea ${error ? "input-error" : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={descritoPor(idCampo, error, pista)}
        {...rest}
      />
    </EnvolturaCampo>
  );
}
