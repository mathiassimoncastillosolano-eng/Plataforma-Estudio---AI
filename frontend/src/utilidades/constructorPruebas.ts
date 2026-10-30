import type { ResumenGeneral } from "../tipos";
import type { AjustesPrueba, DificultadElegida, DistribucionNiveles, NivelPregunta } from "../tipos/prueba";

// ---------------------------------------------------------------------------
// Lógica pura (sin React) de la configuración de una prueba.
// Es una VISTA PREVIA: el backend recalcula y valida todo antes de generar la prueba.
// Las constantes deben coincidir con `backend/app/pruebas/distribucion.py`.
// ---------------------------------------------------------------------------

export const DIFICULTADES: NivelPregunta[] = ["facil", "media", "dificil"];
export const CANTIDADES_PREGUNTAS = [5, 10, 15, 20, 25] as const;
/** Minutos disponibles. null = sin límite. */
export const OPCIONES_TIEMPO: (number | null)[] = [5, 10, 15, 20, 30, 45, 60, null];

/** Preguntas que sostiene cada tramo de resumen; el backend aplica la misma cota. */
export const CARACTERES_POR_PREGUNTA = 300;
export const MAXIMO_PREGUNTAS = 25;

/** Peso de cada pregunta, en medios puntos para operar siempre con enteros. */
const PESO_EN_MEDIOS_PUNTOS: Record<NivelPregunta, number> = { facil: 1, media: 2, dificil: 4 };
export const PESO_PREGUNTA: Record<NivelPregunta, number> = { facil: 0.5, media: 1, dificil: 2 };

/** Perfiles de dificultad en porcentaje entero. Cada fila suma 100. */
export const PERFILES_DIFICULTAD: Record<NivelPregunta, DistribucionNiveles> = {
  facil: { facil: 75, media: 20, dificil: 5 },
  media: { facil: 20, media: 60, dificil: 20 },
  dificil: { facil: 5, media: 20, dificil: 75 },
};

export const conteosVacios = (): DistribucionNiveles => ({ facil: 0, media: 0, dificil: 0 });
export const sumarConteos = (c: DistribucionNiveles) => c.facil + c.media + c.dificil;

/**
 * Reparte `cantidad` según el perfil con el método del resto mayor.
 * Aritmética entera: la suma es SIEMPRE exactamente `cantidad`.
 */
export function calcularDistribucion(cantidad: number, perfil: NivelPregunta): DistribucionNiveles {
  const porcentajes = PERFILES_DIFICULTAD[perfil];
  const resultado = conteosVacios();
  const restos: { nivel: NivelPregunta; resto: number; porcentaje: number }[] = [];

  for (const nivel of DIFICULTADES) {
    const exactoPor100 = cantidad * porcentajes[nivel];
    resultado[nivel] = Math.floor(exactoPor100 / 100);
    restos.push({ nivel, resto: exactoPor100 % 100, porcentaje: porcentajes[nivel] });
  }

  let faltante = cantidad - sumarConteos(resultado);
  restos.sort((a, b) => b.resto - a.resto || b.porcentaje - a.porcentaje);
  for (let i = 0; faltante > 0; i = (i + 1) % restos.length) {
    resultado[restos[i].nivel] += 1;
    faltante -= 1;
  }
  return resultado;
}

export interface ValidacionPersonalizada {
  valida: boolean;
  suma: number;
  /** Positivo: sobran preguntas. Negativo: faltan. */
  diferencia: number;
  mensaje: string | null;
}

/** La distribución personalizada debe ser de enteros ≥ 0 cuya suma sea exactamente el total. */
export function validarPersonalizada(cantidad: number, valores: DistribucionNiveles): ValidacionPersonalizada {
  const suma = sumarConteos(valores);
  const todosEnteros = DIFICULTADES.every((n) => Number.isInteger(valores[n]) && valores[n] >= 0);
  if (!todosEnteros) {
    return { valida: false, suma, diferencia: suma - cantidad, mensaje: "Cada cantidad debe ser un número entero mayor o igual que cero." };
  }
  if (suma !== cantidad) {
    const diferencia = suma - cantidad;
    const mensaje =
      diferencia < 0
        ? `Faltan ${-diferencia} ${-diferencia === 1 ? "pregunta" : "preguntas"} por repartir: la suma debe ser ${cantidad}.`
        : `Sobran ${diferencia} ${diferencia === 1 ? "pregunta" : "preguntas"}: la suma debe ser ${cantidad}.`;
    return { valida: false, suma, diferencia, mensaje };
  }
  return { valida: true, suma, diferencia: 0, mensaje: null };
}

/** Distribución que tendrá la prueba con estos ajustes (aunque la personalizada sea inválida). */
export function distribucionEfectiva(ajustes: Pick<AjustesPrueba, "cantidad" | "dificultad" | "personalizada">): DistribucionNiveles {
  return ajustes.dificultad === "personalizada" ? { ...ajustes.personalizada } : calcularDistribucion(ajustes.cantidad, ajustes.dificultad);
}

export function puntajeMaximoPara(conteos: DistribucionNiveles): number {
  const medios = DIFICULTADES.reduce((acumulado, nivel) => acumulado + conteos[nivel] * PESO_EN_MEDIOS_PUNTOS[nivel], 0);
  return medios / 2;
}

export function formatearPuntos(valor: number): string {
  const redondeado = Math.round(valor * 10) / 10;
  return Number.isInteger(redondeado) ? String(redondeado) : redondeado.toFixed(1);
}

export function etiquetaTiempo(minutos: number | null): string {
  return minutos === null ? "Sin límite" : `${minutos} min`;
}

/** Segundos por pregunta disponibles; sirve para avisar de tiempos muy ajustados. */
export function segundosPorPregunta(cantidad: number, limiteMinutos: number | null): number | null {
  return limiteMinutos === null || cantidad <= 0 ? null : Math.round((limiteMinutos * 60) / cantidad);
}

export function etiquetaDificultadElegida(dificultad: DificultadElegida): string {
  return { facil: "Fácil", media: "Media", dificil: "Difícil", personalizada: "Personalizada" }[dificultad];
}

// --- Contenido evaluable ---------------------------------------------------------------------

/** Caracteres de texto evaluable del resumen general (estimación; el backend cuenta el texto exacto). */
export function caracteresEvaluables(general: ResumenGeneral): number {
  let total = general.titulo.length + general.introduccion.length;
  for (const s of general.secciones) {
    total += s.titulo.length + s.contenido.length + s.puntos.reduce((n, p) => n + p.length + 3, 0);
    if (s.tabla) total += s.tabla.encabezados.join(" | ").length + s.tabla.filas.reduce((n, f) => n + f.join(" | ").length, 0);
  }
  return total;
}

/** Cuántas preguntas puede sostener el resumen (cota superior). */
export function limitePorContenido(caracteres: number): number {
  return Math.min(MAXIMO_PREGUNTAS, Math.floor(caracteres / CARACTERES_POR_PREGUNTA));
}

export function ajustesPorDefecto(cantidad = 10): AjustesPrueba {
  return {
    cantidad,
    dificultad: "media",
    personalizada: calcularDistribucion(cantidad, "media"),
    limiteMinutos: 15,
    modoAsistido: false,
    pausaBlindada: false,
    cronometroVisible: true,
  };
}
