import { Check, ChevronDown, RotateCcw } from "lucide-react";
import type { PreguntaEstudio } from "../tipos";
import type { EstadoPregunta } from "../utilidades/estadoPregunta";
import { etiquetaDificultad } from "../utilidades/formato";
import Insignia from "./Insignia";

interface PropsTarjetaPregunta {
  pregunta: PreguntaEstudio;
  numero: number;
  abierto: boolean;
  estado?: EstadoPregunta;
  relacionados: string[];
  alAlternar: () => void;
  alEstado: (estado: EstadoPregunta | null) => void;
}

const tono = { facil: "green", media: "amber", dificil: "red" } as const;

/**
 * Pregunta de estudio como fila desplegable (no como tarjeta):
 * enunciado + [Ver respuesta] → respuesta, explicación y conceptos relacionados.
 */
export default function TarjetaPregunta({ pregunta, numero, abierto, estado, relacionados, alAlternar, alEstado }: PropsTarjetaPregunta) {
  const idPanel = `q-panel-${pregunta.id}`;
  const etiquetaCorrecta = pregunta.tipo === "abierta" ? pregunta.textoRespuestaCorrecta : pregunta.opciones?.find((o) => o.id === pregunta.idOpcionCorrecta)?.etiqueta;

  return (
    <article className={`qitem ${abierto ? "open" : ""} ${estado ? `is-${estado}` : ""}`}>
      <button className="qitem-head" onClick={alAlternar} aria-expanded={abierto} aria-controls={idPanel}>
        <span className="qitem-num mono">{String(numero).padStart(2, "0")}</span>
        <span className="qitem-prompt">{pregunta.enunciado}</span>
        <span className="qitem-side">
          <Insignia tono={tono[pregunta.dificultad]}>{etiquetaDificultad(pregunta.dificultad)}</Insignia>
          {estado === "conocida" && (
            <span className="qstatus known" title="Respondida correctamente">
              <Check size={13} strokeWidth={3} />
            </span>
          )}
          {estado === "repaso" && (
            <span className="qstatus review" title="Por repasar">
              <RotateCcw size={12} strokeWidth={3} />
            </span>
          )}
          <span className="qitem-toggle">
            {abierto ? "Ocultar" : "Ver respuesta"}
            <ChevronDown size={15} />
          </span>
        </span>
      </button>

      <div className="qitem-collapse" id={idPanel} role="region" aria-hidden={!abierto}>
        <div className="qitem-collapse-inner">
          <div className="qitem-body">
            {pregunta.tipo !== "abierta" && pregunta.opciones && (
              <ul className="qitem-options">
                {pregunta.opciones.map((o, i) => (
                  <li key={o.id} className={o.id === pregunta.idOpcionCorrecta ? "correct" : ""}>
                    <span className="qitem-letter">{pregunta.tipo === "verdadero-falso" ? (o.id === "v" ? "V" : "F") : String.fromCharCode(65 + i)}</span>
                    {o.etiqueta}
                    {o.id === pregunta.idOpcionCorrecta && <Check size={14} strokeWidth={3} aria-label="Respuesta correcta" />}
                  </li>
                ))}
              </ul>
            )}

            <div className="qitem-section">
              <h4>Respuesta</h4>
              <p className="qitem-answer">{etiquetaCorrecta}</p>
            </div>
            <div className="qitem-section">
              <h4>Explicación</h4>
              <p>{pregunta.explicacion}</p>
            </div>
            {relacionados.length > 0 && (
              <div className="qitem-section">
                <h4>Conceptos relacionados</h4>
                <div className="chip-list">
                  {relacionados.map((c) => (
                    <span key={c} className="chip">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="qitem-actions">
              <span>¿Qué tal te fue?</span>
              <button className={`mark-btn ${estado === "conocida" ? "on-known" : ""}`} onClick={() => alEstado(estado === "conocida" ? null : "conocida")} aria-pressed={estado === "conocida"}>
                <Check size={14} /> La sabía
              </button>
              <button className={`mark-btn ${estado === "repaso" ? "on-review" : ""}`} onClick={() => alEstado(estado === "repaso" ? null : "repaso")} aria-pressed={estado === "repaso"}>
                <RotateCcw size={14} /> Repasar
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
