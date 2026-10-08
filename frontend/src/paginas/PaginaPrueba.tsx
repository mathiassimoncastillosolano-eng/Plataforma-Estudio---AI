import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useContextoTema } from "../disposiciones/contextoTema";
import * as aiService from "../servicios/servicioIa";
import * as examService from "../servicios/servicioPruebas";
import * as studyService from "../servicios/servicioEstudio";
import type { ConfiguracionPrueba, PreguntaEstudio, ResumenTema } from "../tipos";
import { CANTIDADES_PREGUNTAS, construirPrueba } from "../utilidades/constructorPruebas";
import { establecerEstados, type MapaEstados } from "../utilidades/estadoPregunta";
import { registrarActividad } from "../almacen/almacenSesion";
import { EstadoCarga, ErrorState, EmptyState } from "../componentes/Estados";
import ConfiguradorPrueba from "../componentes/prueba/ConfiguradorPrueba";
import EjecutorPrueba from "../componentes/prueba/EjecutorPrueba";

type Fase = "cargando" | "configuracion" | "ejecutando" | "error";

export default function PaginaPrueba() {
  const { tema, establecerTema } = useContextoTema();
  const navegar = useNavigate();
  const [fase, establecerFase] = useState<Fase>("cargando");
  const [configuracion, establecerConfiguracion] = useState<ConfiguracionPrueba | null>(null);
  const [reserva, establecerReserva] = useState<PreguntaEstudio[]>([]);
  const [resumen, establecerResumen] = useState<ResumenTema | undefined>();
  const [preguntasPrueba, establecerPreguntasPrueba] = useState<PreguntaEstudio[]>([]);
  const [enviando, establecerEnviando] = useState(false);

  async function cargar() {
    establecerFase("cargando");
    try {
      const [guardado, preguntas, conceptos] = await Promise.all([examService.obtenerConfiguracionPrueba(tema.id), aiService.generarPreguntas(tema.id, tema.titulo), aiService.obtenerConceptosTema(tema.id, tema.titulo)]);
      // Si la configuración guardada pide más preguntas de las disponibles, se ajusta.
      let cantidadPreguntas = guardado.cantidadPreguntas;
      if (cantidadPreguntas > preguntas.length) {
        const cabe = [...CANTIDADES_PREGUNTAS].filter((n) => n <= preguntas.length);
        cantidadPreguntas = cabe.length > 0 ? cabe[cabe.length - 1] : preguntas.length;
      }
      establecerConfiguracion({ ...guardado, cantidadPreguntas });
      establecerReserva(preguntas);
      establecerResumen(conceptos.resumen);
      establecerFase("configuracion");
    } catch {
      establecerFase("error");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema.id]);

  function iniciarPrueba() {
    if (!configuracion) return;
    const construida = construirPrueba(reserva, configuracion);
    if (!construida) return; // el botón ya está deshabilitado si no es factible
    examService.guardarConfiguracionPrueba(configuracion);
    establecerPreguntasPrueba(construida.preguntas);
    establecerFase("ejecutando");
  }

  async function manejarEnvio({ respuestas, segundos, tiempoAgotado }: { respuestas: examService.MapaRespuestas; segundos: number; tiempoAgotado: boolean }) {
    if (!configuracion) return;
    establecerEnviando(true);
    try {
      const intentos = examService.construirIntentos(preguntasPrueba, respuestas);
      const resultado = examService.calificarPrueba({ preguntas: preguntasPrueba, intentos, configuracion, duracionSegundos: segundos, tiempoAgotado, resumen });

      // Cada pregunta queda marcada para el modo estudio: acertada o por repasar
      const actualizaciones: MapaEstados = {};
      intentos.forEach((a) => (actualizaciones[a.idPregunta] = a.esCorrecta ? "conocida" : "repaso"));
      establecerEstados(tema.id, actualizaciones);

      await studyService.incrementarPruebasCompletadas(tema.id);
      const mezclado = Math.min(100, Math.round(tema.dominio * 0.35 + resultado.porcentajePuntaje * 0.65));
      const actualizado = await studyService.actualizarDominioTema(tema.id, mezclado);
      if (actualizado) establecerTema(actualizado);

      registrarActividad({ tipo: "prueba", idTema: tema.id, tituloTema: tema.titulo, descripcion: `Completaste una prueba con ${resultado.porcentajePuntaje}% de aciertos.` });

      const almacenado = { resultado, preguntas: preguntasPrueba, intentos };
      examService.guardarUltimoResultado(almacenado);
      navegar(`/estudio/${tema.id}/resultados`, { state: almacenado });
    } catch {
      establecerEnviando(false);
      establecerFase("error");
    }
  }

  if (fase === "cargando") return <EstadoCarga mensaje="Preparando tu prueba..." />;
  if (fase === "error" || !configuracion) return <ErrorState alReintentar={cargar} />;
  if (reserva.length === 0) {
    return <EmptyState titulo="Este tema aún no tiene preguntas" descripcion="Cuando la IA genere preguntas para el tema, podrás configurar una prueba." />;
  }

  if (fase === "ejecutando") {
    return <EjecutorPrueba tituloTema={tema.titulo} preguntas={preguntasPrueba} configuracion={configuracion} enviando={enviando} alEnviar={manejarEnvio} alSalir={() => establecerFase("configuracion")} />;
  }

  return <ConfiguradorPrueba tituloTema={tema.titulo} reserva={reserva} configuracion={configuracion} alCambiar={establecerConfiguracion} alIniciar={iniciarPrueba} />;
}
