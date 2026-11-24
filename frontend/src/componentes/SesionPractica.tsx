import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import type { PreguntaEstudio } from "../tipos";
import { useContextoTema } from "../disposiciones/contextoTema";
import { registrarRespuestas } from "../almacen/almacenSesion";
import { segundosEntre } from "../utilidades/rendimiento";
import PreguntaPractica from "./PreguntaPractica";
import MedidorDominio from "./MedidorDominio";
import Boton from "./Boton";
import { useBuddy } from "../buddy/BuddyProvider";
import { felicitacionResultado } from "../buddy/mensajes";
import { consolidarPractica, type RespuestaPractica } from "../servicios/servicioAdaptacion";

interface Props {
  preguntas: PreguntaEstudio[];
  /** Notifica cada respuesta para registrar el estado de la pregunta. */
  alResponder: (idPregunta: string, esCorrecta: boolean) => void;
  alSalir: () => void;
}

/**
 * Práctica guiada (comportamiento original): una pregunta a la vez, con
 * retroalimentación inmediata y actualización del indicador de dominio.
 */
export default function SesionPractica({ preguntas, alResponder, alSalir }: Props) {
  const { tema, establecerTema } = useContextoTema();
  const [indiceActual, establecerIndiceActual] = useState(0);
  const [correcta, establecerCorrecta] = useState(0);
  const [incorrecta, establecerIncorrecta] = useState(0);
  const [terminada, establecerTerminada] = useState(false);
  const [ronda, establecerRonda] = useState(0);
  /** MOD-08: instante en que se mostró la pregunta actual (tiempo por pregunta). */
  const inicioPregunta = useRef(Date.now());

  /** Respuestas de esta práctica, que se envían al backend al terminar. */
  const respuestasTanda = useRef<RespuestaPractica[]>([]);
  const idTema = tema.id;
  const { anunciar } = useBuddy();
  const primeraPractica = useRef(tema.preguntasRespondidas === 0);

  useEffect(
    () => () => {
      const restantes = respuestasTanda.current.splice(0);
      if (restantes.length === 0) return;
      void consolidarPractica(idTema, restantes, restantes.length).then((actualizado) => {
        if (actualizado) establecerTema(actualizado);
      });
    },
    [idTema]
  );

  function manejarRespondida(idPregunta: string, esCorrecta: boolean) {
    if (esCorrecta) establecerCorrecta((c) => c + 1);
    else establecerIncorrecta((c) => c + 1);
    const pregunta = preguntas.find((p) => p.id === idPregunta);
    if (pregunta) {
      const segundos = segundosEntre(inicioPregunta.current, Date.now());
      registrarRespuestas(tema.id, [{ dificultad: pregunta.dificultad, correcta: esCorrecta, segundos, origen: "practica" }]);
      respuestasTanda.current.push({ dificultad: pregunta.dificultad, correcta: esCorrecta, segundos });
    }
    alResponder(idPregunta, esCorrecta);
  }

  async function manejarSiguiente() {
    if (indiceActual + 1 >= preguntas.length) {
      establecerTerminada(true);
      const actualizado = await consolidarPractica(tema.id, respuestasTanda.current.splice(0), preguntas.length);
      if (actualizado) establecerTema(actualizado);
    } else {
      inicioPregunta.current = Date.now();
      establecerIndiceActual((i) => i + 1);
    }
  }

  function reiniciar() {
    establecerIndiceActual(0);
    establecerCorrecta(0);
    establecerIncorrecta(0);
    establecerTerminada(false);
    respuestasTanda.current = [];
    inicioPregunta.current = Date.now();
    establecerRonda((r) => r + 1);    
  }

  const totalRonda = correcta + incorrecta;
  const porcentajeRonda = totalRonda > 0 ? Math.round((correcta / totalRonda) * 100) : 0;

  useEffect(() => {
    if (!terminada || totalRonda === 0) return;
    anunciar(
      felicitacionResultado({
        idEvento: `practica:${idTema}:${Date.now()}`,
        porcentaje: porcentajeRonda,
        correctas: correcta,
        total: totalRonda,
        primera: primeraPractica.current,
        tituloPrimera: "¡Tu primera práctica!",
        rutaRepaso: `/estudio/${idTema}/resumen`,
      })
    );
    primeraPractica.current = false;
  }, [terminada]);

  if (terminada) {
    const total = totalRonda;
    const porcentaje = porcentajeRonda;
    return (
      <div className="practice-done">
        <MedidorDominio valor={porcentaje} etiqueta="Aciertos" tamano={150} />
        <h2>Práctica completada</h2>
        <p className="text-muted">
          Respondiste correctamente {correcta} de {total} preguntas.
        </p>
        <div className="results-actions">
          <Boton variante="secondary" onClick={reiniciar}>
            <RotateCcw size={15} />
            Practicar de nuevo
          </Boton>
          <Boton variante="secondary" onClick={alSalir}>
            Volver a la lista
          </Boton>
          <Link to={`/estudio/${tema.id}/prueba`} className="btn btn-primary">
            Ir a la prueba
          </Link>
        </div>
      </div>
    );
  }

  const actual = preguntas[indiceActual];
  const porcentajeProgreso = Math.round((indiceActual / preguntas.length) * 100);

  return (
    <div className="practice">
      <div className="practice-top">
        <div className="progress-track" role="progressbar" aria-valuenow={porcentajeProgreso} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-fill" style={{ width: `${porcentajeProgreso}%` }} />
        </div>
        <div className="practice-tally">
          <span className="text-muted">
            Correctas: <strong style={{ color: "var(--color-success)" }}>{correcta}</strong>
          </span>
          <span className="text-muted">
            Incorrectas: <strong style={{ color: "var(--color-danger)" }}>{incorrecta}</strong>
          </span>
        </div>
      </div>

      <PreguntaPractica
        key={`${ronda}-${actual.id}`}
        pregunta={actual}
        indice={indiceActual}
        total={preguntas.length}
        alResponder={(ok) => manejarRespondida(actual.id, ok)}
        alSiguiente={manejarSiguiente}
        esUltima={indiceActual + 1 >= preguntas.length}
      />
    </div>
  );
}
