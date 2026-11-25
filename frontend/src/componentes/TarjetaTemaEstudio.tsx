import { Link } from "react-router-dom";
import { ArrowRight, Clock, HelpCircle, Trash2 } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import Insignia from "./Insignia";
import { obtenerEstadoTema, etiquetasEstadoTema } from "../datos/temasEstudio";
import { nivelBarra } from "../utilidades/nivelBarra";

interface PropsTarjetaTemaEstudio {
  tema: TemaEstudio;
  alEliminar?: (tema: TemaEstudio) => void;
}

export default function TarjetaTemaEstudio({ tema, alEliminar }: PropsTarjetaTemaEstudio) {
  const estado = obtenerEstadoTema(tema);
  const dominio = Math.max(0, Math.min(100, tema.dominio));

  const tarjeta = (
    <Link to={`/estudio/${tema.id}`} className="topic-card tema-card" data-nivel={nivelBarra(dominio)} data-estado={estado} style={{ textDecoration: "none" }}>
      <span className="tema-card-brillo" aria-hidden="true" />
      <div className="topic-card-top-row">
        <Insignia tono="blue">{tema.categoria}</Insignia>
        <span className={`status-pill status-${estado}`}>{etiquetasEstadoTema[estado]}</span>
      </div>

      <div className="tema-card-texto">
        <h3 className="topic-card-title">{tema.titulo}</h3>
        <p className="tema-card-desc">{tema.descripcion ?? ""}</p>
      </div>

      <div className="tema-card-dominio">
        <div className="topic-card-progress-row">
          <span>Dominio</span>
          <strong className="tema-card-valor mono">{dominio}%</strong>
        </div>
        <div className="tema-barra" role="progressbar" aria-valuenow={dominio} aria-valuemin={0} aria-valuemax={100} aria-label={`Dominio de ${tema.titulo}`}>
          <span style={{ width: `${dominio}%` }} />
        </div>
      </div>

      <div className="topic-card-meta">
        <span className="row gap-xs">
          <Clock size={13} aria-hidden="true" />
          {tema.ultimoEstudioEn}
        </span>
        <span className="row gap-xs">
          <HelpCircle size={13} aria-hidden="true" />
          {tema.preguntasRespondidas} {tema.preguntasRespondidas === 1 ? "pregunta" : "preguntas"}
        </span>
      </div>

      <span className="btn btn-secondary btn-sm tema-card-accion">
        Continuar estudiando
        <ArrowRight size={15} className="icon-nudge" aria-hidden="true" />
      </span>
    </Link>
  );

  if (!alEliminar) return tarjeta;

  return (
    <div className="topic-card-wrap">
      {tarjeta}
      <button type="button" className="icon-btn topic-card-delete" aria-label={`Eliminar el tema ${tema.titulo}`} title="Eliminar tema" onClick={() => alEliminar(tema)}>
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
