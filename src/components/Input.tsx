import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function FieldWrapper({ label, hint, error, children }: FieldWrapperProps) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className = "", ...rest }: InputProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <input className={`input ${error ? "input-error" : ""} ${className}`} {...rest} />
    </FieldWrapper>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({ label, hint, error, className = "", ...rest }: TextareaProps) {
  return (
    <FieldWrapper label={label} hint={hint} error={error}>
      <textarea className={`textarea ${error ? "input-error" : ""} ${className}`} {...rest} />
    </FieldWrapper>
  );
}
