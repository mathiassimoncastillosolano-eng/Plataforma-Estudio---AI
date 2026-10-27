import { useSyncExternalStore } from "react";
import type { ResumenesGenerados } from "../tipos";
import type { TipoActividad } from "../datos/actividades";

// -----------------------------------------------------------------------
// Estado de la sesión de estudio, SOLO en memoria.
// Contenido introducido, resúmenes generados y actividad viven mientras la
// pestaña esté abierta; al recargar o cerrar, desaparecen. No hay base de
// datos ni localStorage aquí, a propósito.
// -----------------------------------------------------------------------

export interface ActividadSesion {
  id: string;
  tipo: TipoActividad;
  idTema: string;
  tituloTema: string;
  descripcion: string;
  at: number;
}

interface EstadoSesion {
  iniciadoEn: number;
  /** Último contenido escrito por el usuario para cada tema. */
  fuentes: Record<string, string>;
  /** PDF original de cada tema (solo en memoria; se envía a la IA tal cual para generar el resumen). */
  archivos: Record<string, File>;
  resumenes: Record<string, ResumenesGenerados>;
  actividad: ActividadSesion[];
}

let estadoGlobal: EstadoSesion = { iniciadoEn: Date.now(), fuentes: {}, archivos: {}, resumenes: {}, actividad: [] };
const oyentes = new Set<() => void>();
let siguienteId = 1;

function actualizar(siguiente: Partial<EstadoSesion>) {
  estadoGlobal = { ...estadoGlobal, ...siguiente };
  oyentes.forEach((oyente) => oyente());
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export function useSesion<T>(selector: (s: EstadoSesion) => T): T {
  return useSyncExternalStore(suscribir, () => selector(estadoGlobal));
}

export function obtenerSesion(): EstadoSesion {
  return estadoGlobal;
}

/** Olvida todo el contenido de estudio de la sesión (al cerrar sesión o cambiar de cuenta). */
export function reiniciarSesionEstudio() {
  actualizar({ iniciadoEn: Date.now(), fuentes: {}, archivos: {}, resumenes: {}, actividad: [] });
}

export function establecerFuenteTema(idTema: string, contenido: string) {
  actualizar({ fuentes: { ...estadoGlobal.fuentes, [idTema]: contenido } });
}

export function establecerArchivoTema(idTema: string, archivo: File | null) {
  const { [idTema]: _anterior, ...resto } = estadoGlobal.archivos;
  actualizar({ archivos: archivo ? { ...resto, [idTema]: archivo } : resto });
}

/** Olvida el contenido, el PDF y los resúmenes de la sesión asociados a un tema eliminado. */
export function eliminarDatosTema(idTema: string) {
  const sinClave = <T,>(registro: Record<string, T>) => Object.fromEntries(Object.entries(registro).filter(([clave]) => clave !== idTema));
  actualizar({
    fuentes: sinClave(estadoGlobal.fuentes),
    archivos: sinClave(estadoGlobal.archivos),
    resumenes: sinClave(estadoGlobal.resumenes),
  });
}

export function registrarActividad(entrada: Omit<ActividadSesion, "id" | "at">) {
  const elemento: ActividadSesion = { ...entrada, id: `act-${siguienteId++}`, at: Date.now() };
  actualizar({ actividad: [elemento, ...estadoGlobal.actividad].slice(0, 50) });
}

export function guardarResumenes(idTema: string, tituloTema: string, resultado: ResumenesGenerados) {
  actualizar({ resumenes: { ...estadoGlobal.resumenes, [idTema]: resultado } });
  registrarActividad({ tipo: "resumen", idTema, tituloTema, descripcion: "Generaste el resumen general y el esencial." });
}
