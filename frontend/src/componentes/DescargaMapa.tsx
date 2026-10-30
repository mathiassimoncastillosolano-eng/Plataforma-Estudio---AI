import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, ChevronDown, Download, FileText, Image as IconoImagen, Network, X } from "lucide-react";
import { useAviso } from "../hooks/useAviso";
import { useClicFuera } from "../hooks/useClicFuera";
import { useTemaVisual } from "../hooks/useTemaVisual";
import { ErrorApi } from "../servicios/clienteApi";
import { obtenerPdfMapa } from "../servicios/servicioMapaConceptual";
import { guardarArchivo } from "../servicios/servicioResumen";
import { dibujarMapaPng } from "../utilidades/dibujoMapa";
import { PALETAS_EXPORTACION, generarFreeMind, nombreArchivoMapa, type FormatoExportacion, type MapaExportable } from "../utilidades/exportacionMapa";
import Boton from "./Boton";

interface OpcionFormato {
  formato: FormatoExportacion;
  titulo: string;
  descripcion: string;
  icono: ReactNode;
  /** Nombre corto para los mensajes («Preparando PDF…», «descargado en PDF»). */
  corto: string;
}

const OPCIONES: OpcionFormato[] = [
  { formato: "pdf", titulo: "PDF para estudiar", descripcion: "El mapa y sus conceptos con descripción", icono: <FileText size={16} />, corto: "PDF" },
  { formato: "png", titulo: "Imagen PNG", descripcion: "Alta calidad, ideal para compartir", icono: <IconoImagen size={16} />, corto: "PNG" },
  { formato: "mm", titulo: "Mapa editable (.mm)", descripcion: "Para FreeMind, Freeplane o XMind", icono: <Network size={16} />, corto: ".mm" },
];

/** El PNG que va dentro del PDF no necesita más resolución que la de impresión de una hoja A4. */
const LADO_MAXIMO_PNG_PDF = 4200;

function blobABase64(blob: Blob): Promise<string> {
  return new Promise((resolver, rechazar) => {
    const lector = new FileReader();
    lector.onload = () => resolver(String(lector.result));
    lector.onerror = () => rechazar(lector.error ?? new Error("No se pudo leer la imagen."));
    lector.readAsDataURL(blob);
  });
}

interface PropsDescargaMapa {
  /** Devuelve el mapa tal como está AHORA en el lienzo (con las ediciones del estudiante). */
  obtenerMapa: () => MapaExportable;
}

/**
 * Menú de descarga del mapa conceptual: PDF (mapa + conceptos), PNG de alta calidad y FreeMind (.mm).
 * Usa la variante clara de la paleta elegida (azul o morada). Mientras prepara un archivo bloquea
 * nuevas descargas, indica qué formato se está generando y, al terminar, lo descarga y lo confirma.
 */
export default function DescargaMapa({ obtenerMapa }: PropsDescargaMapa) {
  const { acento } = useTemaVisual();
  const { mostrarAviso } = useAviso();
  const [abierto, establecerAbierto] = useState(false);
  const [enCurso, establecerEnCurso] = useState<OpcionFormato | null>(null);
  const [error, establecerError] = useState<string | null>(null);
  const ocupado = useRef(false);
  const refAborto = useRef<AbortController | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useClicFuera(ref as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  useEffect(() => () => refAborto.current?.abort(), []);

  async function exportar(opcion: OpcionFormato) {
    // Un único proceso a la vez: evita descargas duplicadas por varios clics seguidos.
    if (ocupado.current) return;
    ocupado.current = true;
    const controlador = new AbortController();
    refAborto.current = controlador;
    establecerAbierto(false);
    establecerError(null);
    establecerEnCurso(opcion);
    try {
      const mapa = obtenerMapa();
      if (mapa.nodos.length === 0) throw new ErrorApi("MAPA_SIN_CONCEPTOS", "El mapa no tiene conceptos para descargar.");
      const paleta = PALETAS_EXPORTACION[acento];
      let blob: Blob;
      if (opcion.formato === "mm") {
        blob = new Blob([generarFreeMind(mapa, paleta)], { type: "application/x-freemind;charset=utf-8" });
      } else if (opcion.formato === "png") {
        blob = await dibujarMapaPng(mapa, paleta, { conEncabezado: true, escalaMaxima: 3 });
      } else {
        const imagen = await dibujarMapaPng(mapa, paleta, { conEncabezado: false, ladoMaximo: LADO_MAXIMO_PNG_PDF, escalaMaxima: 3 });
        blob = (await obtenerPdfMapa(mapa, paleta, await blobABase64(imagen), controlador.signal)).blob;
      }
      if (controlador.signal.aborted) return;
      guardarArchivo({ blob, nombreArchivo: nombreArchivoMapa(mapa.titulo, opcion.formato) });
      mostrarAviso(`Mapa descargado en ${opcion.corto}.`);
    } catch (fallo) {
      if (controlador.signal.aborted) return;
      establecerError(fallo instanceof ErrorApi ? fallo.message : `No pudimos preparar el archivo ${opcion.corto}. Inténtalo de nuevo.`);
    } finally {
      ocupado.current = false;
      if (!controlador.signal.aborted) establecerEnCurso(null);
    }
  }

  return (
    <div className="dropdown cm-download" ref={ref}>
      <Boton
        variante="secondary"
        tamano="sm"
        icono={<Download size={14} />}
        cargando={!!enCurso}
        onClick={() => establecerAbierto((a) => !a)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label={enCurso ? `Preparando ${enCurso.corto}` : "Descargar el mapa"}
        title="Descargar el mapa"
      >
        <span className="hide-mobile">{enCurso ? `Preparando ${enCurso.corto}…` : "Descargar"}</span>
        {!enCurso && <ChevronDown size={13} className="hide-mobile cm-download-chevron" aria-hidden="true" />}
      </Boton>

      {abierto && (
        <div className="dropdown-panel cm-download-panel" role="menu" aria-label="Formatos de descarga">
          <p className="cm-download-title">Descargar el mapa actual</p>
          {OPCIONES.map((opcion) => (
            <button key={opcion.formato} className="dropdown-item cm-download-item" role="menuitem" onClick={() => exportar(opcion)}>
              {opcion.icono}
              <span>
                <span className="cm-download-name">{opcion.titulo}</span>
                <span className="cm-download-desc">{opcion.descripcion}</span>
              </span>
            </button>
          ))}
          <p className="cm-download-hint">Incluye tus cambios y usa la paleta {acento === "blue" ? "azul" : "morada"} en versión clara.</p>
        </div>
      )}

      {error && (
        <div className="cm-download-error" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <p>{error}</p>
          <button onClick={() => establecerError(null)} aria-label="Cerrar el aviso de error">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
