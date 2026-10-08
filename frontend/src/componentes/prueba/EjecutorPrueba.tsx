import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";
import type { ConfiguracionPrueba, PreguntaEstudio } from "../../tipos";
import { PESO_PREGUNTA, formatearPuntos } from "../../utilidades/constructorPruebas";
import { etiquetaDificultad } from "../../utilidades/formato";
import type { MapaRespuestas } from "../../servicios/servicioPruebas";
import Boton from "../Boton";
import Modal from "../Modal";
import ProgresoPrueba from "./ProgresoPrueba";

interface Props {
  tituloTema: string;
  preguntas: PreguntaEstudio[];
  configuracion: ConfiguracionPrueba;
  enviando: boolean;
  alEnviar: (carga: { respuestas: MapaRespuestas; segundos: number; tiempoAgotado: boolean }) => void;
  alSalir: () => void;
}

/**
 * Modo concentración: pantalla completa sin sidebar ni header.
 * Solo pregunta, alternativas, progreso y tiempo.
 */
export default function EjecutorPrueba({ tituloTema, preguntas, configuracion, enviando, alEnviar, alSalir }: Props) {
  const [indice, establecerIndice] = useState(0);
  const [direccion, establecerDireccion] = useState<"next" | "prev">("next");
  const [respuestas, establecerRespuestas] = useState<MapaRespuestas>({});
  const [segundos, establecerSegundos] = useState(0);
  const [confirmar, establecerConfirmar] = useState<null | "finish" | "exit">(null);
  const refInicio = useRef(Date.now());
  const refTerminado = useRef(false);

  const limiteSegundos = configuracion.limiteTiempoMinutos === null ? null : configuracion.limiteTiempoMinutos * 60;
  const total = preguntas.length;
  const actual = preguntas[indice];
  const respuesta = respuestas[actual.id];
  const estaRespondida = (q: PreguntaEstudio) => {
    const a = respuestas[q.id];
    return q.tipo === "abierta" ? !!a?.textoAbierto?.trim() : !!a?.idOpcion;
  };
  const cantidadRespondidas = preguntas.filter(estaRespondida).length;

  // Cronómetro basado en reloj real (no se desfasa si la pestaña queda en segundo plano)
  useEffect(() => {
    const temporizador = setInterval(() => establecerSegundos(Math.floor((Date.now() - refInicio.current) / 1000)), 250);
    return () => clearInterval(temporizador);
  }, []);

  function enviar(tiempoAgotado: boolean) {
    if (refTerminado.current) return;
    refTerminado.current = true;
    alEnviar({ respuestas, segundos: limiteSegundos !== null ? Math.min(segundos, limiteSegundos) : segundos, tiempoAgotado });
  }

  // Fin automático al agotarse el tiempo
  useEffect(() => {
    if (limiteSegundos !== null && segundos >= limiteSegundos) enviar(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segundos]);

  function irA(siguiente: number) {
    if (siguiente < 0 || siguiente >= total || siguiente === indice) return;
    establecerDireccion(siguiente > indice ? "next" : "prev");
    establecerIndice(siguiente);
  }

  function seleccionarOpcion(idOpcion: string) {
    establecerRespuestas((previo) => ({ ...previo, [actual.id]: { idOpcion } }));
  }

  function solicitarFinalizar() {
    if (cantidadRespondidas < total) establecerConfirmar("finish");
    else enviar(false);
  }

  // Atajos: ← → navegan · 1-4 / A-D eligen alternativa
  useEffect(() => {
    function alTecla(e: KeyboardEvent) {
      if (confirmar || enviando) return;
      const el = e.target as HTMLElement;
      if (el.tagName === "TEXTAREA" || el.tagName === "INPUT") return;
      if (e.key === "ArrowRight") irA(indice + 1);
      else if (e.key === "ArrowLeft") irA(indice - 1);
      else if (e.key === "Escape") establecerConfirmar("exit");
      else if (actual.tipo !== "abierta" && actual.opciones) {
        const k = e.key.toLowerCase();
        const porNumero = "1234".indexOf(k);
        const porLetra = "abcd".indexOf(k);
        const posicion = porNumero >= 0 ? porNumero : porLetra;
        const opcion = posicion >= 0 ? actual.opciones[posicion] : undefined;
        if (opcion) seleccionarOpcion(opcion.id);
      }
    }
    window.addEventListener("keydown", alTecla);
    return () => window.removeEventListener("keydown", alTecla);
  });

  const esUltima = indice === total - 1;

  // Portal al body: el modo concentración cubre toda la pantalla sin depender de los transforms del layout
  return createPortal(
    <div className="exam-focus" role="dialog" aria-modal="true" aria-label="Prueba en curso">
      <ProgresoPrueba tituloTema={tituloTema} indice={indice} total={total} segundos={segundos} limiteSegundos={limiteSegundos} alSalir={() => establecerConfirmar("exit")} />

      <main className="focus-main">
        <div className="focus-col">
          <div className="focus-qmeta">
            <span className="mono">
              Pregunta {indice + 1} de {total}
            </span>
            <span className={`pts-tag mix-${actual.dificultad}-soft`} title={`Dificultad ${etiquetaDificultad(actual.dificultad).toLowerCase()}`}>
              {formatearPuntos(PESO_PREGUNTA[actual.dificultad])} {PESO_PREGUNTA[actual.dificultad] === 1 ? "punto" : "puntos"}
            </span>
          </div>

          <div key={actual.id} className={`focus-question q-enter-${direccion}`}>
            <p className="focus-prompt">{actual.enunciado}</p>

            {actual.tipo === "abierta" ? (
              <textarea
                className="textarea focus-textarea"
                placeholder="Escribe tu respuesta…"
                value={respuesta?.textoAbierto ?? ""}
                onChange={(e) => establecerRespuestas((previo) => ({ ...previo, [actual.id]: { textoAbierto: e.target.value } }))}
              />
            ) : (
              <div className="focus-options" role="radiogroup" aria-label="Alternativas">
                {actual.opciones?.map((opcion, i) => (
                  <button key={opcion.id} role="radio" aria-checked={respuesta?.idOpcion === opcion.id} className={`focus-option ${respuesta?.idOpcion === opcion.id ? "selected" : ""}`} onClick={() => seleccionarOpcion(opcion.id)}>
                    <span className="focus-marker">{actual.tipo === "verdadero-falso" ? i + 1 : String.fromCharCode(65 + i)}</span>
                    <span>{opcion.etiqueta}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="focus-nav">
            <Boton variante="secondary" disabled={indice === 0} onClick={() => irA(indice - 1)}>
              <ChevronLeft size={16} />
              Anterior
            </Boton>
            <span className="focus-count hide-mobile">
              {cantidadRespondidas} de {total} respondidas
            </span>
            {esUltima ? (
              <Boton onClick={solicitarFinalizar} cargando={enviando} icono={<Flag size={15} />}>
                Finalizar prueba
              </Boton>
            ) : (
              <Boton onClick={() => irA(indice + 1)}>
                Siguiente
                <ChevronRight size={16} />
              </Boton>
            )}
          </div>
        </div>

        <aside className="focus-rail" aria-label="Navegación entre preguntas">
          <p>Tus respuestas</p>
          <div className="navgrid">
            {preguntas.map((q, i) => (
              <button key={q.id} className={`navdot ${i === indice ? "current" : ""} ${estaRespondida(q) ? "done" : ""}`} onClick={() => irA(i)} aria-label={`Ir a la pregunta ${i + 1}${estaRespondida(q) ? " (respondida)" : ""}`} aria-current={i === indice}>
                {i + 1}
              </button>
            ))}
          </div>
          <small>
            {cantidadRespondidas} de {total} respondidas
          </small>
          <small className="focus-keys hide-mobile">← → navegar · 1-4 elegir</small>
        </aside>
      </main>

      <Modal abierto={confirmar === "finish"} alCerrar={() => establecerConfirmar(null)} titulo="¿Finalizar la prueba?">
        <p className="text-muted" style={{ marginBottom: 18 }}>
          Tienes {total - cantidadRespondidas} {total - cantidadRespondidas === 1 ? "pregunta sin responder" : "preguntas sin responder"}. Se contarán como omitidas.
        </p>
        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <Boton variante="secondary" onClick={() => establecerConfirmar(null)}>
            Seguir revisando
          </Boton>
          <Boton
            onClick={() => {
              establecerConfirmar(null);
              enviar(false);
            }}
          >
            Finalizar prueba
          </Boton>
        </div>
      </Modal>

      <Modal abierto={confirmar === "exit"} alCerrar={() => establecerConfirmar(null)} titulo="¿Salir de la prueba?">
        <p className="text-muted" style={{ marginBottom: 18 }}>
          Si sales ahora no se guardará tu progreso en esta prueba.
        </p>
        <div className="row gap-sm" style={{ justifyContent: "flex-end" }}>
          <Boton variante="secondary" onClick={() => establecerConfirmar(null)}>
            Continuar prueba
          </Boton>
          <Boton variante="danger" onClick={alSalir}>
            Salir sin guardar
          </Boton>
        </div>
      </Modal>
    </div>,
    document.body
  );
}
