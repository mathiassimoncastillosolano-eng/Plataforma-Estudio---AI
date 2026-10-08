import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowRight, BookOpen, Check, Lightbulb, Minus, RotateCcw, X } from "lucide-react";
import type { ResultadoPrueba, IntentoPregunta, DificultadPregunta, PreguntaEstudio } from "../../tipos";
import { DIFICULTADES, PESO_PREGUNTA, formatearPuntos, etiquetaTiempo } from "../../utilidades/constructorPruebas";
import { construirRecomendaciones, titularResultado } from "../../utilidades/recomendaciones";
import { etiquetaDificultad, formatearSegundos } from "../../utilidades/formato";
import { estaOmitida } from "../../servicios/servicioPruebas";
import MedidorDominio from "../MedidorDominio";
import Boton from "../Boton";
import Insignia from "../Insignia";

interface Props {
  resultado: ResultadoPrueba;
  preguntas: PreguntaEstudio[];
  intentos: IntentoPregunta[];
  idTema: string;
}

const nivelPlural: Record<DificultadPregunta, string> = { facil: "Fáciles", media: "Medias", dificil: "Difíciles" };
const tono: Record<DificultadPregunta, "green" | "amber" | "red"> = { facil: "green", media: "amber", dificil: "red" };
type Filtro = "fallos" | "correctas" | "todas";

