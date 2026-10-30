import { useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Ban, Bookmark, Check, PauseCircle, Send, Undo2 } from "lucide-react";
import type { MapaDescartes, MapaRespuestas, PreguntaExamen, PruebaPublica, TiempoPrueba } from "../../tipos/prueba";
import { useProteccionExamen } from "../../hooks/useProteccionExamen";
import { formatearPuntos } from "../../utilidades/constructorPruebas";
import Boton from "../Boton";
import Modal from "../Modal";
import RelojPrueba from "./RelojPrueba";
import TextoConTerminos from "./TextoConTerminos";

interface Props {
  prueba: PruebaPublica;
  preguntas: PreguntaExamen[];
  tiempo: TiempoPrueba;
  respuestas: MapaRespuestas;
  descartes: MapaDescartes;
  marcadas: string[];
  indice: number;
  aviso: string | null;
  ocupado: boolean;
  entregando: boolean;
  alIr: (indice: number) => void;
  alElegir: (idPregunta: string, idOpcion: string) => void;
  alDescartar: (idPregunta: string, idOpcion: string) => void;
  alMarcar: (idPregunta: string) => void;
  alPausar: () => void;
  alEntregar: () => void;
  alAgotarTiempo: () => void;
}

const LETRAS = ["A", "B", "C", "D", "E", "F"];
const NIVEL: Record<PreguntaExamen["dificultad"], string> = { facil: "Fácil", media: "Media", dificil: "Difícil" };

