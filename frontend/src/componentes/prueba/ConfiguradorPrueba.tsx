import { useMemo } from "react";
import type { ConfiguracionPrueba, PreguntaEstudio } from "../../tipos";
import { contarPorDificultad, planificarPrueba, segundosPorPregunta } from "../../utilidades/constructorPruebas";
import SelectorCantidadPreguntas from "./SelectorCantidadPreguntas";
import SelectorDificultad from "./SelectorDificultad";
import SelectorTiempo from "./SelectorTiempo";
import ResumenPrueba from "./ResumenPrueba";

interface Props {
  tituloTema: string;
  reserva: PreguntaEstudio[];
  configuracion: ConfiguracionPrueba;
  alCambiar: (configuracion: ConfiguracionPrueba) => void;
  alIniciar: () => void;
}

/** Configurador de la prueba (izquierda) + resumen en vivo (derecha). */
export default function ConfiguradorPrueba({ tituloTema, reserva, configuracion, alCambiar, alIniciar }: Props) {
  const plan = useMemo(() => planificarPrueba(contarPorDificultad(reserva), configuracion.cantidadPreguntas, configuracion.dificultad), [reserva, configuracion.cantidadPreguntas, configuracion.dificultad]);
  const segundosPorPreguntaCalculado = segundosPorPregunta(configuracion);

  return (
    <div className="exam-config">
      <section className="exam-config-main">
        <header className="exam-config-head">
          <h2>Configura tu prueba</h2>
          <p>
            Define cuántas preguntas, qué tan exigente y cuánto tiempo tendrás para <strong>{tituloTema}</strong>.
          </p>
        </header>

        <div className="cfg-section">
          <div className="cfg-label">
            <h3>Cantidad de preguntas</h3>
            <span>{reserva.length} disponibles en este tema</span>
          </div>
          <SelectorCantidadPreguntas valor={configuracion.cantidadPreguntas} disponibles={reserva.length} alCambiar={(cantidadPreguntas) => alCambiar({ ...configuracion, cantidadPreguntas })} />
        </div>

        <div className="cfg-section">
          <div className="cfg-label">
            <h3>Dificultad</h3>
            <span>Define la mezcla real de preguntas</span>
          </div>
          <SelectorDificultad valor={configuracion.dificultad} alCambiar={(dificultad) => alCambiar({ ...configuracion, dificultad })} />
        </div>

        <div className="cfg-section">
          <div className="cfg-label">
            <h3>Tiempo</h3>
            <span>{segundosPorPreguntaCalculado === null ? "Sin cronómetro regresivo" : `≈ ${segundosPorPreguntaCalculado} s por pregunta`}</span>
          </div>
          <SelectorTiempo valor={configuracion.limiteTiempoMinutos} alCambiar={(limiteTiempoMinutos) => alCambiar({ ...configuracion, limiteTiempoMinutos })} />
        </div>
      </section>

      <ResumenPrueba configuracion={configuracion} plan={plan} alIniciar={alIniciar} />
    </div>
  );
}
