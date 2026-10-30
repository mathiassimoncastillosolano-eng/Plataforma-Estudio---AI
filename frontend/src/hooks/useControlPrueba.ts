import { useCallback, useEffect, useRef, useState } from "react";
import type { ResumenGeneral } from "../tipos";
import type { AjustesPrueba, MapaDescartes, MapaRespuestas, PruebaPublica, ResultadoCompleto, RespuestaPrueba, TiempoPrueba } from "../tipos/prueba";
import {
  ErrorApi,
  borrarSesionPrueba,
  cargarSesionPrueba,
  consultarPrueba,
  crearPrueba,
  finalizarPrueba,
  guardarSesionPrueba,
  guardarUltimoResultado,
  idSolicitudNuevo,
  iniciarPrueba,
  pausarPrueba,
  reanudarPrueba,
  sincronizarPrueba,
} from "../servicios/servicioPruebas";

export type FasePrueba = "cargando" | "configuracion" | "generando" | "lista" | "ejecutando" | "pausada" | "entregando" | "error";

const RETARDO_SINCRONIZACION_MS = 700;
const LATIDO_MS = 20_000;
/** Códigos tras los cuales la prueba guardada ya no sirve. */
const CODIGOS_PRUEBA_PERDIDA = new Set(["PRUEBA_EXPIRADA", "PRUEBA_INVALIDA"]);

interface Opciones {
  idTema: string;
  tituloTema: string;
  resumen: ResumenGeneral | null;
  /** Se invoca una sola vez cuando el servidor devuelve el resultado. */
  alFinalizar: (resultado: ResultadoCompleto) => void | Promise<void>;
}

const mensajeDe = (e: unknown) => (e instanceof ErrorApi ? e.message : "No pudimos completar la operación. Inténtalo de nuevo.");

/**
 * Controlador de una prueba: coordina el servidor (fuente de verdad del reloj, las preguntas y la
 * calificación), la copia local mínima (sello + respuestas) y las transiciones de pantalla.
 */
