import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AlertTriangle, ArrowRight, Clock, Eye, Info, Infinity as IconoInfinito, Minus, PauseCircle, Plus, Sparkles } from "lucide-react";
import type { ResumenGeneral } from "../../tipos";
import type { AjustesPrueba, DificultadElegida, DistribucionNiveles, NivelPregunta } from "../../tipos/prueba";
import {
  CANTIDADES_PREGUNTAS,
  DIFICULTADES,
  PASO_TIEMPO,
  PESO_PREGUNTA,
  TIEMPO_MAX,
  TIEMPO_MIN,
  calcularDistribucion,
  caracteresEvaluables,
  distribucionEfectiva,
  etiquetaDificultadElegida,
  etiquetaTiempo,
  formatearPuntos,
  limitePorContenido,
  puntajeMaximoPara,
  segundosPorPregunta,
  validarPersonalizada,
} from "../../utilidades/constructorPruebas";
import Boton from "../Boton";
import AyudaInfo from "./AyudaInfo";

interface Props {
  resumen: ResumenGeneral;
  ajustes: AjustesPrueba;
  alCambiar: (ajustes: AjustesPrueba) => void;
  alIniciar: () => void;
  error: string | null;
}

const NIVELES: Record<NivelPregunta, string> = { facil: "Fácil", media: "Media", dificil: "Difícil" };
const PLURAL: Record<NivelPregunta, string> = { facil: "fáciles", media: "medias", dificil: "difíciles" };
const DESCRIPCION: Record<DificultadElegida, string> = {
  facil: "Sobre todo preguntas directas, para afianzar lo básico.",
  media: "Una mezcla equilibrada, centrada en comprender.",
  dificil: "Mayoría de preguntas de análisis y aplicación.",
  personalizada: "Tú decides cuántas preguntas de cada nivel.",
};

