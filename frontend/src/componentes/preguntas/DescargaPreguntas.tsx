import { useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown, Download, ListChecks, Table2 } from "lucide-react";
import { useAviso } from "../../hooks/useAviso";
import { useClicFuera } from "../../hooks/useClicFuera";
import { ErrorApi } from "../../servicios/clienteApi";
import { descargarPreguntas, type FormatoDescargaPreguntas, type ModoRespuestasDescarga } from "../../servicios/servicioPreguntas";
import { guardarArchivo } from "../../servicios/servicioResumen";
import Boton from "../Boton";

interface PropsDescargaPreguntas {
  idTema: string;
  titulo: string;
  total: number;
}

function LogoPdf() {
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true">
      <path d="M4 1h17l9 9v27a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z" fill="#fff" stroke="#e5484d" strokeWidth="1.6" />
      <path d="M21 1v7a2 2 0 0 0 2 2h7" fill="#fde8e9" stroke="#e5484d" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="2" y="19" width="26" height="12" rx="3" fill="#e5484d" />
      <text x="15" y="28" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        PDF
      </text>
    </svg>
  );
}

function LogoWord() {
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden="true">
      <path d="M4 1h17l9 9v27a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2Z" fill="#fff" stroke="#2b6cd9" strokeWidth="1.6" />
      <path d="M21 1v7a2 2 0 0 0 2 2h7" fill="#e3edfc" stroke="#2b6cd9" strokeWidth="1.6" strokeLinejoin="round" />
      <rect x="2" y="19" width="26" height="12" rx="3" fill="#2b6cd9" />
      <text x="15" y="28.5" textAnchor="middle" fontSize="10" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        W
      </text>
    </svg>
  );
}

const FORMATOS: { id: FormatoDescargaPreguntas; nombre: string; detalle: string; corto: string; logo: JSX.Element }[] = [
  { id: "pdf", nombre: "PDF", detalle: "Listo para leer o imprimir", corto: "PDF", logo: <LogoPdf /> },
  { id: "docx", nombre: "Word", detalle: "Editable en .docx", corto: "Word", logo: <LogoWord /> },
];

const MODOS: { id: ModoRespuestasDescarga; nombre: string; detalle: string; icono: JSX.Element }[] = [
  { id: "junto", nombre: "Junto a cada pregunta", detalle: "La correcta en verde y su explicación debajo. Ideal para aprender.", icono: <ListChecks size={18} /> },
  { id: "final", nombre: "Al final, en una tabla", detalle: "Primero todas las preguntas y, en la última hoja, las respuestas. Ideal para ponerte a prueba.", icono: <Table2 size={18} /> },
];

export default function DescargaPreguntas({ idTema, titulo, total }: PropsDescargaPreguntas) {
  const { mostrarAviso } = useAviso();
  const [abierto, establecerAbierto] = useState(false);
  const [formato, establecerFormato] = useState<FormatoDescargaPreguntas>("pdf");
  const [modo, establecerModo] = useState<ModoRespuestasDescarga>("junto");
  const [descargando, establecerDescargando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const refAborto = useRef<AbortController | null>(null);
  useClicFuera(ref as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  useEffect(() => () => refAborto.current?.abort(), []);

  const elegido = FORMATOS.find((f) => f.id === formato) ?? FORMATOS[0];

  async function descargar() {
    if (descargando) return;
    const controlador = new AbortController();
    refAborto.current = controlador;
    establecerError(null);
    establecerDescargando(true);
    try {
      guardarArchivo(await descargarPreguntas(idTema, titulo, formato, modo, controlador.signal));
      mostrarAviso(`Preguntas descargadas en ${elegido.corto}.`);
      establecerAbierto(false);
    } catch (fallo) {
      if (controlador.signal.aborted) return;
      establecerError(fallo instanceof ErrorApi ? fallo.message : "No pudimos preparar el archivo. Inténtalo de nuevo.");
    } finally {
      if (!controlador.signal.aborted) establecerDescargando(false);
    }
  }

  return (
    <div className="dropdown desc-preg" ref={ref}>
      <Boton variante="secondary" tamano="sm" icono={<Download size={15} />} onClick={() => establecerAbierto((a) => !a)} aria-haspopup="dialog" aria-expanded={abierto} title="Descargar todas las preguntas" data-tour="preguntas-descargar">
        <span>Descargar</span>
        <ChevronDown size={13} className="desc-preg-chevron" aria-hidden="true" />
      </Boton>

      {abierto && (
        <div className="dropdown-panel desc-preg-panel" role="dialog" aria-label="Descargar preguntas">
          <header className="desc-preg-cabeza">
            <strong>Descargar preguntas</strong>
            <span>
              {total} {total === 1 ? "pregunta" : "preguntas"} con sus respuestas
            </span>
          </header>

          <p className="desc-preg-etiqueta">Formato</p>
          <div className="desc-preg-formatos" role="radiogroup" aria-label="Formato del archivo">
            {FORMATOS.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={formato === f.id} className={`desc-preg-formato ${formato === f.id ? "activo" : ""}`} onClick={() => establecerFormato(f.id)}>
                {f.logo}
                <span>
                  <strong>{f.nombre}</strong>
                  <small>{f.detalle}</small>
                </span>
              </button>
            ))}
          </div>

          <p className="desc-preg-etiqueta">Respuestas</p>
          <div className="desc-preg-modos" role="radiogroup" aria-label="Dónde van las respuestas">
            {MODOS.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={modo === m.id} className={`desc-preg-modo ${modo === m.id ? "activo" : ""}`} onClick={() => establecerModo(m.id)}>
                <span className="desc-preg-modo-icono">{m.icono}</span>
                <span>
                  <strong>{m.nombre}</strong>
                  <small>{m.detalle}</small>
                </span>
              </button>
            ))}
          </div>

          {error && (
            <div className="inline-alert" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          <Boton variante="primary" tamano="sm" icono={<Download size={15} />} cargando={descargando} disabled={total === 0} onClick={descargar} className="desc-preg-accion">
            {descargando ? `Preparando ${elegido.corto}…` : `Descargar ${elegido.corto}`}
          </Boton>
        </div>
      )}
    </div>
  );
}
