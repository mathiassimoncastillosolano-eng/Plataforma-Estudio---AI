import { useSyncExternalStore } from "react";
import type { MapaMental, ResumenesGenerados } from "../tipos";
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

/** Mapa conceptual generado y la huella de la fuente con la que se generó (si la fuente cambia, deja de valer). */
export interface MapaGuardado {
  mapa: MapaMental;
  huella: string;
}

interface EstadoSesion {
  iniciadoEn: number;
  /** Último contenido escrito por el usuario para cada tema. */
  fuentes: Record<string, string>;
  /** PDF original de cada tema (solo en memoria; se envía a la IA tal cual para generar el resumen). */
  archivos: Record<string, File>;
  resumenes: Record<string, ResumenesGenerados>;
  mapas: Record<string, MapaGuardado>;
  actividad: ActividadSesion[];
}

let estadoGlobal: EstadoSesion = { iniciadoEn: Date.now(), fuentes: {}, archivos: {}, resumenes: {}, mapas: {}, actividad: [] };
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
  actualizar({ iniciadoEn: Date.now(), fuentes: {}, archivos: {}, resumenes: {}, mapas: {}, actividad: [] });
}

export function establecerFuenteTema(idTema: string, contenido: string) {
  actualizar({ fuentes: { ...estadoGlobal.fuentes, [idTema]: contenido } });
}

export function establecerArchivoTema(idTema: string, archivo: File | null) {
  const { [idTema]: _anterior, ...resto } = estadoGlobal.archivos;
  actualizar({ archivos: archivo ? { ...resto, [idTema]: archivo } : resto });
}

/** Olvida el contenido, el PDF, los resúmenes y el mapa conceptual de la sesión asociados a un tema eliminado. */
export function eliminarDatosTema(idTema: string) {
  const sinClave = <T,>(registro: Record<string, T>) => Object.fromEntries(Object.entries(registro).filter(([clave]) => clave !== idTema));
  actualizar({
    fuentes: sinClave(estadoGlobal.fuentes),
    archivos: sinClave(estadoGlobal.archivos),
    resumenes: sinClave(estadoGlobal.resumenes),
    mapas: sinClave(estadoGlobal.mapas),
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

/** Guarda el mapa conceptual generado con IA para un tema (solo en memoria, como los resúmenes). */
export function guardarMapa(idTema: string, mapa: MapaMental, huella: string) {
  actualizar({ mapas: { ...estadoGlobal.mapas, [idTema]: { mapa, huella } } });
}
