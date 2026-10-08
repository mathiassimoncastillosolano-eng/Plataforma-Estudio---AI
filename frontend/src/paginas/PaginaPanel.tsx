import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, BookMarked, Clock, HelpCircle, Target, BookOpen, ClipboardCheck, Share2, ArrowRight, Play } from "lucide-react";
import { useAutenticacion } from "../hooks/useAutenticacion";
import * as studyService from "../servicios/servicioEstudio";
import * as progressService from "../servicios/servicioProgreso";
import type { EstadisticasPanel, TemaEstudio } from "../tipos";
import { actividadReciente } from "../datos/actividades";
import { useSesion } from "../almacen/almacenSesion";
import { formatearTiempoRelativo } from "../utilidades/formato";
import ListaActividad from "../componentes/ListaActividad";
import { dominioPorCategoria } from "../datos/progreso";
import TarjetaTemaEstudio from "../componentes/TarjetaTemaEstudio";
import MedidorDominio from "../componentes/MedidorDominio";
import BarraProgreso from "../componentes/BarraProgreso";
import Tarjeta from "../componentes/Tarjeta";
import { ErrorState, EmptyState } from "../componentes/Estados";
import { EsqueletoCuadricula, EsqueletoTexto } from "../componentes/Esqueleto";

export default function PaginaPanel() {
  const { usuario } = useAutenticacion();
  const [temas, establecerTemas] = useState<TemaEstudio[] | null>(null);
  const [estadisticas, establecerEstadisticas] = useState<EstadisticasPanel | null>(null);
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const actividadSesion = useSesion((s) => s.actividad);

  async function cargar() {
    establecerEstado("cargando");
    try {
      const [resultadoTemas, resultadoEstadisticas] = await Promise.all([
        studyService.obtenerTemasEstudio(),
        progressService.obtenerEstadisticasPanel(),
      ]);
      establecerTemas(resultadoTemas);
      establecerEstadisticas(resultadoEstadisticas);
      establecerEstado("exito");
    } catch {
      establecerEstado("error");
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const saludo = (() => {
    const hora = new Date().getHours();
    if (hora < 12) return "Buenos días";
    if (hora < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  if (estado === "cargando") {
    return (
      <div aria-busy="true" aria-label="Cargando tu espacio de estudio">
        <div className="dash-greeting">
          <EsqueletoTexto width={240} height={28} />
          <div style={{ marginTop: 12 }}>
            <EsqueletoTexto width={300} height={14} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 224, borderRadius: "var(--radius-xl)" }} />
        <div className="skeleton" style={{ height: 82, marginTop: 28, borderRadius: "var(--radius-lg)" }} />
        <div className="dashboard-grid">
          <div className="dash-main">
            <EsqueletoCuadricula cantidad={2} />
          </div>
          <div className="dash-aside">
            <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />
          </div>
        </div>
      </div>
    );
  }
  if (estado === "error") return <ErrorState alReintentar={cargar} />;

  const enProgreso = (temas ?? []).filter((t) => t.dominio > 0 && t.dominio < 95).slice(0, 4);
  const temasMasDebiles = [...(temas ?? [])].sort((a, b) => a.dominio - b.dominio).slice(0, 2);

  // AHORA: el tema que el estudiante debería retomar
  const temaEnfocado = enProgreso[0];
  // CONTINUAR: el resto de temas en progreso
  const otrosTemas = enProgreso.slice(1);

  return (
    <div>
      <div className="dash-greeting reveal">
        <h1>
          {saludo}, {usuario?.nombre}
        </h1>
        <p>
          {temaEnfocado
            ? "Esto es lo mejor que puedes hacer ahora para seguir avanzando."
            : "Continúa aprendiendo y alcanza tus objetivos."}
        </p>
      </div>

      {/* ───────── AHORA ───────── */}
      {temaEnfocado ? (
        <section className="continue-hero reveal" style={{ ["--i" as string]: 1 }} aria-labelledby="hero-title">
          <div className="continue-hero-body">
            <span className="eyebrow">Continúa donde lo dejaste</span>
            <h2 id="hero-title">{temaEnfocado.titulo}</h2>
            {temaEnfocado.descripcion && <p className="continue-hero-desc">{temaEnfocado.descripcion}</p>}
            <div className="continue-hero-meta">
              <span className="hero-chip">{temaEnfocado.categoria}</span>
              <span className="row" style={{ gap: 6 }}>
                <Clock size={14} aria-hidden="true" />
                {temaEnfocado.ultimoEstudioEn}
              </span>
              <span className="row" style={{ gap: 6 }}>
                <HelpCircle size={14} aria-hidden="true" />
                {temaEnfocado.preguntasRespondidas} preguntas
              </span>
            </div>
            <div className="continue-hero-progress">
              <div className="continue-hero-progress-row">
                <span>Dominio</span>
                <span>{temaEnfocado.dominio}%</span>
              </div>
              <BarraProgreso valor={temaEnfocado.dominio} />
            </div>
            <div className="continue-hero-actions">
              <Link to={`/estudio/${temaEnfocado.id}`} className="btn btn-hero btn-lg">
                <Play size={16} fill="currentColor" aria-hidden="true" />
                Continuar estudiando
              </Link>
              <Link to="/estudio/nuevo" className="btn btn-hero-ghost btn-lg">
                <Plus size={17} aria-hidden="true" />
                Nuevo tema
              </Link>
            </div>
          </div>
          <div className="continue-hero-gauge">
            <MedidorDominio valor={temaEnfocado.dominio} etiqueta="Dominio" tamano={148} strokeWidth={11} />
          </div>
        </section>
      ) : (
        <section className="continue-hero reveal" style={{ ["--i" as string]: 1 }} aria-labelledby="hero-title">
          <div className="continue-hero-body">
            <span className="eyebrow">Empieza hoy</span>
            <h2 id="hero-title">¿Qué quieres aprender hoy?</h2>
            <p className="continue-hero-desc">
              Sube un PDF o pega tu contenido y deja que la IA prepare resúmenes, preguntas y un examen para ti.
            </p>
            <div className="continue-hero-actions">
              <Link to="/estudio/nuevo" className="btn btn-hero btn-lg">
                <Plus size={17} aria-hidden="true" />
                Nuevo tema de estudio
              </Link>
            </div>
          </div>
          <div className="hero-chips" aria-hidden="true">
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <BookOpen size={17} />
              </span>
              Resumen
            </span>
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <HelpCircle size={17} />
              </span>
              Preguntas
            </span>
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <ClipboardCheck size={17} />
              </span>
              Examen
            </span>
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <Share2 size={17} />
              </span>
              Mapa conceptual
            </span>
          </div>
        </section>
      )}

      {/* ───────── PROGRESO ───────── */}
      {estadisticas && (
        <section className="reveal" style={{ ["--i" as string]: 2 }} aria-label="Tu progreso en cifras">
          <div className="stat-strip">
            <div className="stat-item">
              <span className="stat-item-icon">
                <BookMarked size={19} aria-hidden="true" />
              </span>
              <div>
                <div className="stat-item-value">{estadisticas.temasEstudiados}</div>
                <div className="stat-item-label">Temas estudiados</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-item-icon">
                <Clock size={19} aria-hidden="true" />
              </span>
              <div>
                <div className="stat-item-value">{estadisticas.horasEstudio} h</div>
                <div className="stat-item-label">Horas de estudio</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-item-icon">
                <HelpCircle size={19} aria-hidden="true" />
              </span>
              <div>
                <div className="stat-item-value">{estadisticas.preguntasRespondidas}</div>
                <div className="stat-item-label">Preguntas respondidas</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        <div className="dash-main">
          {/* ───────── CONTINUAR ───────── */}
          <section className="reveal" style={{ ["--i" as string]: 3 }}>
            <div className="section-heading">
              <h2>{temaEnfocado ? "Sigue con tus otros temas" : "Continúa estudiando"}</h2>
              <Link to="/temas" className="link-arrow">
                Ver todos
                <ArrowRight size={14} className="icon-nudge" aria-hidden="true" />
              </Link>
            </div>

            {otrosTemas.length > 0 ? (
              <div className="topic-grid stagger">
                {otrosTemas.map((tema) => (
                  <TarjetaTemaEstudio key={tema.id} tema={tema} />
                ))}
              </div>
            ) : temaEnfocado ? (
              <p className="text-muted">Por ahora tu foco está en un solo tema. Crea otro cuando quieras sumar uno más.</p>
            ) : (
              <EmptyState
                titulo="Todavía no tienes temas de estudio."
                descripcion="Crea tu primer tema para que la IA comience a generar recursos de estudio."
                accion={
                  <Link to="/estudio/nuevo" className="btn btn-primary">
                    Crear primer tema
                  </Link>
                }
              />
            )}
          </section>

          {/* ───────── DESCUBRIR ───────── */}
          {temasMasDebiles.length > 0 && (
            <section className="reveal" style={{ ["--i" as string]: 4 }}>
              <div className="section-heading">
                <h2>Recomendado para ti</h2>
              </div>
              <div className="stack gap-sm stagger">
                {temasMasDebiles.map((t) => (
                  <Link key={t.id} to={`/estudio/${t.id}/preguntas`} className="recommend-card">
                    <div className="recommend-card-icon">
                      <Target size={19} aria-hidden="true" />
                    </div>
                    <div className="recommend-card-text">
                      <p className="recommend-card-title">{t.titulo}</p>
                      <p className="recommend-card-sub">
                        Dominio actual {t.dominio}% · practica unas preguntas para reforzarlo
                      </p>
                    </div>
                    <ArrowRight size={17} className="icon-nudge text-muted" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="dash-aside" aria-label="Resumen de tu avance">
          <Tarjeta className="summary-panel reveal" style={{ ["--i" as string]: 3 }}>
            <span className="eyebrow" style={{ marginBottom: 14 }}>
              Tu progreso general
            </span>
            <MedidorDominio valor={estadisticas?.dominioPromedio ?? 0} etiqueta="Dominio promedio" tamano={148} strokeWidth={11} />
            <div className="summary-panel-breakdown">
              {dominioPorCategoria.map((c) => (
                <div key={c.categoria}>
                  <div className="summary-panel-row">
                    <span className="text-soft">{c.categoria}</span>
                    <strong style={{ color: "var(--color-text)" }}>{c.dominio}%</strong>
                  </div>
                  <div className="summary-panel-bar">
                    <BarraProgreso valor={c.dominio} />
                  </div>
                </div>
              ))}
            </div>
          </Tarjeta>

          <section className="reveal" style={{ ["--i" as string]: 4 }}>
            <div className="section-heading">
              <h2>Actividad reciente</h2>
            </div>
            {/* Primero lo hecho en esta sesión (real, en memoria); después el historial de ejemplo. */}
            <ListaActividad
              elementos={[...actividadSesion.map((a) => ({ ...a, tiempo: formatearTiempoRelativo(a.at) })), ...actividadReciente].slice(0, 5)}
            />
          </section>
        </aside>
      </div>
    </div>
  );
}
