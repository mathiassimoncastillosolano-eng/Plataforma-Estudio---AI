import { useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { AlertCircle, FileText, Sparkles, UploadCloud, X } from "lucide-react";
import { LIMITE_BYTES_PDF, LIMITES_RESUMEN } from "../../configuracion";
import { formatearTamanoArchivo } from "../../utilidades/formato";
import Boton from "../Boton";

/** Máximo de caracteres del mensaje opcional del estudiante (coincide con el backend). */
const MAX_INDICACIONES = 2_000;

interface PropsCompositorResumen {
  /** "texto": el contenido se escribe o pega · "pdf": se analiza el PDF original y el texto son indicaciones opcionales. */
  modo?: "texto" | "pdf";
  archivo?: File | null;
  nombreArchivoEsperado?: string;
  alCambiarArchivo?: (archivo: File | null) => void;
  contenido: string;
  error?: string | null;
  alCambiarContenido: (valor: string) => void;
  alEnviar: () => void;
  alCancelar?: () => void;
}

const formatearCantidad = (n: number) => n.toLocaleString("es-ES");

export default function CompositorResumen({
  modo = "texto",
  archivo = null,
  nombreArchivoEsperado,
  alCambiarArchivo,
  contenido,
  error,
  alCambiarContenido,
  alEnviar,
  alCancelar,
}: PropsCompositorResumen) {
  const idCampo = useId();
  const refEntradaArchivo = useRef<HTMLInputElement>(null);
  const [errorArchivo, establecerErrorArchivo] = useState("");
  const [arrastrando, establecerArrastrando] = useState(false);
  const esPdf = modo === "pdf";

  const longitud = contenido.trim().length;
  const demasiadoCorto = !esPdf && longitud > 0 && longitud < LIMITES_RESUMEN.min;
  const demasiadoLargo = esPdf ? longitud > MAX_INDICACIONES : longitud > LIMITES_RESUMEN.max;
  const puedeEnviar = esPdf ? archivo !== null && !demasiadoLargo : longitud >= LIMITES_RESUMEN.min && !demasiadoLargo;

  function elegirArchivo(seleccionado: File | null) {
    if (!seleccionado) return;
    if (seleccionado.type !== "application/pdf") {
      establecerErrorArchivo("Ese archivo no es un PDF. Selecciona un documento .pdf.");
      return;
    }
    if (seleccionado.size > LIMITE_BYTES_PDF) {
      establecerErrorArchivo(`El PDF pesa ${formatearTamanoArchivo(seleccionado.size)} y el máximo es ${formatearTamanoArchivo(LIMITE_BYTES_PDF)}.`);
      return;
    }
    establecerErrorArchivo("");
    alCambiarArchivo?.(seleccionado);
  }

  function manejarEnvio(e: FormEvent) {
    e.preventDefault();
    if (puedeEnviar) alEnviar();
  }

  return (
    <form className="composer" onSubmit={manejarEnvio}>
      <header className="composer-head">
        <span className="eyebrow">Resumen con IA</span>
        <h2>{esPdf ? "Resume tu documento" : "¿Qué quieres estudiar?"}</h2>
        <p>
          {esPdf
            ? "La IA analiza tu PDF completo, con sus tablas, diagramas y gráficos, y genera un resumen esencial y uno general."
            : "Pega o escribe tu material. La IA generará un resumen general y uno esencial, y podrás alternar entre ambos."}
        </p>
      </header>

      {esPdf &&
        (archivo ? (
          <div className="file-chip">
            <div className="file-chip-icon">
              <FileText size={18} />
            </div>
            <div className="file-chip-info">
              <div className="file-chip-name">{archivo.name}</div>
              <div className="file-chip-size">{formatearTamanoArchivo(archivo.size)}</div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => alCambiarArchivo?.(null)}>
              <X size={14} />
              Quitar
            </button>
          </div>
        ) : (
          <div
            className={`dropzone ${arrastrando ? "dragging" : ""}`}
            role="button"
            tabIndex={0}
            onClick={() => refEntradaArchivo.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && refEntradaArchivo.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              establecerArrastrando(true);
            }}
            onDragLeave={() => establecerArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              establecerArrastrando(false);
              elegirArchivo(e.dataTransfer.files?.[0] ?? null);
            }}
          >
            <div className="dropzone-icon">
              <UploadCloud size={24} />
            </div>
            <p style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>
              {nombreArchivoEsperado ? `Adjunta de nuevo «${nombreArchivoEsperado}»` : "Arrastra tu PDF aquí"}
            </p>
            <p style={{ fontSize: 13 }}>o haz clic para seleccionar un archivo</p>
            <input
              ref={refEntradaArchivo}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                elegirArchivo(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </div>
        ))}
      {errorArchivo && (
        <p className="field-error" role="alert">
          {errorArchivo}
        </p>
      )}

      <div className={`composer-field ${demasiadoLargo ? "is-invalid" : ""}`}>
        <label htmlFor={idCampo} className={esPdf ? undefined : "sr-only"}>
          {esPdf ? "Indicaciones para la IA (opcional)" : "Contenido a resumir"}
        </label>
        <textarea
          id={idCampo}
          value={contenido}
          onChange={(e) => alCambiarContenido(e.target.value)}
          placeholder={esPdf ? "Ej.: Estoy estudiando para un examen; dame prioridad a las fórmulas y a los procesos." : "Pega o escribe tu contenido…"}
          aria-describedby={`${idCampo}-pista`}
          aria-invalid={demasiadoLargo || undefined}
          style={esPdf ? { minHeight: 110 } : undefined}
        />
        <div className="composer-field-foot" id={`${idCampo}-pista`}>
          <span className={demasiadoCorto || demasiadoLargo ? "is-warn" : ""}>
            {esPdf
              ? demasiadoLargo
                ? "El mensaje supera el máximo permitido."
                : archivo
                  ? "Listo para analizar el documento."
                  : "Adjunta el PDF para continuar."
              : demasiadoCorto
                ? `Escribe al menos ${formatearCantidad(LIMITES_RESUMEN.min)} caracteres (faltan ${formatearCantidad(LIMITES_RESUMEN.min - longitud)}).`
                : demasiadoLargo
                  ? "El contenido supera el máximo permitido. Divídelo en partes."
                  : longitud === 0
                    ? `Mínimo ${formatearCantidad(LIMITES_RESUMEN.min)} caracteres.`
                    : "Listo para resumir."}
          </span>
          <span className="mono">
            {formatearCantidad(longitud)} / {formatearCantidad(esPdf ? MAX_INDICACIONES : LIMITES_RESUMEN.max)}
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
