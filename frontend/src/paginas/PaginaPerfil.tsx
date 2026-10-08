import { useEffect, useState } from "react";
import { Mail, Calendar, BookMarked, Clock, HelpCircle, Target, GraduationCap } from "lucide-react";
import { useAutenticacion } from "../hooks/useAutenticacion";
import * as progressService from "../servicios/servicioProgreso";
import * as studyService from "../servicios/servicioEstudio";
import type { EstadisticasPanel, TemaEstudio } from "../tipos";
import Avatar from "../componentes/Avatar";
import Tarjeta from "../componentes/Tarjeta";
import TarjetaEstadistica from "../componentes/TarjetaEstadistica";
import Insignia from "../componentes/Insignia";
import { EsqueletoTexto } from "../componentes/Esqueleto";

export default function PaginaPerfil() {
  const { usuario } = useAutenticacion();
  const [estadisticas, establecerEstadisticas] = useState<EstadisticasPanel | null>(null);
  const [temas, establecerTemas] = useState<TemaEstudio[] | null>(null);

  useEffect(() => {
    progressService.obtenerEstadisticasPanel().then(establecerEstadisticas);
    studyService.obtenerTemasEstudio().then(establecerTemas);
  }, []);

  if (!usuario) return null;

  const fechaIngreso = new Date(usuario.creadoEn).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categorias = Array.from(new Set((temas ?? []).map((t) => t.categoria)));

  return (
    <div className="page-narrow">
      <div className="profile-header reveal">
        <Avatar nombre={usuario.nombre} apellido={usuario.apellido} tamano={68} />
        <div>
          <div className="profile-name">
            <h1>
              {usuario.nombre} {usuario.apellido}
            </h1>
            <Insignia tono="blue">Estudiante</Insignia>
          </div>
          <p className="text-muted">{usuario.correo}</p>
        </div>
      </div>

      {estadisticas ? (
        <div className="stat-grid profile-stats">
          <TarjetaEstadistica icono={<BookMarked size={17} />} valor={String(estadisticas.temasEstudiados)} etiqueta="Temas estudiados" />
          <TarjetaEstadistica icono={<Clock size={17} />} valor={`${estadisticas.horasEstudio} h`} etiqueta="Horas de estudio" />
          <TarjetaEstadistica icono={<HelpCircle size={17} />} valor={String(estadisticas.preguntasRespondidas)} etiqueta="Preguntas respondidas" />
          <TarjetaEstadistica icono={<Target size={17} />} valor={`${estadisticas.dominioPromedio}%`} etiqueta="Dominio promedio" />
        </div>
      ) : (
        <div className="stat-grid profile-stats">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <EsqueletoTexto width={40} height={16} />
            </div>
          ))}
        </div>
      )}

      <div className="profile-grid">
        <Tarjeta>
          <h3 className="card-title">Información personal</h3>
          <div className="profile-stat-row">
            <span className="row gap-sm text-muted">
              <Mail size={15} /> Correo
            </span>
            <span className="text-strong">{usuario.correo}</span>
          </div>
          <div className="profile-stat-row">
            <span className="row gap-sm text-muted">
              <Calendar size={15} /> Miembro desde
            </span>
            <span className="text-strong">{fechaIngreso}</span>
          </div>
          <div className="profile-stat-row">
            <span className="row gap-sm text-muted">
              <GraduationCap size={15} /> Rol
            </span>
            <span className="text-strong">Estudiante</span>
          </div>
        </Tarjeta>

        <Tarjeta>
          <h3 className="card-title">Información académica</h3>
          <p className="card-hint">Áreas en las que estás estudiando actualmente.</p>
          {categorias.length > 0 ? (
            <div className="chip-list">
              {categorias.map((c) => (
                <Insignia key={c} tono="neutral">
                  {c}
                </Insignia>
              ))}
            </div>
          ) : (
            <EsqueletoTexto width="70%" />
          )}
          <div className="profile-stat-row profile-stat-row-spaced">
            <span className="text-muted">Temas activos</span>
            <span className="text-strong">{temas?.length ?? "—"}</span>
          </div>
        </Tarjeta>
      </div>
    </div>
  );
}
