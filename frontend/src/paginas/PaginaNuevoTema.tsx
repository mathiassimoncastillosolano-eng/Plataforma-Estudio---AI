import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, PenLine, UploadCloud, X, ArrowLeft } from "lucide-react";
import Boton from "../componentes/Boton";
import { Entrada } from "../componentes/Entrada";
import * as servicioEstudio from "../servicios/servicioEstudio";
import * as servicioContenido from "../servicios/servicioContenido";
import { ErrorApi } from "../servicios/clienteApi";
import { registrarActividad, establecerFuenteTema } from "../almacen/almacenSesion";
import { LIMITE_BYTES_PDF, LIMITES_RESUMEN } from "../configuracion";
import { formatearTamanoArchivo } from "../utilidades/formato";
import type { BorradorFuente } from "../tipos";

type Paso = "titulo" | "fuente" | "pdf" | "texto";

const OPCIONES_CATEGORIA = ["Biología", "Historia", "Informática", "Matemáticas", "Física", "Química", "Idiomas", "Otra"];

export default function PaginaNuevoTema() {
  const navegar = useNavigate();
  const [paso, establecerPaso] = useState<Paso>("titulo");
  const [titulo, establecerTitulo] = useState("");
  const [categoria, establecerCategoria] = useState(OPCIONES_CATEGORIA[0]);
  const [errorTitulo, establecerErrorTitulo] = useState("");

  const [archivo, establecerArchivo] = useState<File | null>(null);
  const [arrastrando, establecerArrastrando] = useState(false);
  const [errorArchivo, establecerErrorArchivo] = useState("");
  const refEntradaArchivo = useRef<HTMLInputElement>(null);

  const [textoBruto, establecerTextoBruto] = useState("");

  const [creando, establecerCreando] = useState(false);

  const ordenPasos: Paso[] = ["titulo", "fuente", paso === "pdf" ? "pdf" : "texto"];
  const indiceActual = paso === "titulo" ? 0 : paso === "fuente" ? 1 : 2;

  function irAFuente() {
    if (!titulo.trim()) {
      establecerErrorTitulo("Ingresa el nombre del tema que quieres estudiar.");
      return;
    }
    establecerErrorTitulo("");
    establecerPaso("fuente");
  }

  function manejarSeleccionArchivo(seleccionado: File | null) {
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
    establecerArchivo(seleccionado);
  }

  function manejarSoltar(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    establecerArrastrando(false);
    manejarSeleccionArchivo(e.dataTransfer.files?.[0] ?? null);
  }

  async function crearTema(borrador: BorradorFuente) {
    establecerCreando(true);
    const temaNuevo = await servicioEstudio.crearTemaEstudio(borrador);
    // El contenido escrito vive solo en la sesión: el resumen lo usará directamente.
    if (borrador.textoBruto) establecerFuenteTema(temaNuevo.id, borrador.textoBruto.trim());
    registrarActividad({ tipo: "tema-creado", idTema: temaNuevo.id, tituloTema: temaNuevo.titulo, descripcion: "Creaste un nuevo tema de estudio." });
    navegar(`/estudio/${temaNuevo.id}/resumen`);
  }

  /** El backend extrae el texto del PDF (sin guardarlo); ese texto pasa a ser el contenido del tema. */
  async function enviarPdf() {
    if (!archivo) return;
    establecerErrorArchivo("");
    establecerCreando(true);
    try {
      const contenido = await servicioContenido.extraerTextoPdf(archivo);
      await crearTema({
        tituloTema: titulo,
        categoria,
        tipoFuente: "pdf",
        nombreArchivo: archivo.name,
        etiquetaTamanoArchivo: formatearTamanoArchivo(archivo.size),
        textoBruto: contenido.texto,
      });
    } catch (fallo) {
      establecerErrorArchivo(fallo instanceof ErrorApi ? fallo.message : "No pudimos leer el PDF. Inténtalo de nuevo.");
      establecerCreando(false);
    }
  }

  function enviarTexto() {
    if (textoBruto.trim().length < LIMITES_RESUMEN.min) return;
    crearTema({
      tituloTema: titulo,
      categoria,
      tipoFuente: "texto",
      textoBruto,
    });
  }

  return (
    <div className="flow-shell">
      <div className="flow-progress">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`flow-progress-step ${i <= indiceActual ? "done" : ""}`} />
        ))}
      </div>

      {paso === "titulo" && (
        <>
          <p className="flow-step-label">Paso 1 de 3</p>
          <h1 className="flow-title">¿Qué quieres estudiar?</h1>
          <p className="flow-subtitle">Dale un nombre claro a tu tema para que puedas encontrarlo fácilmente después.</p>

          <div className="stack gap-md">
            <Entrada
              etiqueta="Nombre del tema"
              placeholder="Ej. Sistema circulatorio humano"
              value={titulo}
              error={errorTitulo}
              onChange={(e) => establecerTitulo(e.target.value)}
              autoFocus
            />
            <div className="field">
              <label>Categoría</label>
              <select className="select" value={categoria} onChange={(e) => establecerCategoria(e.target.value)}>
                {OPCIONES_CATEGORIA.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flow-footer">
            <span />
            <Boton onClick={irAFuente}>Continuar</Boton>
          </div>
        </>
      )}

      {paso === "fuente" && (
        <>
          <p className="flow-step-label">Paso 2 de 3</p>
          <h1 className="flow-title">¿Cómo quieres proporcionar el contenido?</h1>
          <p className="flow-subtitle">Puedes subir un documento PDF o escribir el contenido directamente.</p>

          <div className="source-choice-grid">
            <button className="source-choice-card" onClick={() => establecerPaso("pdf")}>
              <div className="source-choice-icon">
                <FileText size={24} />
              </div>
              <span className="source-choice-title">PDF</span>
              <span className="source-choice-desc">Sube tu documento</span>
            </button>
            <div className="or-divider">O</div>
            <button className="source-choice-card" onClick={() => establecerPaso("texto")}>
              <div className="source-choice-icon">
                <PenLine size={24} />
              </div>
              <span className="source-choice-title">Texto</span>
              <span className="source-choice-desc">Escribe tu contenido</span>
            </button>
          </div>

          <div className="flow-footer">
            <Boton variante="ghost" onClick={() => establecerPaso("titulo")}>
              <ArrowLeft size={15} />
              Atrás
            </Boton>
            <span />
          </div>
        </>
      )}

      {paso === "pdf" && (
        <>
          <p className="flow-step-label">Paso 3 de 3</p>
          <h1 className="flow-title">Sube tu documento</h1>
          <p className="flow-subtitle">Aceptamos archivos PDF con texto seleccionable. Extraemos el texto en el servidor y el archivo no se guarda.</p>

          {!archivo ? (
            <div
              className={`dropzone ${arrastrando ? "dragging" : ""}`}
              onClick={() => refEntradaArchivo.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                establecerArrastrando(true);
              }}
              onDragLeave={() => establecerArrastrando(false)}
              onDrop={manejarSoltar}
            >
              <div className="dropzone-icon">
                <UploadCloud size={24} />
              </div>
              <p style={{ fontWeight: 600, color: "var(--color-text)", marginBottom: 4 }}>Arrastra tu PDF aquí</p>
              <p style={{ fontSize: 13 }}>o haz clic para seleccionar un archivo</p>
              <input
                ref={refEntradaArchivo}
                type="file"
                accept="application/pdf"
                hidden
                onChange={(e: ChangeEvent<HTMLInputElement>) => manejarSeleccionArchivo(e.target.files?.[0] ?? null)}
              />
            </div>
          ) : (
            <div className="file-chip">
              <div className="file-chip-icon">
                <FileText size={18} />
              </div>
              <div className="file-chip-info">
                <div className="file-chip-name">{archivo.name}</div>
                <div className="file-chip-size">{formatearTamanoArchivo(archivo.size)}</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => establecerArchivo(null)}>
                <X size={14} />
                Eliminar
              </button>
            </div>
          )}
          {errorArchivo && (
            <p className="field-error" role="alert">
              {errorArchivo}
            </p>
          )}

          <div className="flow-footer">
            <Boton variante="ghost" onClick={() => establecerPaso("fuente")}>
              <ArrowLeft size={15} />
              Atrás
            </Boton>
            <Boton onClick={enviarPdf} disabled={!archivo} cargando={creando}>
              {creando ? "Leyendo PDF…" : "Crear tema"}
            </Boton>
          </div>
        </>
      )}

      {paso === "texto" && (
        <>
          <p className="flow-step-label">Paso 3 de 3</p>
          <h1 className="flow-title">Escribe tu contenido</h1>
          <p className="flow-subtitle">Pega o escribe el material. En el siguiente paso generarás el resumen general y el esencial.</p>

          <div className="field">
            <label>Contenido</label>
            <textarea
              className="textarea"
              placeholder="Pega o escribe aquí el contenido..."
              value={textoBruto}
              onChange={(e) => establecerTextoBruto(e.target.value)}
            />
            <div className="char-count">
              {textoBruto.trim().length.toLocaleString("es-ES")} caracteres · mínimo {LIMITES_RESUMEN.min}
            </div>
          </div>

          <div className="flow-footer">
            <Boton variante="ghost" onClick={() => establecerPaso("fuente")}>
              <ArrowLeft size={15} />
              Atrás
            </Boton>
            <Boton onClick={enviarTexto} disabled={textoBruto.trim().length < LIMITES_RESUMEN.min} cargando={creando}>
              Crear tema
            </Boton>
          </div>
        </>
      )}
    </div>
  );
}
