import { useState } from "react";
import { Check, X } from "lucide-react";
import type { PreguntaEstudio } from "../tipos";
import Insignia from "./Insignia";
import Boton from "./Boton";
import { etiquetaDificultad } from "../utilidades/formato";

interface PropsPreguntaPractica {
  pregunta: PreguntaEstudio;
  indice: number;
  total: number;
  alResponder: (esCorrecta: boolean) => void;
  alSiguiente: () => void;
  esUltima: boolean;
}

const tonoDificultad: Record<string, "green" | "amber" | "red"> = {
  facil: "green",
  media: "amber",
  dificil: "red",
};

export default function PreguntaPractica({ pregunta, indice, total, alResponder, alSiguiente, esUltima }: PropsPreguntaPractica) {
  const [idSeleccionado, establecerIdSeleccionado] = useState<string | null>(null);
  const [respuestaAbierta, establecerRespuestaAbierta] = useState("");
  const [revisada, establecerRevisada] = useState(false);

  const esCorrecta =
    pregunta.tipo === "abierta"
      ? respuestaAbierta.trim().length > 8
      : idSeleccionado === pregunta.idOpcionCorrecta;

  function manejarVerificacion() {
    establecerRevisada(true);
    alResponder(esCorrecta);
  }

  function manejarSiguiente() {
    establecerIdSeleccionado(null);
    establecerRespuestaAbierta("");
    establecerRevisada(false);
    alSiguiente();
  }

  return (
    <div className="question-card">
      <div className="question-eyebrow">
        <span className="text-muted mono" style={{ fontSize: 13 }}>
          Pregunta {indice + 1} de {total}
        </span>
        <Insignia tono={tonoDificultad[pregunta.dificultad] ?? "neutral"}>
          {etiquetaDificultad(pregunta.dificultad)}
        </Insignia>
      </div>

      <p className="question-prompt">{pregunta.enunciado}</p>

      {pregunta.tipo === "abierta" ? (
        <textarea
          className="textarea"
          style={{ minHeight: 110 }}
          placeholder="Escribe tu respuesta..."
          value={respuestaAbierta}
          disabled={revisada}
          onChange={(e) => establecerRespuestaAbierta(e.target.value)}
        />
      ) : (
        <div className="answer-options">
          {pregunta.opciones?.map((opcion) => {
            let claseEstado = "";
            if (revisada) {
              if (opcion.id === pregunta.idOpcionCorrecta) claseEstado = "correct";
              else if (opcion.id === idSeleccionado) claseEstado = "incorrect";
            } else if (opcion.id === idSeleccionado) {
              claseEstado = "selected";
            }
            return (
              <button
                key={opcion.id}
                className={`answer-option ${claseEstado}`}
                disabled={revisada}
                onClick={() => establecerIdSeleccionado(opcion.id)}
              >
                <span className="option-marker">
                  {revisada && opcion.id === pregunta.idOpcionCorrecta ? (
                    <Check size={13} />
                  ) : revisada && opcion.id === idSeleccionado ? (
                    <X size={13} />
                  ) : (
                    opcion.id.toUpperCase()
                  )}
                </span>
                {opcion.etiqueta}
              </button>
            );
          })}
        </div>
      )}

      {revisada && (
        <div className={`feedback-panel ${esCorrecta ? "correct" : "incorrect"}`}>
          <div>
            <h4>{esCorrecta ? "✓ Correcto" : "✕ Incorrecto"}</h4>
            {!esCorrecta && pregunta.tipo !== "abierta" && (
              <p>
                <strong>Respuesta correcta: </strong>
                {pregunta.opciones?.find((o) => o.id === pregunta.idOpcionCorrecta)?.etiqueta}
              </p>
            )}
            {!esCorrecta && pregunta.tipo === "abierta" && (
              <p>
                <strong>Respuesta esperada: </strong>
                {pregunta.textoRespuestaCorrecta}
              </p>
            )}
            <p style={{ marginTop: 6 }}>{pregunta.explicacion}</p>
          </div>
        </div>
      )}

      <div className="question-nav-row">
        <span />
        {!revisada ? (
          <Boton
            onClick={manejarVerificacion}
            disabled={pregunta.tipo === "abierta" ? respuestaAbierta.trim().length === 0 : !idSeleccionado}
          >
            Comprobar respuesta
          </Boton>
        ) : (
          <Boton onClick={manejarSiguiente}>{esUltima ? "Ver resumen" : "Siguiente pregunta"}</Boton>
        )}
      </div>
    </div>
  );
}
