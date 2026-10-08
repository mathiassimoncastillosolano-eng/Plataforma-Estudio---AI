import { useId, type FormEvent } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { LIMITES_RESUMEN } from "../../configuracion";
import Boton from "../Boton";

interface PropsCompositorResumen {
  contenido: string;
  error?: string | null;
  alCambiarContenido: (valor: string) => void;
  alEnviar: () => void;
  alCancelar?: () => void;
}

const formatearCantidad = (n: number) => n.toLocaleString("es-ES");

export default function CompositorResumen({ contenido, error, alCambiarContenido, alEnviar, alCancelar }: PropsCompositorResumen) {
  const idCampo = useId();
  const longitud = contenido.trim().length;
  const demasiadoCorto = longitud > 0 && longitud < LIMITES_RESUMEN.min;
  const demasiadoLargo = longitud > LIMITES_RESUMEN.max;
  const puedeEnviar = longitud >= LIMITES_RESUMEN.min && !demasiadoLargo;

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (puedeEnviar) alEnviar();
  }

  return (
    <form className="composer" onSubmit={manejarEnvio}>
      <header className="composer-head">
        <span className="eyebrow">Resumen con IA</span>
        <h2>¿Qué quieres estudiar?</h2>
        <p>Pega o escribe tu material. La IA generará un resumen general y uno esencial, y podrás alternar entre ambos.</p>
      </header>

      <div className={`composer-field ${demasiadoLargo ? "is-invalid" : ""}`}>
        <label htmlFor={idCampo} className="sr-only">
          Contenido a resumir
        </label>
        <textarea
          id={idCampo}
          value={contenido}
          onChange={(e) => alCambiarContenido(e.target.value)}
          placeholder="Pega o escribe tu contenido…"
          aria-describedby={`${idCampo}-pista`}
          aria-invalid={demasiadoLargo || undefined}
        />
        <div className="composer-field-foot" id={`${idCampo}-pista`}>
          <span className={demasiadoCorto || demasiadoLargo ? "is-warn" : ""}>
            {demasiadoCorto
              ? `Escribe al menos ${formatearCantidad(LIMITES_RESUMEN.min)} caracteres (faltan ${formatearCantidad(LIMITES_RESUMEN.min - longitud)}).`
              : demasiadoLargo
                ? "El contenido supera el máximo permitido. Divídelo en partes."
                : longitud === 0
                  ? `Mínimo ${formatearCantidad(LIMITES_RESUMEN.min)} caracteres.`
                  : "Listo para resumir."}
          </span>
          <span className="mono">
            {formatearCantidad(longitud)} / {formatearCantidad(LIMITES_RESUMEN.max)}
          </span>
        </div>
      </div>

      {error && (
        <div className="inline-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}

      <div className="composer-actions">
        {alCancelar && (
          <Boton type="button" variante="ghost" onClick={alCancelar}>
            Volver al resumen
          </Boton>
        )}
        <Boton type="submit" tamano="lg" icono={<Sparkles size={17} />} disabled={!puedeEnviar}>
          Generar resumen
        </Boton>
      </div>
    </form>
  );
}
