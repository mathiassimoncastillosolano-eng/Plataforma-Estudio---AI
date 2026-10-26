import { Link } from "react-router-dom";
import { ArrowRight, Clock, HelpCircle, Trash2 } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import BarraProgreso from "./BarraProgreso";
import Insignia from "./Insignia";
import { obtenerEstadoTema, etiquetasEstadoTema } from "../datos/temasEstudio";

interface PropsTarjetaTemaEstudio {
  tema: TemaEstudio;
  /** Si se indica, la tarjeta muestra un botón para eliminar ese tema (la página pide la confirmación). */
  alEliminar?: (tema: TemaEstudio) => void;
}

export default function TarjetaTemaEstudio({ tema, alEliminar }: PropsTarjetaTemaEstudio) {
  const estado = obtenerEstadoTema(tema);

  // El botón de eliminar es hermano del enlace (no hijo): un botón dentro de un <a> no es HTML válido
  // y abriría el tema al pulsarlo.
  const tarjeta = (
    <Link to={`/estudio/${tema.id}`} className="topic-card" style={{ textDecoration: "none" }}>
      <div className="topic-card-top-row">
        <Insignia tono="blue">{tema.categoria}</Insignia>
        <span className={`status-pill status-${estado}`}>{etiquetasEstadoTema[estado]}</span>
      </div>

      <div>
        <h3 className="topic-card-title">{tema.titulo}</h3>
        {tema.descripcion && (
          <p className="text-muted" style={{ fontSize: "var(--fs-caption)", marginTop: 6, lineHeight: 1.5 }}>
            {tema.descripcion}
          </p>
        )}
      </div>

      <div>
        <div className="topic-card-progress-row">
          <span>Dominio</span>
          <span>{tema.dominio}%</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <BarraProgreso valor={tema.dominio} />
        </div>
      </div>

      <div className="topic-card-meta">
        <span className="row gap-xs">
          <Clock size={13} aria-hidden="true" />
          {tema.ultimoEstudioEn}
        </span>
        <span className="row gap-xs">
          <HelpCircle size={13} aria-hidden="true" />
          {tema.preguntasRespondidas} preguntas
        </span>
      </div>

      <span className="btn btn-secondary btn-sm" style={{ justifyContent: "space-between" }}>
        Continuar estudiando
        <ArrowRight size={15} className="icon-nudge" aria-hidden="true" />
      </span>
    </Link>
  );

  if (!alEliminar) return tarjeta;

  return (
    <div className="topic-card-wrap">
      {tarjeta}
      <button
        type="button"
        className="icon-btn topic-card-delete"
        aria-label={`Eliminar el tema ${tema.titulo}`}
        title="Eliminar tema"
        onClick={() => alEliminar(tema)}
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
