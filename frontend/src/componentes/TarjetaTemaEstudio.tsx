import { Link } from "react-router-dom";
import { ArrowRight, Clock, HelpCircle } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import BarraProgreso from "./BarraProgreso";
import Insignia from "./Insignia";
import { obtenerEstadoTema, etiquetasEstadoTema } from "../datos/temasEstudio";

export default function TarjetaTemaEstudio({ tema }: { tema: TemaEstudio }) {
  const estado = obtenerEstadoTema(tema);

  return (
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
}
