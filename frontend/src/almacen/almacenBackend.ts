import { useSyncExternalStore } from "react";
import { SALUD_PAUSAS_MS, SALUD_RUTA, SALUD_TIEMPO_INTENTO_MS, SALUD_TIEMPO_TOTAL_MS, URL_API_LOCAL_EN_PRODUCCION, URL_BASE_API } from "../configuracion";

// -----------------------------------------------------------------------
// Disponibilidad del backend (Render puede estar suspendido por inactividad).
// Se comprueba ANTES del login, en cuanto se abre la aplicación, con reintentos y
// pausas crecientes. Vive fuera de React para que la petición empiece al cargar el
// módulo y para que StrictMode no duplique las solicitudes.
//
// OJO: GET /api/salud solo confirma que el servidor HTTP está levantado y la
// aplicación lista. No comprueba que OpenAI esté disponible (no hace falta
// consumir cuota ni añadir latencia para saberlo).
// -----------------------------------------------------------------------

export type FaseBackend =
  /** Primera petición en curso. */
  | "solicitando"
  /** Al menos un intento sin respuesta: el servicio probablemente está arrancando. */
  | "despertando"
  | "listo"
  | "error";

export type MotivoErrorBackend = "tiempo" | "configuracion";

export interface EstadoBackend {
  fase: FaseBackend;
  /** Intentos realizados (se muestra al usuario; no es un porcentaje de progreso). */
  intentos: number;
  /** Marca de tiempo (ms) del inicio de la comprobación actual. */
  inicio: number;
  motivoError?: MotivoErrorBackend;
}

export interface DependenciasAlmacen {
  fetchFn: typeof fetch;
  ahora: () => number;
  esperar: (ms: number) => Promise<void>;
  urlBase: string;
  urlLocalEnProduccion: boolean;
  tiempoIntentoMs: number;
  tiempoTotalMs: number;
  pausasMs: readonly number[];
}

const dependenciasPorDefecto = (): DependenciasAlmacen => ({
  fetchFn: (...argumentos) => fetch(...argumentos),
  ahora: () => Date.now(),
  esperar: (ms) => new Promise((resolver) => window.setTimeout(resolver, ms)),
  urlBase: URL_BASE_API,
  urlLocalEnProduccion: URL_API_LOCAL_EN_PRODUCCION,
  tiempoIntentoMs: SALUD_TIEMPO_INTENTO_MS,
  tiempoTotalMs: SALUD_TIEMPO_TOTAL_MS,
  pausasMs: SALUD_PAUSAS_MS,
});

export function crearAlmacenBackend(sustituciones: Partial<DependenciasAlmacen> = {}) {
  const deps = { ...dependenciasPorDefecto(), ...sustituciones };
  const oyentes = new Set<() => void>();
  let estado: EstadoBackend = { fase: "solicitando", intentos: 0, inicio: deps.ahora() };
  let ronda = 0; // invalida bucles anteriores cuando se reintenta
  let iniciado = false;

  function publicar(siguiente: EstadoBackend) {
    estado = siguiente;
    oyentes.forEach((oyente) => oyente());
  }

  /** Un intento: solo cuenta como éxito un 200 con `estado: "ok"`. Cualquier otra cosa = "todavía no". */
  async function intentarUnaVez(): Promise<boolean> {
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), deps.tiempoIntentoMs);
    try {
      const respuesta = await deps.fetchFn(`${deps.urlBase}${SALUD_RUTA}`, { signal: controlador.signal, cache: "no-store" });
      if (!respuesta.ok) return false; // 502/503 del proxy mientras Render arranca
      const cuerpo = (await respuesta.json()) as { estado?: string } | null;
      return cuerpo?.estado === "ok";
    } catch {
      return false; // red caída, CORS del proxy de arranque, timeout…
    } finally {
      clearTimeout(temporizador);
    }
  }

  async function comprobar(miRonda: number) {
    const inicio = deps.ahora();
    publicar({ fase: "solicitando", intentos: 0, inicio });

    if (deps.urlLocalEnProduccion) {
      publicar({ fase: "error", intentos: 0, inicio, motivoError: "configuracion" });
      return;
    }

    let intentos = 0;
    while (miRonda === ronda) {
      intentos += 1;
      const correcto = await intentarUnaVez();
      if (miRonda !== ronda) return;
      if (correcto) {
        publicar({ fase: "listo", intentos, inicio });
        return;
      }
      if (deps.ahora() - inicio >= deps.tiempoTotalMs) {
        publicar({ fase: "error", intentos, inicio, motivoError: "tiempo" });
        return;
      }
      publicar({ fase: "despertando", intentos, inicio });
      await deps.esperar(deps.pausasMs[Math.min(intentos - 1, deps.pausasMs.length - 1)]);
    }
  }

  return {
    /** Empieza la comprobación (idempotente: StrictMode o varios montajes no duplican peticiones). */
    iniciar() {
      if (iniciado) return;
      iniciado = true;
      void comprobar(++ronda);
    },
    /** Reintento manual tras un error: vuelve a empezar desde cero. */
    reintentar() {
      iniciado = true;
      void comprobar(++ronda);
    },
    obtenerEstado: () => estado,
    suscribir(oyente: () => void) {
      oyentes.add(oyente);
      return () => oyentes.delete(oyente);
    },
  };
}

export const almacenBackend = crearAlmacenBackend();

export function useEstadoBackend(): EstadoBackend {
  return useSyncExternalStore(almacenBackend.suscribir, almacenBackend.obtenerEstado);
}
