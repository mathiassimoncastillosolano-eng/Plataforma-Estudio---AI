import type { ConteosDificultad, ConfiguracionPrueba, DificultadPrueba, DificultadPregunta, PreguntaEstudio } from "../tipos";

// ---------------------------------------------------------------------------
// Lógica pura (sin React) del sistema de pruebas.
// Todo lo que decide la composición y el puntaje de una prueba vive aquí para
// que sea fácil de probar y de reemplazar por una API real más adelante.
// ---------------------------------------------------------------------------

export const DIFICULTADES: DificultadPregunta[] = ["facil", "media", "dificil"];
export const CANTIDADES_PREGUNTAS = [10, 15, 20, 25] as const;
/** Minutos disponibles. null = sin límite. */
export const OPCIONES_TIEMPO: (number | null)[] = [5, 10, 15, 20, 30, null];

/** Peso de cada pregunta, en medios puntos para operar siempre con enteros. */
const PESO_EN_MEDIOS_PUNTOS: Record<DificultadPregunta, number> = { facil: 1, media: 2, dificil: 4 };
export const PESO_PREGUNTA: Record<DificultadPregunta, number> = { facil: 0.5, media: 1, dificil: 2 };

/** Perfiles de dificultad en porcentaje entero. Cada fila suma 100. */
export const PERFILES_DIFICULTAD: Record<DificultadPrueba, Record<DificultadPregunta, number>> = {
  facil: { facil: 75, media: 20, dificil: 5 },
  media: { facil: 20, media: 60, dificil: 20 },
  dificil: { facil: 5, media: 20, dificil: 75 },
};

export const conteosVacios = (): ConteosDificultad => ({ facil: 0, media: 0, dificil: 0 });
export const sumarConteos = (c: ConteosDificultad) => c.facil + c.media + c.dificil;

/**
 * Reparte `count` preguntas según el perfil con el método del resto mayor.
 * Aritmética entera: la suma es SIEMPRE exactamente `count`.
 * En empate de restos gana el nivel con mayor porcentaje en el perfil.
 */
export function calcularDistribucion(cantidad: number, dificultad: DificultadPrueba): ConteosDificultad {
  const perfil = PERFILES_DIFICULTAD[dificultad];
  const resultado = conteosVacios();
  const residuos: { nivel: DificultadPregunta; resto: number; porcentaje: number }[] = [];

  for (const nivel of DIFICULTADES) {
    const exactoPor100 = cantidad * perfil[nivel];
    resultado[nivel] = Math.floor(exactoPor100 / 100);
    residuos.push({ nivel, resto: exactoPor100 % 100, porcentaje: perfil[nivel] });
  }

  let faltante = cantidad - sumarConteos(resultado);
  residuos.sort((a, b) => b.resto - a.resto || b.porcentaje - a.porcentaje);
  for (let i = 0; faltante > 0; i = (i + 1) % residuos.length) {
    resultado[residuos[i].nivel] += 1;
    faltante -= 1;
  }
  return resultado;
}

export function contarPorDificultad(reserva: PreguntaEstudio[]): ConteosDificultad {
  const conteos = conteosVacios();
  for (const q of reserva) conteos[q.dificultad] += 1;
  return conteos;
}

export function puntajeMaximoPara(conteos: ConteosDificultad): number {
  const mitad = DIFICULTADES.reduce((acumulado, nivel) => acumulado + conteos[nivel] * PESO_EN_MEDIOS_PUNTOS[nivel], 0);
  return mitad / 2;
}

export function puntosPara(nivel: DificultadPregunta): number {
  return PESO_PREGUNTA[nivel];
}

export function formatearPuntos(valor: number): string {
  return Number.isInteger(valor) ? String(valor) : valor.toFixed(1);
}

export interface PlanPrueba {
  /** Composición ideal según el perfil. */
  objetivo: ConteosDificultad;
  /** Composición real que el banco puede entregar (suma = count si es factible). */
  actual: ConteosDificultad;
  /** true si `actual` difiere de `target` por falta de preguntas de algún nivel. */
  ajustado: boolean;
  /** false si el banco no alcanza para `count` preguntas. */
  factible: boolean;
  disponibles: number;
  puntajeMaximo: number;
}

/**
 * Calcula, sin azar, qué composición se puede construir con el banco disponible.
 * Si falta de un nivel, el faltante se cubre con el nivel más afín al perfil
 * elegido. Nunca devuelve una prueba con menos preguntas de las pedidas:
 * si el banco total no alcanza, `feasible` es false.
 */
export function planificarPrueba(disponibles: ConteosDificultad, cantidad: number, dificultad: DificultadPrueba): PlanPrueba {
  const objetivo = calcularDistribucion(cantidad, dificultad);
  const total = sumarConteos(disponibles);
  const actual: ConteosDificultad = {
    facil: Math.min(objetivo.facil, disponibles.facil),
    media: Math.min(objetivo.media, disponibles.media),
    dificil: Math.min(objetivo.dificil, disponibles.dificil),
  };

  if (total < cantidad) {
    return { objetivo, actual, ajustado: false, factible: false, disponibles: total, puntajeMaximo: puntajeMaximoPara(objetivo) };
  }

  const perfil = PERFILES_DIFICULTAD[dificultad];
  const prioridad = [...DIFICULTADES].sort((a, b) => perfil[b] - perfil[a]);
  let faltante = cantidad - sumarConteos(actual);
  while (faltante > 0) {
    const nivel = prioridad.find((l) => actual[l] < disponibles[l]);
    if (!nivel) break; // no debería ocurrir: total >= count
    actual[nivel] += 1;
    faltante -= 1;
  }

  const ajustado = DIFICULTADES.some((l) => actual[l] !== objetivo[l]);
  return { objetivo, actual, ajustado, factible: true, disponibles: total, puntajeMaximo: puntajeMaximoPara(actual) };
}

function mezclar<T>(elementos: T[], generadorAleatorio: () => number): T[] {
  const textos = [...elementos];
  for (let i = textos.length - 1; i > 0; i--) {
    const j = Math.floor(generadorAleatorio() * (i + 1));
    [textos[i], textos[j]] = [textos[j], textos[i]];
  }
  return textos;
}

export interface PruebaConstruida {
  preguntas: PreguntaEstudio[];
  plan: PlanPrueba;
}

/** Construye la prueba real. Devuelve null si el banco no alcanza. */
export function construirPrueba(reserva: PreguntaEstudio[], configuracion: ConfiguracionPrueba, generadorAleatorio: () => number = Math.random): PruebaConstruida | null {
  const plan = planificarPrueba(contarPorDificultad(reserva), configuracion.cantidadPreguntas, configuracion.dificultad);
  if (!plan.factible) return null;

  const elegida: PreguntaEstudio[] = [];
  for (const nivel of DIFICULTADES) {
    const grupo = mezclar(
      reserva.filter((q) => q.dificultad === nivel),
      generadorAleatorio
    );
    elegida.push(...grupo.slice(0, plan.actual[nivel]));
  }
  return { preguntas: mezclar(elegida, generadorAleatorio), plan };
}

/** Segundos por pregunta disponibles; sirve para avisar de tiempos muy ajustados. */
export function segundosPorPregunta(configuracion: Pick<ConfiguracionPrueba, "cantidadPreguntas" | "limiteTiempoMinutos">): number | null {
  if (configuracion.limiteTiempoMinutos === null) return null;
  return Math.round((configuracion.limiteTiempoMinutos * 60) / configuracion.cantidadPreguntas);
}

export function etiquetaTiempo(minutos: number | null): string {
  return minutos === null ? "Sin límite" : `${minutos} min`;
}
