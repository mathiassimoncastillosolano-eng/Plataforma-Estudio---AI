import { useEffect, useRef, useState } from "react";
import { AlertCircle, Download } from "lucide-react";
import type { ResumenesGenerados, TipoResumen } from "../../tipos";
import { ErrorApi } from "../../servicios/clienteApi";
import { guardarArchivo, obtenerPdfResumen, resumenTieneContenido } from "../../servicios/servicioResumen";
import { useAviso } from "../../hooks/useAviso";
import Boton from "../Boton";
import { TEXTOS_TIPO_RESUMEN } from "./textosResumen";

interface PropsBotonDescargaResumen {
  resumenes: ResumenesGenerados;
  tipo: TipoResumen;
  tituloTema: string;
}

/**
 * Descarga en PDF el resumen indicado (solo ese). Usa el contenido que ya está en pantalla:
 * no genera de nuevo el resumen ni llama a la IA. Cada resumen tiene su propio botón y su
 * propio estado, por lo que funcionan de forma independiente.
 */
export default function BotonDescargaResumen({ resumenes, tipo, tituloTema }: PropsBotonDescargaResumen) {
  const { mostrarAviso } = useAviso();
  const [descargando, establecerDescargando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);
  const refAborto = useRef<AbortController | null>(null);
  const hayContenido = resumenTieneContenido(resumenes, tipo);
  const { titulo } = TEXTOS_TIPO_RESUMEN[tipo];

  useEffect(() => () => refAborto.current?.abort(), []);

  async function descargar() {
    if (!hayContenido || descargando) return;
    refAborto.current?.abort();
    const controlador = new AbortController();
    refAborto.current = controlador;
    establecerError(null);
    establecerDescargando(true);
    try {
      guardarArchivo(await obtenerPdfResumen(resumenes, tipo, tituloTema, controlador.signal));
      mostrarAviso(`${titulo} descargado en PDF.`);
    } catch (fallo) {
      if (controlador.signal.aborted) return;
      establecerError(fallo instanceof ErrorApi ? fallo.message : "No pudimos descargar el PDF. Inténtalo de nuevo.");
    } finally {
      if (!controlador.signal.aborted) establecerDescargando(false);
    }
  }

  return (
    <div className="reader-download">
      <Boton
        type="button"
        variante="secondary"
        tamano="sm"
        icono={<Download size={15} />}
        cargando={descargando}
        disabled={!hayContenido}
        onClick={descargar}
        title={hayContenido ? `Descargar ${titulo.toLowerCase()} en PDF` : "Este resumen todavía no tiene contenido"}
        aria-label={`Descargar ${titulo.toLowerCase()} en PDF`}
      >
        {descargando ? "Preparando PDF…" : `Descargar ${titulo.toLowerCase()} (PDF)`}
      </Boton>
      {!hayContenido && <p className="reader-download-hint">Este resumen todavía no tiene contenido para descargar.</p>}
      {error && (
        <div className="inline-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
