// Reglas visuales del reloj de la prueba. El tiempo real lo decide el servidor; esto solo lo presenta.

/**
 * Alerta de tiempo: el contador numérico vuelve a mostrarse (en rojo, con texto) cuando queda
 * el menor de 10 minutos o el 25 % de la duración, con un mínimo de 60 s.
 *   60 min → 10:00 · 30 min → 7:30 · 20 min → 5:00 · 15 min → 3:45 · 10 min → 2:30 · 5 min → 1:15
 * Sin límite no hay alerta.
 */
export function umbralAlertaSegundos(limiteSegundos: number | null): number | null {
  if (limiteSegundos === null) return null;
  return Math.max(60, Math.min(600, Math.round(limiteSegundos * 0.25)));
}

export function formatearReloj(segundos: number): string {
  const total = Math.max(0, Math.ceil(segundos));
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = total % 60;
  const mm = String(horas > 0 ? minutos : minutos).padStart(2, "0");
  const ss = String(resto).padStart(2, "0");
  return horas > 0 ? `${horas}:${mm}:${ss}` : `${mm}:${ss}`;
}

export interface VistaReloj {
  /** El contador numérico se ve (visible por elección o forzado por la alerta). */
  mostrarNumero: boolean;
  alerta: boolean;
  /** Proporción de tiempo restante (1 → 0) para la barra. */
  proporcion: number;
}

export function vistaReloj(restante: number | null, limiteSegundos: number | null, cronometroVisible: boolean): VistaReloj {
  if (restante === null || limiteSegundos === null) return { mostrarNumero: cronometroVisible, alerta: false, proporcion: 1 };
  const umbral = umbralAlertaSegundos(limiteSegundos) ?? 0;
  const alerta = restante <= umbral;
  return {
    mostrarNumero: cronometroVisible || alerta,
    alerta,
    proporcion: Math.min(1, Math.max(0, restante / limiteSegundos)),
  };
}

/** Texto para lectores de pantalla: «5 minutos y 30 segundos». */
export function describirTiempo(segundos: number): string {
  const total = Math.max(0, Math.ceil(segundos));
  const m = Math.floor(total / 60);
  const s = total % 60;
  const partes = [];
  if (m > 0) partes.push(`${m} ${m === 1 ? "minuto" : "minutos"}`);
  if (s > 0 || partes.length === 0) partes.push(`${s} ${s === 1 ? "segundo" : "segundos"}`);
  return partes.join(" y ");
}
