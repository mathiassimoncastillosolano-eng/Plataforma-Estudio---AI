import type { DificultadPregunta, PreguntaEstudio } from "../tipos";
import { PREGUNTAS_POR_PERIODO } from "./adaptacion";

export const PROPORCION_RONDA = { falladas: 0.6, nuevas: 0.35, acertadas: 0.05 } as const;
/**
 * Una ronda de práctica = un período del motor adaptativo (15). Así cada ronda completa cierra un
 * período y el nivel se actualiza al terminarla, también en un tema nuevo (sin historial).
 */
export const TAMANO_RONDA = PREGUNTAS_POR_PERIODO;
const MINIMO_TAMANO_PARA_ACERTADAS = 4;
const UMBRAL_MEDIA = 0.5;
const UMBRAL_DIFICIL = 0.8;

export interface HistorialPregunta {
  aciertos: number;
  errores: number;
  ultimo: "ok" | "fallo";
}

export type HistorialPreguntas = Record<string, HistorialPregunta>;

export interface Reparto {
  falladas: number;
  nuevas: number;
  acertadas: number;
}

export type Proporcion = Reparto;

export function registrarResultado(historial: HistorialPreguntas, id: string, correcta: boolean): HistorialPreguntas {
  const previo = historial[id] ?? { aciertos: 0, errores: 0, ultimo: "ok" as const };
  return {
    ...historial,
    [id]: {
      aciertos: previo.aciertos + (correcta ? 1 : 0),
      errores: previo.errores + (correcta ? 0 : 1),
      ultimo: correcta ? "ok" : "fallo",
    },
  };
}

export function dificultadSegunNivel(nivel: number | undefined): DificultadPregunta {
  if (nivel === undefined || !Number.isFinite(nivel)) return "media";
  if (nivel >= UMBRAL_DIFICIL) return "dificil";
  if (nivel >= UMBRAL_MEDIA) return "media";
  return "facil";
}

function cuotasExactas(total: number, proporcion: Proporcion): Reparto {
  const claves = ["falladas", "nuevas", "acertadas"] as const;
  const base: Reparto = { falladas: 0, nuevas: 0, acertadas: 0 };
  const fracciones: { clave: (typeof claves)[number]; resto: number }[] = [];
  let asignadas = 0;
  for (const clave of claves) {
    const exacta = total * proporcion[clave];
    base[clave] = Math.floor(exacta);
    asignadas += base[clave];
    fracciones.push({ clave, resto: exacta - base[clave] });
  }
  fracciones.sort((a, b) => b.resto - a.resto);
  for (let i = 0; asignadas < total && i < fracciones.length; i += 1) {
    base[fracciones[i].clave] += 1;
    asignadas += 1;
  }
  return base;
}

export function repartoRonda(total: number, disponibles: Reparto, proporcion: Proporcion = PROPORCION_RONDA): Reparto {
  const objetivo = Math.max(0, Math.floor(total));
  const cuotas = cuotasExactas(objetivo, proporcion);

  if (proporcion.acertadas > 0 && cuotas.acertadas === 0 && disponibles.acertadas > 0 && objetivo >= MINIMO_TAMANO_PARA_ACERTADAS) {
    cuotas.acertadas = 1;
    if (cuotas.nuevas > 0) cuotas.nuevas -= 1;
    else cuotas.falladas -= 1;
  }

  const reparto: Reparto = {
    falladas: Math.min(cuotas.falladas, disponibles.falladas),
    nuevas: Math.min(cuotas.nuevas, disponibles.nuevas),
    acertadas: Math.min(cuotas.acertadas, disponibles.acertadas),
  };

  let faltan = objetivo - (reparto.falladas + reparto.nuevas + reparto.acertadas);
  for (const clave of ["nuevas", "falladas", "acertadas"] as const) {
    const extra = Math.min(faltan, disponibles[clave] - reparto[clave]);
    reparto[clave] += extra;
    faltan -= extra;
  }
  return reparto;
}

function clasificar(banco: PreguntaEstudio[], historial: HistorialPreguntas) {
  const falladas = banco.filter((p) => historial[p.id]?.ultimo === "fallo").sort((a, b) => historial[b.id].errores - historial[a.id].errores);
  const acertadas = banco.filter((p) => historial[p.id]?.ultimo === "ok");
  return { falladas, acertadas };
}

export function cantidadNuevasNecesarias(total: number, banco: PreguntaEstudio[], historial: HistorialPreguntas, proporcion: Proporcion = PROPORCION_RONDA): number {
  const { falladas, acertadas } = clasificar(banco, historial);
  return repartoRonda(total, { falladas: falladas.length, nuevas: Number.POSITIVE_INFINITY, acertadas: acertadas.length }, proporcion).nuevas;
}

function mezclar<T>(elementos: T[], azar: () => number): T[] {
  const copia = [...elementos];
  for (let i = copia.length - 1; i > 0; i -= 1) {
    const j = Math.floor(azar() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

const clave = (p: PreguntaEstudio) => p.enunciado.trim().toLowerCase();

export interface EntradaRonda {
  banco: PreguntaEstudio[];
  historial: HistorialPreguntas;
  nuevas: PreguntaEstudio[];
  total: number;
  proporcion?: Proporcion;
  azar?: () => number;
}

export function componerRonda({ banco, historial, nuevas, total, proporcion = PROPORCION_RONDA, azar = Math.random }: EntradaRonda): PreguntaEstudio[] {
  const { falladas, acertadas } = clasificar(banco, historial);
  const vistos = new Set(banco.map(clave));
  const ids = new Set(banco.map((p) => p.id));
  const inedito = nuevas.filter((p) => {
    if (ids.has(p.id) || vistos.has(clave(p))) return false;
    vistos.add(clave(p));
    return true;
  });
  const reparto = repartoRonda(total, { falladas: falladas.length, nuevas: inedito.length, acertadas: acertadas.length }, proporcion);
  const elegidas = [...falladas.slice(0, reparto.falladas), ...inedito.slice(0, reparto.nuevas), ...mezclar(acertadas, azar).slice(0, reparto.acertadas)];
  return mezclar(elegidas, azar);
}

export function rondaCompleta(preguntas: PreguntaEstudio[], respondidas: (id: string) => boolean): boolean {
  return preguntas.length > 0 && preguntas.every((p) => respondidas(p.id));
}
