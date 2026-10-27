import type { ButtonHTMLAttributes } from "react";
import IconoGoogle from "./IconoGoogle";

interface PropsBotonGoogle extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  cargando?: boolean;
  /** Texto mientras se espera a Google (por defecto «Conectando con Google…»). */
  textoCargando?: string;
}

/**
 * Botón «Continuar con Google» según las directrices de marca: fondo neutro (claro u
 * oscuro según el tema), logotipo oficial sin alterar y texto claro. Los estilos viven
 * en acceso.css (.btn-google).
 */
export default function BotonGoogle({ cargando = false, textoCargando = "Conectando con Google…", disabled, className = "", ...resto }: PropsBotonGoogle) {
  return (
    <button
      type="button"
      className={`btn-google ${className}`.trim()}
      disabled={disabled || cargando}
      data-loading={cargando || undefined}
      aria-busy={cargando || undefined}
      {...resto}
    >
      <span className="btn-google-icono">{cargando ? <span className="btn-google-spinner" aria-hidden="true" /> : <IconoGoogle tamano={20} />}</span>
      <span className="btn-google-texto">{cargando ? textoCargando : "Continuar con Google"}</span>
    </button>
  );
}