export function useControlPrueba({ idTema, tituloTema, resumen, alFinalizar }: Opciones) {
  const [fase, establecerFase] = useState<FasePrueba>("cargando");
  const [prueba, establecerPrueba] = useState<PruebaPublica | null>(null);
  const [tiempo, establecerTiempo] = useState<TiempoPrueba | null>(null);
  const [respuestas, establecerRespuestas] = useState<MapaRespuestas>({});
  const [descartes, establecerDescartes] = useState<MapaDescartes>({});
  const [marcadas, establecerMarcadas] = useState<string[]>([]);
  const [indice, establecerIndice] = useState(0);
  const [error, establecerError] = useState<string | null>(null);
  const [aviso, establecerAviso] = useState<string | null>(null);
  const [ocupado, establecerOcupado] = useState(false);

  const sello = useRef<string | null>(null);
  const idSolicitud = useRef<string | null>(null);
  const cola = useRef<Promise<unknown>>(Promise.resolve());
  const vivo = useRef(true);
  const entregada = useRef(false);
  const ultimos = useRef({ respuestas, descartes });
  ultimos.current = { respuestas, descartes };
  const alFinalizarRef = useRef(alFinalizar);
  alFinalizarRef.current = alFinalizar;
  const sucia = useRef(false);

  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  /** Las llamadas con sello van en fila: cada una usa el sello que dejó la anterior. */
  const enFila = useCallback(<T,>(tarea: () => Promise<T>): Promise<T> => {
    const siguiente = cola.current.catch(() => undefined).then(tarea);
    cola.current = siguiente.catch(() => undefined);
    return siguiente;
  }, []);

  const guardarLocal = useCallback(() => {
    if (!sello.current || !idSolicitud.current) return;
    guardarSesionPrueba(idTema, {
      idSolicitud: idSolicitud.current,
      sello: sello.current,
      respuestas: ultimos.current.respuestas,
      descartes: ultimos.current.descartes,
      marcadas: ultimosMarcadas.current,
      indice: ultimoIndice.current,
    });
  }, [idTema]);
  const ultimosMarcadas = useRef<string[]>([]);
  const ultimoIndice = useRef(0);
  ultimosMarcadas.current = marcadas;
  ultimoIndice.current = indice;

  const adoptar = useCallback(
    (r: RespuestaPrueba) => {
      sello.current = r.sello;
      establecerPrueba(r.prueba);
      establecerTiempo(r.tiempo);
      guardarLocal();
    },
    [guardarLocal]
  );

  const descartarPrueba = useCallback(() => {
    borrarSesionPrueba(idTema);
    sello.current = null;
    idSolicitud.current = null;
    establecerPrueba(null);
    establecerTiempo(null);
    establecerRespuestas({});
    establecerDescartes({});
    establecerMarcadas([]);
    establecerIndice(0);
  }, [idTema]);

  // --- Entrega ---------------------------------------------------------------------------------

  const entregar = useCallback(async () => {
    if (entregada.current || !sello.current) return;
    entregada.current = true;
    establecerFase("entregando");
    establecerError(null);
    try {
      const { resultado } = await enFila(() => finalizarPrueba(sello.current as string, ultimos.current.respuestas, ultimos.current.descartes));
      guardarUltimoResultado(idTema, resultado);
      borrarSesionPrueba(idTema);
      await alFinalizarRef.current(resultado);
    } catch (e) {
      entregada.current = false;
      if (!vivo.current) return;
      if (e instanceof ErrorApi && CODIGOS_PRUEBA_PERDIDA.has(e.codigo)) {
        descartarPrueba();
        establecerError(e.message);
        establecerFase("configuracion");
        return;
      }
      // Se conserva la prueba: el estudiante puede reintentar la entrega sin perder nada.
      establecerAviso(`${mensajeDe(e)} Tus respuestas siguen guardadas en este dispositivo.`);
      establecerFase(prueba?.estado === "pausada" ? "pausada" : "ejecutando");
    }
  }, [descartarPrueba, enFila, idTema, prueba?.estado]);

  // --- Carga inicial / recuperación -----------------------------------------------------------

  useEffect(() => {
    let cancelado = false;
    entregada.current = false;
    (async () => {
      const guardada = cargarSesionPrueba(idTema);
      if (!guardada) {
        if (!cancelado) establecerFase("configuracion");
        return;
      }
      try {
        sello.current = guardada.sello;
        idSolicitud.current = guardada.idSolicitud;
        const r = await consultarPrueba(guardada.sello);
        if (cancelado) return;
        establecerRespuestas(guardada.respuestas);
        establecerDescartes(guardada.descartes);
        establecerMarcadas(guardada.marcadas);
        establecerIndice(guardada.indice);
        ultimos.current = { respuestas: guardada.respuestas, descartes: guardada.descartes };
        adoptar(r);
        if (r.prueba.estado === "finalizada" || (r.prueba.estado === "en_curso" && r.tiempo.vencida)) {
          establecerFase("entregando");
          // Entrega pendiente (el tiempo se agotó o se cerró durante la entrega): se completa ahora.
          queueMicrotask(() => void entregarRef.current());
        } else {
          establecerFase(r.prueba.estado === "lista" ? "lista" : r.prueba.estado === "pausada" ? "pausada" : "ejecutando");
        }
      } catch (e) {
        if (cancelado) return;
        descartarPrueba();
        establecerError(e instanceof ErrorApi && CODIGOS_PRUEBA_PERDIDA.has(e.codigo) ? "La prueba anterior ya no está disponible. Puedes crear una nueva." : null);
        establecerFase("configuracion");
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idTema]);
  const entregarRef = useRef(entregar);
  entregarRef.current = entregar;

  // --- Acciones --------------------------------------------------------------------------------

  const crear = useCallback(
    async (ajustes: AjustesPrueba, senal?: AbortSignal) => {
      if (!resumen) return;
      idSolicitud.current ??= idSolicitudNuevo();
      establecerError(null);
      establecerFase("generando");
      try {
        const r = await crearPrueba({ idSolicitud: idSolicitud.current, idTema, tituloTema, resumen, ajustes }, senal);
        if (!vivo.current) return;
        establecerRespuestas({});
        establecerDescartes({});
        establecerMarcadas([]);
        establecerIndice(0);
        ultimos.current = { respuestas: {}, descartes: {} };
        adoptar(r);
        establecerFase("lista");
      } catch (e) {
        if (!vivo.current) return;
        // Un error de red conserva el id para que reintentar no genere (ni cobre) dos veces; los demás lo renuevan.
        if (!(e instanceof ErrorApi) || !["ERROR_DE_RED", "TIEMPO_AGOTADO"].includes(e.codigo)) idSolicitud.current = null;
        if (e instanceof ErrorApi && e.codigo === "SOLICITUD_CANCELADA") {
          establecerFase("configuracion");
          return;
        }
        establecerError(mensajeDe(e));
        establecerFase("configuracion");
      }
    },
    [adoptar, idTema, resumen, tituloTema]
  );

  const iniciar = useCallback(async () => {
    if (!sello.current || ocupado) return;
    establecerOcupado(true);
    establecerAviso(null);
    try {
      adoptar(await enFila(() => iniciarPrueba(sello.current as string)));
      establecerFase("ejecutando");
    } catch (e) {
      establecerAviso(mensajeDe(e));
    } finally {
      establecerOcupado(false);
    }
  }, [adoptar, enFila, ocupado]);

  const sincronizar = useCallback(async () => {
    if (!sello.current) return;
    try {
      const r = await enFila(() => sincronizarPrueba(sello.current as string, ultimos.current.respuestas, ultimos.current.descartes));
      if (!vivo.current) return;
      sucia.current = false;
      sello.current = r.sello;
      establecerPrueba((p) => (p ? { ...p, estado: r.prueba.estado } : p));
      establecerTiempo(r.tiempo);
      establecerAviso(null);
      guardarLocal();
      if (r.tiempo.vencida && !entregada.current) void entregarRef.current();
    } catch (e) {
      if (!vivo.current) return;
      if (e instanceof ErrorApi && CODIGOS_PRUEBA_PERDIDA.has(e.codigo)) {
        descartarPrueba();
        establecerError(e.message);
        establecerFase("configuracion");
        return;
      }
      establecerAviso("No pudimos guardar tu progreso en el servidor. Se reintentará; tus respuestas siguen en este dispositivo.");
    }
  }, [descartarPrueba, enFila, guardarLocal]);

  // Guardado local inmediato + sincronización con retardo tras cada cambio.
  useEffect(() => {
    if (fase !== "ejecutando") return;
    guardarLocal();
    sucia.current = true;
    const id = window.setTimeout(() => void sincronizar(), RETARDO_SINCRONIZACION_MS);
    return () => window.clearTimeout(id);
  }, [respuestas, descartes, marcadas, indice, fase, guardarLocal, sincronizar]);

  // Latido: reajusta el reloj con el servidor y reintenta lo pendiente.
  useEffect(() => {
    if (fase !== "ejecutando") return;
    const id = window.setInterval(() => void sincronizar(), LATIDO_MS);
    return () => window.clearInterval(id);
  }, [fase, sincronizar]);

  const pausar = useCallback(async () => {
    if (!sello.current || ocupado) return;
    establecerOcupado(true);
    try {
      const r = await enFila(() => pausarPrueba(sello.current as string, ultimos.current.respuestas, ultimos.current.descartes));
      adoptar(r);
      establecerFase("pausada");
      establecerAviso(null);
    } catch (e) {
      establecerAviso(mensajeDe(e));
    } finally {
      establecerOcupado(false);
    }
  }, [adoptar, enFila, ocupado]);

  const reanudar = useCallback(async () => {
    if (!sello.current || ocupado) return;
    establecerOcupado(true);
    try {
      const r = await enFila(() => reanudarPrueba(sello.current as string));
      adoptar(r);
      establecerFase("ejecutando");
      establecerAviso(null);
    } catch (e) {
      establecerAviso(mensajeDe(e));
    } finally {
      establecerOcupado(false);
    }
  }, [adoptar, enFila, ocupado]);

  const abandonar = useCallback(() => {
    descartarPrueba();
    idSolicitud.current = null;
    establecerAviso(null);
    establecerFase("configuracion");
  }, [descartarPrueba]);

  // --- Interacción con las preguntas -----------------------------------------------------------

  const elegir = useCallback((idPregunta: string, idOpcion: string) => {
    establecerRespuestas((prev) => {
      if (prev[idPregunta] === idOpcion) {
        const { [idPregunta]: _quitada, ...resto } = prev;
        return resto; // tocar la elegida otra vez la deselecciona
      }
      return { ...prev, [idPregunta]: idOpcion };
    });
    // Una alternativa elegida no puede estar descartada.
    establecerDescartes((prev) => {
      const actuales = prev[idPregunta];
      if (!actuales?.includes(idOpcion)) return prev;
      return { ...prev, [idPregunta]: actuales.filter((o) => o !== idOpcion) };
    });
  }, []);

  const alternarDescarte = useCallback((idPregunta: string, idOpcion: string) => {
    establecerRespuestas((prev) => {
      if (prev[idPregunta] !== idOpcion) return prev;
      const { [idPregunta]: _quitada, ...resto } = prev;
      return resto;
    });
    establecerDescartes((prev) => {
      const actuales = prev[idPregunta] ?? [];
      const siguiente = actuales.includes(idOpcion) ? actuales.filter((o) => o !== idOpcion) : actuales.length >= 3 ? actuales : [...actuales, idOpcion];
      const copia = { ...prev };
      if (siguiente.length === 0) delete copia[idPregunta];
      else copia[idPregunta] = siguiente;
      return copia;
    });
  }, []);

  const alternarMarca = useCallback((idPregunta: string) => {
    establecerMarcadas((prev) => (prev.includes(idPregunta) ? prev.filter((i) => i !== idPregunta) : [...prev, idPregunta]));
  }, []);

  return {
    fase,
    prueba,
    tiempo,
    respuestas,
    descartes,
    marcadas,
    indice,
    error,
    aviso,
    ocupado,
    establecerIndice,
    elegir,
    alternarDescarte,
    alternarMarca,
    crear,
    iniciar,
    pausar,
    reanudar,
    entregar,
    abandonar,
    sincronizar,
  };
}
