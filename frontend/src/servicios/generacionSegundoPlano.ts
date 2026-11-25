import type { MapaMental } from "../tipos";
import { guardarMapa, obtenerSesion } from "../almacen/almacenSesion";
import { crearRegistroTareas } from "../utilidades/registroTareas";
import { generarMapaConceptual, generarMapaConceptualDesdePdf } from "./servicioMapaConceptual";
import { limpiarPreguntasEnMemoria, obtenerPreguntasDelTema, puedeGenerarConIa } from "./servicioPreguntas";

export interface FuenteMapa {
  idTema: string;
  titulo: string;
  esPdf: boolean;
}

const mapas = crearRegistroTareas<MapaMental>();
const revelados = new Set<string>();

export function huellaFuente(esPdf: boolean, texto: string | undefined, archivo: File | null): string | null {
  if (esPdf) return archivo ? `pdf:${archivo.name}:${archivo.size}:${archivo.lastModified}` : null;
  const limpio = texto?.trim();
  return limpio ? `texto:${limpio}` : null;
}

function huellaActual(fuente: FuenteMapa): string | null {
  const { fuentes, archivos } = obtenerSesion();
  return huellaFuente(fuente.esPdf, fuentes[fuente.idTema], archivos[fuente.idTema] ?? null);
}

export function mapaEnCurso(idTema: string, huella: string): Promise<MapaMental> | undefined {
  return mapas.enCurso(idTema, huella);
}

export function solicitarMapa(fuente: FuenteMapa, huella: string, texto: string, archivo: File | null, forzar = false): Promise<MapaMental> {
  const guardado = obtenerSesion().mapas[fuente.idTema];
  if (!forzar && guardado && guardado.huella === huella) return Promise.resolve(guardado.mapa);
  if (forzar) mapas.cancelar(fuente.idTema);
  return mapas.iniciar(
    fuente.idTema,
    huella,
    (senal) =>
      fuente.esPdf && archivo
        ? generarMapaConceptualDesdePdf(fuente.idTema, archivo, fuente.titulo, senal)
        : generarMapaConceptual(fuente.idTema, texto, fuente.titulo, senal),
    (mapa) => {
      if (huellaActual(fuente) === huella) guardarMapa(fuente.idTema, mapa, huella);
    }
  );
}

export function precargarMapa(fuente: FuenteMapa, texto: string, archivo: File | null): void {
  const huella = huellaFuente(fuente.esPdf, texto, archivo);
  if (!huella) return;
  solicitarMapa(fuente, huella, texto, archivo).catch(() => undefined);
}

export function precargarPreguntas(idTema: string, titulo: string): void {
  limpiarPreguntasEnMemoria(idTema);
  if (!puedeGenerarConIa(idTema)) return;
  obtenerPreguntasDelTema(idTema, titulo).catch(() => undefined);
}

export function cancelarGeneraciones(idTema: string): void {
  mapas.cancelar(idTema);
}

export function marcarRevelado(clave: string): void {
  revelados.add(clave);
}

export function fueRevelado(clave: string): boolean {
  return revelados.has(clave);
}
