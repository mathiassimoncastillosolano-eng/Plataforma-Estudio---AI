import { useId, useState, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

interface FieldWrapperProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FieldWrapper({ id, label, hint, error, children }: FieldWrapperProps) {
  return (
    <div className="field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {error ? (
        <span className="field-error" id={`${id}-error`} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </span>
      ) : hint ? (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = "", id, type, ...rest }: InputProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  const control = (
    <input
      id={fieldId}
      className={`input ${error ? "input-error" : ""} ${className}`}
      type={isPassword && revealed ? "text" : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(fieldId, error, hint)}
      {...rest}
    />
  );

  return (
    <FieldWrapper id={fieldId} label={label} hint={hint} error={error}>
      {isPassword ? (
        <div className="input-wrap">
          {control}
          <button
            type="button"
            className="input-toggle"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={revealed}
          >
            {revealed ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      ) : (
        control
      )}
    </FieldWrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className = "", id, ...rest }: TextareaProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FieldWrapper id={fieldId} label={label} hint={hint} error={error}>
      <textarea
        id={fieldId}
        className={`textarea ${error ? "input-error" : ""} ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(fieldId, error, hint)}
        {...rest}
      />
    </FieldWrapper>
  );
}
