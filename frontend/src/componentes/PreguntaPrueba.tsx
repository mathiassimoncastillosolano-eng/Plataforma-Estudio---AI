import type { PreguntaEstudio } from "../tipos";

interface PropsPreguntaPrueba {
  pregunta: PreguntaEstudio;
  indice: number;
  total: number;
  idOpcionSeleccionada?: string;
  textoRespuestaAbierta?: string;
  alSeleccionarOpcion: (idOpcion: string) => void;
  alCambiarRespuestaAbierta: (texto: string) => void;
}

export default function PreguntaPrueba({
  pregunta,
  indice,
  total,
  idOpcionSeleccionada,
  textoRespuestaAbierta,
  alSeleccionarOpcion,
  alCambiarRespuestaAbierta,
}: PropsPreguntaPrueba) {
  return (
    <div className="question-card">
      <div className="question-eyebrow">
        <span className="text-muted mono" style={{ fontSize: 13 }}>
          Pregunta {indice + 1} de {total}
        </span>
      </div>

      <p className="question-prompt">{pregunta.enunciado}</p>

      {pregunta.tipo === "abierta" ? (
        <textarea
          className="textarea"
          style={{ minHeight: 110 }}
          placeholder="Escribe tu respuesta..."
          value={textoRespuestaAbierta ?? ""}
          onChange={(e) => alCambiarRespuestaAbierta(e.target.value)}
        />
      ) : (
        <div className="answer-options">
          {pregunta.opciones?.map((opcion) => (
            <button
              key={opcion.id}
              className={`answer-option ${opcion.id === idOpcionSeleccionada ? "selected" : ""}`}
              onClick={() => alSeleccionarOpcion(opcion.id)}
            >
              <span className="option-marker">{opcion.id.toUpperCase()}</span>
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
