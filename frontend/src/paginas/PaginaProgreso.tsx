import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookMarked, ClipboardCheck, HelpCircle, Target } from "lucide-react";
import * as progressService from "../servicios/servicioProgreso";
import * as examService from "../servicios/servicioPruebas";
import * as studyService from "../servicios/servicioEstudio";
import type { InstantaneaProgreso, TemaEstudio } from "../tipos";
import type { PruebaPasada } from "../datos/pruebas";
import { obtenerNivelDominio, textosNivelDominio, etiquetasNivelDominio } from "../datos/temasEstudio";
import EncabezadoPagina from "../componentes/EncabezadoPagina";
import MedidorDominio from "../componentes/MedidorDominio";
import { EmptyState, ErrorState } from "../componentes/Estados";
import RutaNiveles, { siguienteHito } from "../componentes/progreso/RutaNiveles";
import PanelSesion from "../componentes/progreso/PanelSesion";
import ListaDominioTemas from "../componentes/progreso/ListaDominioTemas";
import GraficaEvolucion from "../componentes/progreso/GraficaEvolucion";

interface DatosProgreso {
  temas: TemaEstudio[];
  evolucion: InstantaneaProgreso[];
  semanal: { semana: string; respondida: number }[];
  pruebas: PruebaPasada[];
}

export default function PaginaProgreso() {
  const [datos, establecerDatos] = useState<DatosProgreso | null>(null);
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error">("cargando");

  async function cargar() {
    establecerEstado("cargando");
    try {
      const [temas, evolucion, semanal, pruebas] = await Promise.all([
        studyService.obtenerTemasEstudio(),
        progressService.obtenerEvolucionDominio(),
        progressService.obtenerPreguntasPorSemana(),
        examService.obtenerPruebasPasadas(),
      ]);
      establecerDatos({ temas, evolucion, semanal, pruebas });
      establecerEstado("exito");
    } catch {
      establecerEstado("error");
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const encabezado = (
    <EncabezadoPagina sobretitulo="Tu progreso" titulo="Así vas avanzando" descripcion="Tu dominio, tus temas y lo que has trabajado hoy, en un solo lugar." />
  );

  if (estado === "error") return <ErrorState titulo="No pudimos cargar tu progreso." alReintentar={cargar} />;
  if (estado === "cargando" || !datos) {
    return (
      <div aria-busy="true" aria-label="Cargando tu progreso">
        {encabezado}
        <div className="skeleton progress-hero-skeleton" />
        <div className="progress-layout">
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />
          <div className="skeleton" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />
        </div>
      </div>
    );
  }

  const { temas, evolucion, semanal, pruebas } = datos;

  if (temas.length === 0) {
    return (
      <div>
        {encabezado}
        <EmptyState
          titulo="Tu progreso empieza con tu primer tema"
          descripcion="Crea un tema y genera su resumen: a partir de ahí verás aquí cómo avanzas."
          accion={
            <Link to="/estudio/nuevo" className="btn btn-primary">
              Crear mi primer tema
            </Link>
          }
        />
        <div className="progress-session-solo">
          <PanelSesion />
        </div>
      </div>
    );
  }

  const promedio = Math.round(temas.reduce((suma, t) => suma + t.dominio, 0) / temas.length);
  const nivel = obtenerNivelDominio(promedio);
  const hito = siguienteHito(promedio);
  const preguntas = temas.reduce((suma, t) => suma + t.preguntasRespondidas, 0);
  const pruebasHechas = temas.reduce((suma, t) => suma + t.pruebasCompletadas, 0);
  const focus = [...temas].sort((a, b) => a.dominio - b.dominio)[0];

  return (
    <div>
      {encabezado}

      <section className="progress-hero reveal" style={{ ["--i" as string]: 1 }} aria-label="Tu nivel de dominio">
        <MedidorDominio valor={promedio} etiqueta="Dominio promedio" tamano={164} strokeWidth={12} />
        <div className="progress-hero-body">
          <span className="eyebrow">Nivel actual</span>
          <h2>{etiquetasNivelDominio[nivel]}</h2>
          <p className="progress-hero-copy">{textosNivelDominio[nivel]}</p>
          <RutaNiveles valor={promedio} />
          <p className="progress-hero-next">
            {hito ? (
              <>
                {hito.faltante === 1 ? "Te falta" : "Te faltan"}{" "}
                <strong>
                  {hito.faltante} {hito.faltante === 1 ? "punto" : "puntos"}
                </strong>{" "}
                de dominio promedio para alcanzar <strong>{hito.etiqueta}</strong>.
              </>
            ) : (
              <>Has alcanzado el nivel más alto. ¡Mantén el ritmo!</>
            )}
          </p>
        </div>
        <dl className="progress-figures">
          <div>
            <dt>
              <BookMarked size={16} aria-hidden="true" /> Temas
            </dt>
            <dd>{temas.length}</dd>
          </div>
          <div>
            <dt>
              <HelpCircle size={16} aria-hidden="true" /> Preguntas
            </dt>
            <dd>{preguntas}</dd>
          </div>
          <div>
            <dt>
              <ClipboardCheck size={16} aria-hidden="true" /> Pruebas
            </dt>
            <dd>{pruebasHechas}</dd>
          </div>
        </dl>
      </section>

      <div className="progress-layout">
        <div className="progress-main">
          {focus && focus.dominio < 76 && (
            <section className="reveal" style={{ ["--i" as string]: 2 }}>
              <div className="section-heading">
                <h2>Tu siguiente paso</h2>
              </div>
              <Link to={`/estudio/${focus.id}/resumen`} className="recommend-card">
                <div className="recommend-card-icon">
                  <Target size={19} aria-hidden="true" />
                </div>
                <div className="recommend-card-text">
                  <p className="recommend-card-title">Repasa «{focus.titulo}»</p>
                  <p className="recommend-card-sub">Es tu tema con menor dominio ({focus.dominio}%). Empieza por su resumen esencial.</p>
                </div>
                <ArrowRight size={17} className="icon-nudge text-muted" aria-hidden="true" />
              </Link>
            </section>
          )}

          <section className="reveal" style={{ ["--i" as string]: 3 }}>
            <div className="section-heading">
              <h2>Dominio por tema</h2>
              <span className="section-heading-note">
                {temas.length} {temas.length === 1 ? "tema" : "temas"}
              </span>
            </div>
            <ListaDominioTemas temas={temas} />
          </section>

          <section className="reveal" style={{ ["--i" as string]: 4 }}>
            <div className="section-heading">
              <h2>Evolución</h2>
            </div>
            <GraficaEvolucion evolucion={evolucion} semanal={semanal} />
          </section>
        </div>

        <aside className="progress-aside">
          <div className="reveal" style={{ ["--i" as string]: 2 }}>
            <PanelSesion />
          </div>

          <section className="reveal" style={{ ["--i" as string]: 3 }}>
            <div className="section-heading">
              <h2>Pruebas recientes</h2>
            </div>
            {pruebas.length === 0 ? (
              <p className="text-muted">Cuando completes una prueba, verás aquí tu resultado.</p>
            ) : (
              <ul className="exam-history">
                {pruebas.map((prueba) => (
                  <li key={prueba.id}>
                    <div>
                      <p className="exam-history-title">{prueba.tituloTema}</p>
                      <p className="exam-history-date">
                        {prueba.fecha} · {prueba.cantidadCorrectas}/{prueba.totalPreguntas} correctas
                      </p>
                    </div>
                    <span className={`score-chip ${prueba.porcentajePuntaje >= 70 ? "is-good" : "is-mid"}`}>{prueba.porcentajePuntaje}%</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
