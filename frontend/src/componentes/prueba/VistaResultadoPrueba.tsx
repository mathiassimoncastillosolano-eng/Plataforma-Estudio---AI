import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, Check, Lightbulb, Minus, X } from "lucide-react";
import type { ItemRevision, NivelPregunta, ResultadoCompleto } from "../../tipos/prueba";
import { DIFICULTADES, etiquetaDificultadElegida, etiquetaTiempo, formatearPuntos } from "../../utilidades/constructorPruebas";
import { construirRecomendaciones, titularResultado } from "../../utilidades/recomendaciones";
import { etiquetaDificultad, formatearSegundos } from "../../utilidades/formato";
import MedidorDominio from "../MedidorDominio";
import Boton from "../Boton";
import Insignia from "../Insignia";

interface Props {
  datos: ResultadoCompleto;
  idTema: string;
}

const nivelPlural: Record<NivelPregunta, string> = { facil: "Fáciles", media: "Medias", dificil: "Difíciles" };
const tono: Record<NivelPregunta, "green" | "amber" | "red"> = { facil: "green", media: "amber", dificil: "red" };
const LETRAS = ["A", "B", "C", "D", "E", "F"];
type Filtro = "fallos" | "correctas" | "todas";

/** Resultados calculados por el servidor. Aquí solo se presentan. */
export default function VistaResultadoPrueba({ datos, idTema }: Props) {
  const { resultado, revision } = datos;
  const navegar = useNavigate();
  const titular = titularResultado(resultado.porcentaje);
  const recomendaciones = construirRecomendaciones(resultado);
  const porRepasar = revision.filter((i) => i.estado !== "correcta").length;
  const [filtro, establecerFiltro] = useState<Filtro>(porRepasar > 0 ? "fallos" : "todas");

  const visibles = revision.filter((i) => (filtro === "todas" ? true : filtro === "fallos" ? i.estado !== "correcta" : i.estado === "correcta"));
  const totalBarra = resultado.totalPreguntas || 1;
  const c = resultado.configuracion;

  return (
    <div className="results stagger">
      <section className="result-hero">
        <MedidorDominio valor={resultado.porcentaje} etiqueta="Puntaje" tamano={176} strokeWidth={12} />
        <div className="result-hero-body">
          <p className="eyebrow">Prueba completada</p>
          <h2 className="result-headline">{titular.titulo}</h2>
          <p className="result-sub">
            {c.cantidadPreguntas} preguntas · Dificultad {etiquetaDificultadElegida(c.dificultad).toLowerCase()} · {etiquetaTiempo(c.limiteSegundos === null ? null : Math.round(c.limiteSegundos / 60))}
            {c.modoAsistido && " · Modo asistido"}
            {resultado.tiempoAgotado && " · Se agotó el tiempo"}
          </p>
          <dl className="result-figures">
            <div>
              <dt>Puntaje</dt>
              <dd>
                {formatearPuntos(resultado.puntaje)} <small>/ {formatearPuntos(resultado.puntajeMaximo)}</small>
              </dd>
            </div>
            <div>
              <dt>Correctas</dt>
              <dd>
                {resultado.correctas} <small>/ {resultado.totalPreguntas}</small>
              </dd>
            </div>
            <div>
              <dt>Tiempo utilizado</dt>
              <dd className="mono">{formatearSegundos(Math.round(resultado.duracionSegundos))}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="result-split">
        <div>
          <h3 className="result-h">Rendimiento por dificultad</h3>
          <ul className="perf-list">
            {DIFICULTADES.map((l) => {
              const p = resultado.porDificultad[l];
              return (
                <li key={l} className={p.total === 0 ? "empty" : ""}>
                  <div className="perf-top">
                    <span className="perf-name">
                      <span className={`dist-dot mix-${l}`} />
                      {nivelPlural[l]}
                    </span>
                    <strong>{p.total === 0 ? "—" : `${p.porcentaje}%`}</strong>
                  </div>
                  <div className="perf-track">
                    <i className={`mix-${l}`} style={{ width: `${p.porcentaje}%` }} />
                  </div>
                  <small>{p.total === 0 ? "No hubo preguntas de este nivel" : `${p.correctas} de ${p.total} correctas · ${formatearPuntos(p.obtenidos)} / ${formatearPuntos(p.max)} pts`}</small>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="result-h">Tus respuestas</h3>
          <div className="answers-bar" aria-hidden="true">
            <i className="ok" style={{ width: `${(resultado.correctas / totalBarra) * 100}%` }} />
            <i className="bad" style={{ width: `${(resultado.incorrectas / totalBarra) * 100}%` }} />
            <i className="skip" style={{ width: `${(resultado.omitidas / totalBarra) * 100}%` }} />
          </div>
          <ul className="answers-legend">
            <li><span className="lg ok" /><strong>{resultado.correctas}</strong> correctas</li>
            <li><span className="lg bad" /><strong>{resultado.incorrectas}</strong> incorrectas</li>
            <li><span className="lg skip" /><strong>{resultado.omitidas}</strong> omitidas</li>
          </ul>
        </div>
      </section>

      <section className="next-steps">
        <h3 className="result-h">
          <Lightbulb size={18} /> ¿Qué estudiar ahora?
        </h3>

        {resultado.conceptosDebiles.length > 0 && (
          <div className="weak-list" aria-label="Temas con mayor error">
            <p className="weak-label">Temas con mayor error</p>
            {resultado.conceptosDebiles.map((w) => (
              <div key={w.termino} className="weak-item">
                <AlertTriangle size={15} />
                <span>{w.termino}</span>
                <small>{w.falladas} de {w.total} falladas</small>
              </div>
            ))}
          </div>
        )}

        {recomendaciones.length > 0 ? (
          <ul className="reco-list">
            {recomendaciones.map((r, i) => (
              <li key={i} className={r.tono}>{r.texto}</li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Mantén el ritmo: practica un poco cada día para consolidar lo aprendido.</p>
        )}

        <div className="results-actions">
          <Boton onClick={() => navegar(`/estudio/${idTema}/resumen`)} icono={<BookOpen size={15} />}>
            Repasar el resumen
          </Boton>
          <Boton variante="ghost" onClick={() => navegar(`/estudio/${idTema}/prueba`)}>
            Nueva prueba <ArrowRight size={15} />
          </Boton>
        </div>
      </section>

      <section id="revision">
        <div className="review-head">
          <h3 className="result-h">Revisión de respuestas</h3>
          <div className="seg seg-sm" role="tablist" aria-label="Filtrar revisión">
            {(["fallos", "correctas", "todas"] as Filtro[]).map((f) => (
              <button key={f} role="tab" aria-selected={filtro === f} className={`seg-btn ${filtro === f ? "active" : ""}`} onClick={() => establecerFiltro(f)}>
                {f === "fallos" ? `Por repasar (${porRepasar})` : f === "correctas" ? `Correctas (${resultado.correctas})` : "Todas"}
              </button>
            ))}
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="text-muted" style={{ padding: "18px 0" }}>No hay preguntas en este filtro.</p>
        ) : (
          <ol className="review-items">
            {visibles.map((q) => (
              <ItemDeRevision key={q.id} item={q} />
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function ItemDeRevision({ item: q }: { item: ItemRevision }) {
  const ok = q.estado === "correcta";
  const omitida = q.estado === "omitida";
  return (
    <li className="review-item">
      <span className={`review-status ${ok ? "ok" : omitida ? "skip" : "bad"}`} aria-label={ok ? "Correcta" : omitida ? "Omitida" : "Incorrecta"}>
        {ok ? <Check size={14} strokeWidth={3} /> : omitida ? <Minus size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
      </span>
      <div className="review-body">
        <p className="review-prompt">{q.enunciado}</p>
        <div className="review-meta">
          <Insignia tono={tono[q.dificultad]}>{etiquetaDificultad(q.dificultad)}</Insignia>
          <span>{formatearPuntos(q.puntos)} {q.puntos === 1 ? "pt" : "pts"}</span>
        </div>
        <ul className="pr-revision-opciones">
          {q.opciones.map((o, i) => {
            const correcta = o.id === q.idCorrecta;
            const elegida = o.id === q.idSeleccionada;
            const descartada = q.idsDescartadas.includes(o.id);
            return (
              <li key={o.id} data-correcta={correcta || undefined} data-elegida={elegida || undefined} data-descartada={descartada || undefined}>
                <span className="pr-opcion-letra" aria-hidden="true">{LETRAS[i]}</span>
                <span>{o.texto}</span>
                {correcta && <small>Correcta</small>}
                {elegida && !correcta && <small>Tu respuesta</small>}
                {elegida && correcta && <small>Tu respuesta</small>}
                {descartada && <small>Descartada</small>}
              </li>
            );
          })}
        </ul>
        {omitida && <p className="text-muted">Sin responder.</p>}
        <p className="review-expl">{q.explicacion}</p>
        {q.fundamento && <p className="pr-fundamento">En el resumen: «{q.fundamento}»</p>}
      </div>
    </li>
  );
}