export default function ConfiguradorPrueba({ resumen, ajustes, alCambiar, alIniciar, error }: Props) {
  const [aviso, establecerAviso] = useState<string | null>(null);
  const capacidad = useMemo(() => limitePorContenido(caracteresEvaluables(resumen)), [resumen]);
  const minimo = CANTIDADES_PREGUNTAS[0];
  const sinContenido = capacidad < minimo;

  const distribucion = distribucionEfectiva(ajustes);
  const validacion = ajustes.dificultad === "personalizada" ? validarPersonalizada(ajustes.cantidad, ajustes.personalizada) : null;
  const personalizadaOk = validacion ? validacion.valida : true;
  const cantidadOk = ajustes.cantidad <= capacidad;
  const puedeIniciar = !sinContenido && cantidadOk && personalizadaOk;
  const segs = segundosPorPregunta(ajustes.cantidad, ajustes.limiteMinutos);
  const sinLimite = ajustes.limiteMinutos === null;
  const [ultimoTiempo, establecerUltimoTiempo] = useState(ajustes.limiteMinutos ?? 15);
  const minutos = ajustes.limiteMinutos ?? ultimoTiempo;

  useEffect(() => {
    if (ajustes.limiteMinutos !== null) establecerUltimoTiempo(ajustes.limiteMinutos);
  }, [ajustes.limiteMinutos]);

  function cambiarTiempo(valor: number) {
    const ajustado = Math.round(Math.min(TIEMPO_MAX, Math.max(TIEMPO_MIN, valor)) / PASO_TIEMPO) * PASO_TIEMPO;
    alCambiar({ ...ajustes, limiteMinutos: ajustado });
  }

  // Si lo guardado (o el valor por defecto) pide más preguntas de las que sostiene este resumen, se baja a la mayor opción posible.
  useEffect(() => {
    if (capacidad < minimo || ajustes.cantidad <= capacidad) return;
    const posible = [...CANTIDADES_PREGUNTAS].filter((n) => n <= capacidad).pop() ?? minimo;
    establecerAviso(`El resumen de este tema permite hasta ${capacidad} preguntas, así que ajustamos la cantidad a ${posible}.`);
    alCambiar({ ...ajustes, cantidad: posible, personalizada: calcularDistribucion(posible, "media") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capacidad, ajustes.cantidad]);

  function cambiarCantidad(cantidad: number) {
    const compatible = validarPersonalizada(cantidad, ajustes.personalizada).valida;
    // La distribución personalizada nunca se conserva en silencio si deja de sumar el total.
    if (ajustes.dificultad === "personalizada" && !compatible) {
      establecerAviso(`Cambiaste a ${cantidad} preguntas, así que reiniciamos el reparto personalizado. Ajusta los tres niveles para que sumen ${cantidad}.`);
      alCambiar({ ...ajustes, cantidad, personalizada: calcularDistribucion(cantidad, "media") });
    } else {
      establecerAviso(null);
      alCambiar({ ...ajustes, cantidad, personalizada: compatible ? ajustes.personalizada : calcularDistribucion(cantidad, "media") });
    }
  }

  function cambiarNivel(nivel: NivelPregunta, texto: string) {
    const valor = texto === "" ? 0 : Number(texto);
    alCambiar({ ...ajustes, personalizada: { ...ajustes.personalizada, [nivel]: Number.isFinite(valor) ? Math.trunc(valor) : 0 } });
  }

  function elegirDificultad(dificultad: DificultadElegida) {
    establecerAviso(null);
    alCambiar({ ...ajustes, dificultad, personalizada: dificultad === "personalizada" && !validarPersonalizada(ajustes.cantidad, ajustes.personalizada).valida ? calcularDistribucion(ajustes.cantidad, "media") : ajustes.personalizada });
  }

  return (
    <div className="pr-config">
      {error && (
        <div className="pr-banner pr-banner-error" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {sinContenido && (
        <div className="pr-banner pr-banner-warn" role="alert">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>El resumen general de este tema es demasiado corto para generar una prueba de {minimo} preguntas. Amplía el material y vuelve a generar el resumen.</span>
        </div>
      )}

      <div className="pr-config-rejilla">
        <div className="pr-config-columna">
          <div className="pr-fila-ajustes">
            {/* ---------------------------------------------------------------- Cantidad */}
            <section className="pr-bloque pr-bloque-cantidad" aria-labelledby="pr-h-cantidad" data-tour="prueba-cantidad">
              <h3 id="pr-h-cantidad">Número de preguntas</h3>
              <div className="pr-segmentos" role="radiogroup" aria-labelledby="pr-h-cantidad">
                {CANTIDADES_PREGUNTAS.map((n) => {
                  const bloqueada = n > capacidad;
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={ajustes.cantidad === n}
                      disabled={bloqueada}
                      title={bloqueada ? "El resumen no tiene contenido suficiente para tantas preguntas" : undefined}
                      className="pr-segmento"
                      onClick={() => cambiarCantidad(n)}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              {!sinContenido && <p className="pr-nota">El resumen de este tema permite hasta {capacidad} preguntas sin repetir contenido.</p>}
            </section>
            <section className="pr-bloque pr-bloque-tiempo" aria-labelledby="pr-h-tiempo" data-tour="prueba-tiempo">
              <h3 id="pr-h-tiempo">
                <Clock size={16} aria-hidden="true" /> Tiempo
              </h3>
              <div className="pr-tiempo" data-sin-limite={sinLimite || undefined}>
                <div className="pr-tiempo-paso" role="group" aria-label="Duración de la prueba">
                  <button type="button" className="pr-tiempo-btn" aria-label={`Restar ${PASO_TIEMPO} minutos`} disabled={sinLimite || minutos <= TIEMPO_MIN} onClick={() => cambiarTiempo(minutos - PASO_TIEMPO)}>
                    <Minus size={16} aria-hidden="true" />
                  </button>
                  <output className="pr-tiempo-valor" aria-live="polite">
                    {sinLimite ? <IconoInfinito size={24} strokeWidth={2} aria-hidden="true" /> : <strong>{minutos}</strong>}
                    <span>{sinLimite ? "Sin límite" : "minutos"}</span>
                  </output>
                  <button type="button" className="pr-tiempo-btn" aria-label={`Sumar ${PASO_TIEMPO} minutos`} disabled={sinLimite || minutos >= TIEMPO_MAX} onClick={() => cambiarTiempo(minutos + PASO_TIEMPO)}>
                    <Plus size={16} aria-hidden="true" />
                  </button>
                </div>
                <input
                  type="range"
                  className="pr-tiempo-rango"
                  min={TIEMPO_MIN}
                  max={TIEMPO_MAX}
                  step={PASO_TIEMPO}
                  value={minutos}
                  disabled={sinLimite}
                  aria-label="Duración en minutos"
                  style={{ "--p": `${((minutos - TIEMPO_MIN) / (TIEMPO_MAX - TIEMPO_MIN)) * 100}%` } as CSSProperties}
                  onChange={(e) => cambiarTiempo(Number(e.target.value))}
                />
              </div>
              <label className="pr-interruptor pr-tiempo-libre">
                <input type="checkbox" role="switch" checked={sinLimite} onChange={(e) => alCambiar({ ...ajustes, limiteMinutos: e.target.checked ? null : ultimoTiempo })} />
                <span className="pr-pista" aria-hidden="true" />
                <span className="pr-interruptor-texto">
                  <strong>
                    <IconoInfinito size={14} aria-hidden="true" /> Sin límite de tiempo
                  </strong>
                  <small>Responde a tu ritmo, sin reloj.</small>
                </span>
              </label>
              <p className={`pr-nota ${segs !== null && segs < 40 ? "pr-nota-aviso" : ""}`}>
                {segs === null ? "Sin reloj: tómate el tiempo que necesites." : segs < 40 ? `Unos ${segs} s por pregunta: es un ritmo muy exigente.` : `Unos ${segs} s por pregunta.`}
              </p>
            </section>
          </div>

          {/* ---------------------------------------------------------------- Dificultad */}
          <section className="pr-bloque" aria-labelledby="pr-h-dificultad" data-tour="prueba-dificultad">
            <h3 id="pr-h-dificultad">Dificultad</h3>
            <div className="pr-dificultades" role="radiogroup" aria-labelledby="pr-h-dificultad">
              {(["facil", "media", "dificil", "personalizada"] as DificultadElegida[]).map((d) => {
                const reparto = d === "personalizada" ? null : calcularDistribucion(ajustes.cantidad, d);
                return (
                  <button key={d} type="button" role="radio" aria-checked={ajustes.dificultad === d} className="pr-dificultad" onClick={() => elegirDificultad(d)}>
                    <span className="pr-dificultad-nombre">{etiquetaDificultadElegida(d)}</span>
                    <span className="pr-dificultad-desc">{DESCRIPCION[d]}</span>
                    <span className="pr-dificultad-reparto">
                      {reparto ? DIFICULTADES.map((n) => `${reparto[n]} ${PLURAL[n]}`).join(" · ") : "Reparto a tu medida"}
                    </span>
                  </button>
                );
              })}
            </div>

            {ajustes.dificultad === "personalizada" && (
              <div className="pr-personalizada">
                <div className="pr-personalizada-campos">
                  {DIFICULTADES.map((n) => (
                    <label key={n} className="pr-campo">
                      <span>{NIVELES[n]}</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={ajustes.cantidad}
                        step={1}
                        value={ajustes.personalizada[n]}
                        onChange={(e) => cambiarNivel(n, e.target.value)}
                        aria-invalid={!personalizadaOk}
                        aria-describedby="pr-personalizada-estado"
                      />
                    </label>
                  ))}
                </div>
                <p id="pr-personalizada-estado" className={`pr-suma ${personalizadaOk ? "ok" : "mal"}`} role="status">
                  Suma: <strong>{validacion?.suma}</strong> de {ajustes.cantidad}
                  {validacion?.mensaje ? ` · ${validacion.mensaje}` : " · Correcto"}
                </p>
              </div>
            )}
            {aviso && (
              <p className="pr-nota pr-nota-aviso" role="status">
                <Info size={14} aria-hidden="true" /> {aviso}
              </p>
            )}
          </section>

          {/* ---------------------------------------------------------------- Modos */}
          <section className="pr-bloque" aria-labelledby="pr-h-modos">
            <h3 id="pr-h-modos">Modos de ayuda y control</h3>
            <ul className="pr-interruptores">
              <li>
                <label className="pr-interruptor">
                  <input type="checkbox" role="switch" checked={ajustes.modoAsistido} onChange={(e) => alCambiar({ ...ajustes, modoAsistido: e.target.checked })} />
                  <span className="pr-pista" aria-hidden="true" />
                  <span className="pr-interruptor-texto">
                    <strong>
                      <Sparkles size={14} aria-hidden="true" /> Modo asistido
                    </strong>
                    <small>Algunos términos aparecen subrayados con su definición.</small>
                  </span>
                </label>
                <AyudaInfo etiqueta="modo asistido">Se subrayan términos del enunciado; al tocarlos ves una definición breve. Nunca revela la respuesta y se preparó al generar la prueba, sin nuevas consultas a la IA.</AyudaInfo>
              </li>
              <li>
                <label className="pr-interruptor">
                  <input type="checkbox" role="switch" checked={ajustes.pausaBlindada} onChange={(e) => alCambiar({ ...ajustes, pausaBlindada: e.target.checked })} />
                  <span className="pr-pista" aria-hidden="true" />
                  <span className="pr-interruptor-texto">
                    <strong>
                      <PauseCircle size={14} aria-hidden="true" /> Pausa blindada
                    </strong>
                    <small>Puedes pausar y el reloj se detiene; las preguntas se ocultan.</small>
                  </span>
                </label>
                <AyudaInfo etiqueta="pausa blindada">Durante la pausa el servidor deja de entregar las preguntas y congela el tiempo. Al reanudar recuperas tus respuestas. No es una garantía anti-trampa absoluta.</AyudaInfo>
              </li>
              <li>
                <label className="pr-interruptor">
                  <input type="checkbox" role="switch" checked={ajustes.cronometroVisible} onChange={(e) => alCambiar({ ...ajustes, cronometroVisible: e.target.checked })} disabled={ajustes.limiteMinutos === null} />
                  <span className="pr-pista" aria-hidden="true" />
                  <span className="pr-interruptor-texto">
                    <strong>
                      <Eye size={14} aria-hidden="true" /> Mostrar cronómetro
                    </strong>
                    <small>Si lo ocultas verás una barra de progreso; el contador vuelve cuando queda poco tiempo.</small>
                  </span>
                </label>
                <AyudaInfo etiqueta="cronómetro">Con el cronómetro oculto se muestra solo una barra. El número reaparece, en rojo y con texto, cuando queda el 25 % del tiempo (entre 1 y 10 minutos).</AyudaInfo>
              </li>
            </ul>
          </section>
        </div>

        {/* ------------------------------------------------------------------ Resumen */}
        <aside className="pr-resumen" aria-label="Resumen de la prueba">
          <h3>Tu prueba</h3>
          <dl>
            <div>
              <dt>Preguntas</dt>
              <dd>{ajustes.cantidad}</dd>
            </div>
            <div>
              <dt>Dificultad</dt>
              <dd>{etiquetaDificultadElegida(ajustes.dificultad)}</dd>
            </div>
            <div>
              <dt>Tiempo</dt>
              <dd>{etiquetaTiempo(ajustes.limiteMinutos)}</dd>
            </div>
          </dl>
          <DistribucionBarra distribucion={distribucion} total={ajustes.cantidad} valida={personalizadaOk} />
          <p className="pr-nota">
            Puntaje máximo: <strong>{personalizadaOk ? formatearPuntos(puntajeMaximoPara(distribucion)) : "—"}</strong> puntos. Cada pregunta vale {formatearPuntos(PESO_PREGUNTA.facil)} (fácil), {formatearPuntos(PESO_PREGUNTA.media)} (media) o {formatearPuntos(PESO_PREGUNTA.dificil)} (difícil).
          </p>
          <Boton tamano="lg" anchoCompleto disabled={!puedeIniciar} onClick={alIniciar} icono={<ArrowRight size={18} />} data-tour="prueba-iniciar">
            Generar prueba
          </Boton>
          {!puedeIniciar && !sinContenido && <p className="pr-nota pr-nota-aviso">{!personalizadaOk ? "Ajusta el reparto personalizado para continuar." : "Elige una cantidad menor."}</p>}
        </aside>
      </div>
    </div>
  );
}

function DistribucionBarra({ distribucion, total, valida }: { distribucion: DistribucionNiveles; total: number; valida: boolean }) {
  const base = total > 0 ? total : 1;
  return (
    <div className="pr-distribucion" aria-label="Distribución por dificultad">
      <div className="pr-distribucion-barra" aria-hidden="true">
        {DIFICULTADES.map((n) => (
          <span key={n} className={`pr-nivel pr-nivel-${n}`} style={{ width: `${valida ? (distribucion[n] / base) * 100 : 0}%` }} />
        ))}
      </div>
      <ul>
        {DIFICULTADES.map((n) => (
          <li key={n}>
            <span className={`pr-punto pr-nivel-${n}`} aria-hidden="true" />
            {NIVELES[n]} <strong>{distribucion[n]}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