export default function EjecutorPrueba(props: Props) {
  const { prueba, preguntas, tiempo, respuestas, descartes, marcadas, indice, aviso, ocupado, entregando } = props;
  const contenedor = useRef<HTMLDivElement>(null);
  const [confirmando, establecerConfirmando] = useState(false);
  useProteccionExamen(contenedor, true);

  const pregunta = preguntas[Math.min(indice, preguntas.length - 1)];
  const pendientes = useMemo(() => preguntas.filter((q) => !respuestas[q.id]), [preguntas, respuestas]);
  const respondidas = preguntas.length - pendientes.length;
  const descartadas = descartes[pregunta.id] ?? [];
  const esUltima = indice >= preguntas.length - 1;

  function irAPrimeraPendiente() {
    const i = preguntas.findIndex((q) => !respuestas[q.id]);
    if (i >= 0) props.alIr(i);
    establecerConfirmando(false);
  }

  return (
    <div className="pr-examen" ref={contenedor} data-modo={prueba.modoAsistido ? "asistido" : undefined}>
      <header className="pr-barra">
        <div className="pr-barra-titulo">
          <p className="eyebrow">Prueba en curso</p>
          <h2>{prueba.tituloTema}</h2>
        </div>
        <RelojPrueba tiempo={tiempo} cronometroVisible={prueba.cronometroVisible} alAgotar={props.alAgotarTiempo} />
        <div className="pr-barra-acciones">
          {prueba.pausaBlindada && (
            <Boton variante="secondary" onClick={props.alPausar} cargando={ocupado} icono={<PauseCircle size={16} />}>
              Pausar
            </Boton>
          )}
          <Boton onClick={() => establecerConfirmando(true)} disabled={entregando} icono={<Send size={16} />}>
            Entregar
          </Boton>
        </div>
      </header>

      {aviso && (
        <div className="pr-banner pr-banner-warn" role="status">
          <AlertTriangle size={18} aria-hidden="true" />
          <span>{aviso}</span>
        </div>
      )}

      <div className="pr-cuerpo">
        <article className="pr-pregunta" aria-labelledby="pr-enunciado" key={pregunta.id}>
          <div className="pr-pregunta-meta">
            <span>
              Pregunta <strong>{indice + 1}</strong> de {preguntas.length}
            </span>
            <span className={`pr-etiqueta pr-nivel-${pregunta.dificultad}`}>
              {NIVEL[pregunta.dificultad]} · {formatearPuntos(pregunta.puntos)} {pregunta.puntos === 1 ? "punto" : "puntos"}
            </span>
          </div>

          <h3 id="pr-enunciado" className="pr-enunciado">
            {prueba.modoAsistido ? <TextoConTerminos enunciado={pregunta.enunciado} terminos={pregunta.terminos} /> : pregunta.enunciado}
          </h3>
          {prueba.modoAsistido && pregunta.terminos.length > 0 && <p className="pr-nota">Toca los términos subrayados para ver su definición.</p>}

          <ul className="pr-opciones" role="radiogroup" aria-labelledby="pr-enunciado">
            {pregunta.opciones.map((o, i) => {
              const seleccionada = respuestas[pregunta.id] === o.id;
              const descartada = descartadas.includes(o.id);
              return (
                <li key={o.id} className="pr-opcion-fila" data-descartada={descartada || undefined}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={seleccionada}
                    className="pr-opcion"
                    data-seleccionada={seleccionada || undefined}
                    onClick={() => props.alElegir(pregunta.id, o.id)}
                  >
                    <span className="pr-opcion-letra" aria-hidden="true">
                      {seleccionada ? <Check size={15} /> : LETRAS[i]}
                    </span>
                    <span className="pr-opcion-texto">{o.texto}</span>
                    {descartada && (
                      <span className="pr-opcion-estado">
                        <Ban size={13} aria-hidden="true" /> Descartada
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="pr-descartar"
                    aria-pressed={descartada}
                    aria-label={descartada ? `Restaurar la alternativa ${LETRAS[i]}` : `Descartar la alternativa ${LETRAS[i]}`}
                    title={descartada ? "Restaurar alternativa" : "Descartar alternativa"}
                    onClick={() => props.alDescartar(pregunta.id, o.id)}
                  >
                    {descartada ? <Undo2 size={16} aria-hidden="true" /> : <Ban size={16} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="pr-pie">
            <Boton variante="ghost" icono={<ArrowLeft size={16} />} disabled={indice === 0} onClick={() => props.alIr(indice - 1)}>
              Anterior
            </Boton>
            <button type="button" className="pr-marcar" aria-pressed={marcadas.includes(pregunta.id)} onClick={() => props.alMarcar(pregunta.id)}>
              <Bookmark size={16} aria-hidden="true" /> {marcadas.includes(pregunta.id) ? "Marcada para revisar" : "Marcar para revisar"}
            </button>
            {esUltima ? (
              <Boton onClick={() => establecerConfirmando(true)} icono={<Send size={16} />}>
                Entregar
              </Boton>
            ) : (
              <Boton variante="secondary" onClick={() => props.alIr(indice + 1)}>
                Siguiente <ArrowRight size={16} />
              </Boton>
            )}
          </div>
        </article>

        <nav className="pr-mapa" aria-label="Mapa de preguntas">
          <h4>
            {respondidas} de {preguntas.length} respondidas
          </h4>
          <ol>
            {preguntas.map((q, i) => {
              const estado = respuestas[q.id] ? "respondida" : "vacia";
              const marcada = marcadas.includes(q.id);
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    className="pr-mapa-item"
                    data-estado={estado}
                    data-marcada={marcada || undefined}
                    aria-current={i === indice ? "step" : undefined}
                    aria-label={`Pregunta ${i + 1}: ${estado === "respondida" ? "respondida" : "sin responder"}${marcada ? ", marcada para revisar" : ""}`}
                    onClick={() => props.alIr(i)}
                  >
                    {i + 1}
                  </button>
                </li>
              );
            })}
          </ol>
          <ul className="pr-leyenda">
            <li><span data-estado="respondida" /> Respondida</li>
            <li><span data-estado="vacia" /> Sin responder</li>
            <li><span data-marcada="true" /> Marcada</li>
          </ul>
        </nav>
      </div>

      <Modal abierto={confirmando} alCerrar={() => establecerConfirmando(false)} titulo={pendientes.length > 0 ? "Tienes preguntas sin responder" : "¿Entregar la prueba?"}>
        {pendientes.length > 0 ? (
          <>
            <p className="pr-modal-texto">
              Te {pendientes.length === 1 ? "queda" : "quedan"} <strong>{pendientes.length}</strong> {pendientes.length === 1 ? "pregunta" : "preguntas"} sin responder
              {pendientes.length <= 8 ? `: ${pendientes.map((q) => preguntas.indexOf(q) + 1).join(", ")}` : ""}. Las preguntas vacías puntúan cero.
            </p>
            <div className="pr-modal-acciones">
              <Boton autoFocus onClick={irAPrimeraPendiente}>
                Revisar pendientes
              </Boton>
              <Boton variante="secondary" onClick={() => { establecerConfirmando(false); props.alEntregar(); }}>
                Finalizar igualmente
              </Boton>
            </div>
          </>
        ) : (
          <>
            <p className="pr-modal-texto">Respondiste las {preguntas.length} preguntas. Una vez entregada, no podrás modificar tus respuestas.</p>
            <div className="pr-modal-acciones">
              <Boton autoFocus onClick={() => { establecerConfirmando(false); props.alEntregar(); }}>
                Entregar prueba
              </Boton>
              <Boton variante="secondary" onClick={() => establecerConfirmando(false)}>
                Seguir revisando
              </Boton>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
