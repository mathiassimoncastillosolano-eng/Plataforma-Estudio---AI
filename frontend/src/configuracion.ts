// Configuración pública del frontend. Todo lo que hay aquí termina en el
// bundle del navegador: jamás debe contener secretos (API Keys, tokens...).

export const URL_BASE_API = (import.meta.env.VITE_URL_BASE_API ?? "http://localhost:8000").replace(/\/+$/, "");

/** Tiempo máximo de espera de una petición de IA (el backend tiene su propio límite, menor). */
export const TIEMPO_ESPERA_IA_MS = 120_000;

/** Tiempo máximo de espera al extraer el texto de un PDF. */
export const TIEMPO_ESPERA_PDF_MS = 60_000;

/** Analizar un PDF completo (con sus elementos visuales) tarda más que un texto corto. */
export const TIEMPO_ESPERA_PDF_IA_MS = 240_000;

/** Dar formato al PDF descargable es local y rápido; no llama a la IA. */
export const TIEMPO_ESPERA_DESCARGA_MS = 60_000;

/** Deben coincidir con RESUMEN_MIN_CARACTERES / RESUMEN_MAX_CARACTERES del backend (que valida igualmente). */
export const LIMITES_RESUMEN = { min: 100, max: 20_000 } as const;

/** Debe coincidir con PDF_MAX_BYTES del backend (que valida igualmente). */
export const LIMITE_BYTES_PDF = 10 * 1024 * 1024;

/**
 * ID de cliente OAuth de Google (tipo "Aplicación web"). Es un dato PÚBLICO: no es un secreto.
 * Vacío = el acceso con Google no está configurado y el login lo indica.
 */
export const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "").trim();

/**
 * Comprobación de disponibilidad del backend (pantalla de inicialización).
 * Render en plan gratuito suspende el servicio por inactividad: la primera petición puede
 * tardar cerca de un minuto, así que se reintenta con pausas crecientes hasta un límite total.
 */
export const SALUD_RUTA = "/api/salud";
/** Espera máxima de cada intento (un servicio dormido puede dejar la petición colgada). */
export const SALUD_TIEMPO_INTENTO_MS = 15_000;
/** Pausas entre intentos; la última se repite. */
export const SALUD_PAUSAS_MS = [1_000, 2_000, 3_000, 4_000, 5_000] as const;
/** Tiempo total antes de mostrar el error con el botón de reintento. */
export const SALUD_TIEMPO_TOTAL_MS = 150_000;
/** A partir de aquí se explica al usuario que el servidor estaba en reposo. */
export const SALUD_UMBRAL_DESPERTAR_MS = 6_000;

/** En producción, una URL local casi seguro es una variable de Vercel sin configurar. */
export const URL_API_LOCAL_EN_PRODUCCION =
  import.meta.env.PROD &&
  /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(URL_BASE_API) &&
  !["localhost", "127.0.0.1"].includes(window.location.hostname);