/** Pantalla de resultados: responde "¿qué necesito estudiar ahora?" */
export default function VistaResultadoPrueba({ resultado, preguntas, intentos, idTema }: Props) {
  const navegar = useNavigate();
  const titular = titularResultado(resultado.porcentajePuntaje);
  const recomendaciones = construirRecomendaciones(resultado);
  const porId = new Map(intentos.map((a) => [a.idPregunta, a]));
  const [filtro, establecerFiltro] = useState<Filtro>(resultado.idsPreguntasRepaso.length > 0 ? "fallos" : "todas");

  const visibles = preguntas.filter((q) => {
    const ok = !!porId.get(q.id)?.esCorrecta;
    return filtro === "todas" ? true : filtro === "fallos" ? !ok : ok;
  });

  const totalBarra = resultado.totalPreguntas || 1;
  const irAPreguntas = (f?: string) => navegar(`/estudio/${idTema}/questions${f ? `?f=${f}` : ""}`);

  return (
    <div className="results stagger">
      {/* ------------------------------------------------ Resultado principal */}
      <section className="result-hero">
        <MedidorDominio valor={resultado.porcentajePuntaje} etiqueta="Puntaje" tamano={176} strokeWidth={12} />
        <div className="result-hero-body">
          <p className="eyebrow">Prueba completada</p>
          <h2 className="result-headline">{titular.titulo}</h2>
          <p className="result-sub">
            {resultado.configuracion.cantidadPreguntas} preguntas · Dificultad {etiquetaDificultad(resultado.configuracion.dificultad).toLowerCase()} · {etiquetaTiempo(resultado.configuracion.limiteTiempoMinutos)}
            {resultado.tiempoAgotado && " · Se agotó el tiempo"}
          </p>
          <dl className="result-figures">
            <div>
              <dt>Puntaje</dt>
              <dd>
                {formatearPuntos(Math.round(resultado.puntaje * 10) / 10)} <small>/ {formatearPuntos(resultado.puntajeMaximo)}</small>
              </dd>
            </div>
            <div>
              <dt>Correctas</dt>
              <dd>
                {resultado.cantidadCorrectas} <small>/ {resultado.totalPreguntas}</small>
              </dd>
            </div>
            <div>
              <dt>Tiempo utilizado</dt>
              <dd className="mono">{formatearSegundos(resultado.duracionSegundos)}</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ------------------------------------------------ Rendimiento + respuestas */}
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
                  <small>{p.total === 0 ? "No hubo preguntas de este nivel" : `${p.correcta} de ${p.total} correctas · ${formatearPuntos(p.obtenidos)} / ${formatearPuntos(p.max)} pts`}</small>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <h3 className="result-h">Tus respuestas</h3>
          <div className="answers-bar" aria-hidden="true">
            <i className="ok" style={{ width: `${(resultado.cantidadCorrectas / totalBarra) * 100}%` }} />
            <i className="bad" style={{ width: `${(resultado.cantidadIncorrectas / totalBarra) * 100}%` }} />
            <i className="skip" style={{ width: `${(resultado.cantidadOmitidas / totalBarra) * 100}%` }} />
          </div>
          <ul className="answers-legend">
            <li>
              <span className="lg ok" />
              <strong>{resultado.cantidadCorrectas}</strong> correctas
            </li>
            <li>
              <span className="lg bad" />
              <strong>{resultado.cantidadIncorrectas}</strong> incorrectas
            </li>
            <li>
              <span className="lg skip" />
              <strong>{resultado.cantidadOmitidas}</strong> omitidas
            </li>
          </ul>
        </div>
      </section>

      {/* ------------------------------------------------ Qué estudiar ahora */}
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
                <small>
                  {w.falladas} de {w.total} falladas
                </small>
              </div>
            ))}
          </div>
        )}

        {recomendaciones.length > 0 ? (
          <ul className="reco-list">
            {recomendaciones.map((r, i) => (
              <li key={i} className={r.tono}>
                {r.texto}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">Mantén el ritmo: practica un poco cada día para consolidar lo aprendido.</p>
        )}

        <div className="results-actions">
          {resultado.idsPreguntasRepaso.length > 0 && (
            <Boton onClick={() => irAPreguntas("repasar")} icono={<RotateCcw size={15} />}>
              Practicar las {resultado.idsPreguntasRepaso.length} por repasar
            </Boton>
          )}
          <Boton variante="secondary" onClick={() => navegar(`/estudio/${idTema}/resumen`)} icono={<BookOpen size={15} />}>
            Repasar el resumen
          </Boton>
          <Boton variante="ghost" onClick={() => navegar(`/estudio/${idTema}/prueba`)}>
            Nueva prueba
            <ArrowRight size={15} />
          </Boton>
        </div>
      </section>

      {/* ------------------------------------------------ Revisión */}
      <section id="revision">
        <div className="review-head">
          <h3 className="result-h">Revisión de respuestas</h3>
          <div className="seg seg-sm" role="tablist" aria-label="Filtrar revisión">
            {(["fallos", "correctas", "todas"] as Filtro[]).map((f) => (
              <button key={f} role="tab" aria-selected={filtro === f} className={`seg-btn ${filtro === f ? "active" : ""}`} onClick={() => establecerFiltro(f)}>
                {f === "fallos" ? `Por repasar (${resultado.idsPreguntasRepaso.length})` : f === "correctas" ? `Correctas (${resultado.cantidadCorrectas})` : "Todas"}
              </button>
            ))}
          </div>
        </div>

        {visibles.length === 0 ? (
          <p className="text-muted" style={{ padding: "18px 0" }}>
            No hay preguntas en este filtro.
          </p>
        ) : (
          <ol className="review-items">
            {visibles.map((q) => {
              const intento = porId.get(q.id);
              const omitidas = estaOmitida(q, intento);
              const ok = !!intento?.esCorrecta;
              const dadas = q.tipo === "abierta" ? intento?.textoRespuestaAbierta : q.opciones?.find((o) => o.id === intento?.idOpcionSeleccionada)?.etiqueta;
              const right = q.tipo === "abierta" ? q.textoRespuestaCorrecta : q.opciones?.find((o) => o.id === q.idOpcionCorrecta)?.etiqueta;
              return (
                <li key={q.id} className="review-item">
                  <span className={`review-status ${ok ? "ok" : omitidas ? "skip" : "bad"}`} aria-label={ok ? "Correcta" : omitidas ? "Omitida" : "Incorrecta"}>
                    {ok ? <Check size={14} strokeWidth={3} /> : omitidas ? <Minus size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />}
                  </span>
                  <div className="review-body">
                    <p className="review-prompt">{q.enunciado}</p>
                    <div className="review-meta">
                      <Insignia tono={tono[q.dificultad]}>{etiquetaDificultad(q.dificultad)}</Insignia>
                      <span>{formatearPuntos(PESO_PREGUNTA[q.dificultad])} pts</span>
                    </div>
                    <p>
                      <strong>Tu respuesta: </strong>
                      <span className={ok ? "t-ok" : omitidas ? "text-muted" : "t-bad"}>{dadas || "Sin responder"}</span>
                    </p>
                    {!ok && (
                      <p>
                        <strong>Respuesta correcta: </strong>
                        <span className="t-ok">{right}</span>
                      </p>
                    )}
                    <p className="review-expl">{q.explicacion}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}
