// Configuración pública del frontend. Todo lo que hay aquí termina en el
// bundle del navegador: jamás debe contener secretos (API Keys, tokens...).

export const URL_BASE_API = (import.meta.env.VITE_URL_BASE_API ?? "http://localhost:8000").replace(/\/+$/, "");

/** Tiempo máximo de espera de una petición de IA (el backend tiene su propio límite, menor). */
export const TIEMPO_ESPERA_IA_MS = 120_000;

/** Tiempo máximo de espera al extraer el texto de un PDF. */
export const TIEMPO_ESPERA_PDF_MS = 60_000;

/** Deben coincidir con RESUMEN_MIN_CARACTERES / RESUMEN_MAX_CARACTERES del backend (que valida igualmente). */
export const LIMITES_RESUMEN = { min: 100, max: 20_000 } as const;

/** Debe coincidir con PDF_MAX_BYTES del backend (que valida igualmente). */
export const LIMITE_BYTES_PDF = 10 * 1024 * 1024;
