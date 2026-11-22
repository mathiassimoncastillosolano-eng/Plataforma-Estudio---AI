import type { EventoBuddy } from "./tipos";

export type EstadoInvitacion = "pendiente" | "aceptada" | "rechazada";
export type EstadoGuia = "completada" | "omitida";

export interface BuddyPersistido {
  invitacion: EstadoInvitacion;
  guias: Record<string, EstadoGuia>;
  vistos: Record<string, number>;
}

export interface TutorialPersistido {
  guiaId: string;
  indice: number;
  temaId: string | null;
}

const PREFIJO = "cursa.buddy.";
const MAX_VISTOS = 150;

export const buddyInicial: BuddyPersistido = { invitacion: "pendiente", guias: {}, vistos: {} };

const esObjeto = (valor: unknown): valor is Record<string, unknown> => typeof valor === "object" && valor !== null && !Array.isArray(valor);

function almacen(tipo: "local" | "sesion"): Storage | null {
  try {
    const candidato = tipo === "local" ? window.localStorage : window.sessionStorage;
    return candidato ?? null;
  } catch {
    return null;
  }
}

function sanear(bruto: unknown): BuddyPersistido {
  if (!esObjeto(bruto)) return buddyInicial;
  const invitacion: EstadoInvitacion = bruto.invitacion === "aceptada" || bruto.invitacion === "rechazada" ? bruto.invitacion : "pendiente";
  const guias: Record<string, EstadoGuia> = {};
  if (esObjeto(bruto.guias)) {
    for (const [clave, valor] of Object.entries(bruto.guias)) {
      if (valor === "completada" || valor === "omitida") guias[clave] = valor;
    }
  }
  const vistos: Record<string, number> = {};
  if (esObjeto(bruto.vistos)) {
    for (const [clave, valor] of Object.entries(bruto.vistos)) {
      if (typeof valor === "number" && Number.isFinite(valor)) vistos[clave] = valor;
    }
  }
  return { invitacion, guias, vistos };
}

export function leerBuddy(usuarioId: string): BuddyPersistido {
  const a = almacen("local");
  if (!a) return buddyInicial;
  try {
    const bruto = a.getItem(`${PREFIJO}${usuarioId}`);
    return bruto ? sanear(JSON.parse(bruto)) : buddyInicial;
  } catch {
    return buddyInicial;
  }
}

export function guardarBuddy(usuarioId: string, estado: BuddyPersistido): void {
  const a = almacen("local");
  if (!a) return;
  try {
    a.setItem(`${PREFIJO}${usuarioId}`, JSON.stringify(estado));
  } catch {
    return;
  }
}

export function marcarVisto(estado: BuddyPersistido, id: string, ahora: number): BuddyPersistido {
  const entradas = Object.entries({ ...estado.vistos, [id]: ahora }).sort((a, b) => b[1] - a[1]).slice(0, MAX_VISTOS);
  return { ...estado, vistos: Object.fromEntries(entradas) };
}

export function puedeMostrarse(estado: BuddyPersistido, evento: Pick<EventoBuddy, "id" | "enfriamientoMs">, ahora: number): boolean {
  if (evento.enfriamientoMs === undefined) return true;
  const ultimo = estado.vistos[evento.id];
  if (ultimo === undefined) return true;
  return ahora - ultimo >= evento.enfriamientoMs;
}

export function leerTutorial(usuarioId: string): TutorialPersistido | null {
  const a = almacen("sesion");
  if (!a) return null;
  try {
    const bruto = a.getItem(`${PREFIJO}tutorial.${usuarioId}`);
    if (!bruto) return null;
    const dato = JSON.parse(bruto) as unknown;
    if (!esObjeto(dato) || typeof dato.guiaId !== "string" || typeof dato.indice !== "number") return null;
    return { guiaId: dato.guiaId, indice: Math.max(0, Math.floor(dato.indice)), temaId: typeof dato.temaId === "string" ? dato.temaId : null };
  } catch {
    return null;
  }
}

export function guardarTutorial(usuarioId: string, tutorial: TutorialPersistido): void {
  try {
    almacen("sesion")?.setItem(`${PREFIJO}tutorial.${usuarioId}`, JSON.stringify(tutorial));
  } catch {
    return;
  }
}

export function borrarTutorial(usuarioId: string): void {
  try {
    almacen("sesion")?.removeItem(`${PREFIJO}tutorial.${usuarioId}`);
  } catch {
    return;
  }
}
