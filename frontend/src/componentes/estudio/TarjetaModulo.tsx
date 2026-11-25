import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import type { ModuloEstudio } from "../../datos/modulosEstudio";

export interface EstadoModulo {
  /** Texto corto con el estado real del módulo (p. ej. «Listo», «3 completadas»). */
  texto: string;
  /** «listo» resalta el chip; «pendiente» lo deja neutro. */
  tipo: "listo" | "pendiente";
}

/** Acceso a un módulo desde la pantalla principal del tema. */
export default function TarjetaModulo({ modulo, idTema, numero, estado, bloqueado = false, mensajeBloqueo = "" }: { modulo: ModuloEstudio; idTema: string; numero: number; estado: EstadoModulo; bloqueado?: boolean; mensajeBloqueo?: string }) {
  const Icono = modulo.icono;
  if (bloqueado) {
    return (
      <div className="mod-card is-bloqueada" data-tono={modulo.tono} role="link" aria-disabled="true" aria-label={`${modulo.etiqueta}: bloqueado. ${mensajeBloqueo}`} title={mensajeBloqueo}>
        <Icono className="mod-card-glyph" size={150} strokeWidth={1.2} aria-hidden="true" />
        <span className="mod-card-top">
          <span className="mod-card-icon" aria-hidden="true">
            <Lock size={26} strokeWidth={1.9} />
          </span>
          <span className="mod-card-num mono" aria-hidden="true">
            {String(numero).padStart(2, "0")}
          </span>
        </span>
        <span className="mod-card-text">
          <strong>{modulo.etiqueta}</strong>
          <small>{mensajeBloqueo}</small>
        </span>
        <span className="mod-card-foot">
          <span className="mod-chip" data-tipo="pendiente">
            <i aria-hidden="true" />
            Bloqueado
          </span>
        </span>
      </div>
    );
  }
  return (
    <Link to={`/estudio/${idTema}/${modulo.ruta}`} className="mod-card" data-tono={modulo.tono} aria-label={`${modulo.etiqueta}: ${estado.texto}`}>
      {/* Glifo decorativo de fondo: da profundidad sin añadir contenido */}
      <Icono className="mod-card-glyph" size={150} strokeWidth={1.2} aria-hidden="true" />
      <span className="mod-card-top">
        <span className="mod-card-icon" aria-hidden="true">
          <Icono size={28} strokeWidth={1.9} />
        </span>
        <span className="mod-card-num mono" aria-hidden="true">
          {String(numero).padStart(2, "0")}
        </span>
      </span>
      <span className="mod-card-text">
        <strong>{modulo.etiqueta}</strong>
        <small>{modulo.proposito}</small>
      </span>
      <span className="mod-card-foot">
        <span className="mod-chip" data-tipo={estado.tipo}>
          <i aria-hidden="true" />
          {estado.texto}
        </span>
        <span className="mod-card-go" aria-hidden="true">
          Abrir
          <ArrowRight size={16} />
        </span>
      </span>
    </Link>
  );
}
