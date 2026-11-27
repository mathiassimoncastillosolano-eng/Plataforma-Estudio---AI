import type { PreguntaEstudio } from "../tipos";
import type { HistorialPreguntas } from "./rondaPreguntas";

export interface EstadoPractica {
  ronda: number;
  banco: PreguntaEstudio[];
  idsRonda: string[];
  idsSiguiente: string[] | null;
  respondidas: string[];
  historial: HistorialPreguntas;
}

const DIFICULTADES = ["facil", "media", "dificil"];
const normalizado = (p: PreguntaEstudio) => p.enunciado.trim().toLowerCase();

export function sinRepetidas(preguntas: PreguntaEstudio[]): PreguntaEstudio[] {
  const ids = new Set<string>();
  const enunciados = new Set<string>();
  return preguntas.filter((p) => {
    if (ids.has(p.id) || enunciados.has(normalizado(p))) return false;
    ids.add(p.id);
    enunciados.add(normalizado(p));
    return true;
  });
}

export function crearPractica(preguntas: PreguntaEstudio[]): EstadoPractica {
  const banco = sinRepetidas(preguntas);
  return { ronda: 1, banco, idsRonda: banco.map((p) => p.id), idsSiguiente: null, respondidas: [], historial: {} };
}

export function preguntasPorIds(banco: PreguntaEstudio[], ids: string[]): PreguntaEstudio[] {
  const porId = new Map(banco.map((p) => [p.id, p]));
  return ids.flatMap((id) => {
    const p = porId.get(id);
    return p ? [p] : [];
  });
}

export function ampliarBanco(banco: PreguntaEstudio[], nuevas: PreguntaEstudio[]): PreguntaEstudio[] {
  return sinRepetidas([...banco, ...nuevas]);
}

const esObjeto = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const esTexto = (v: unknown): v is string => typeof v === "string";
const esListaDeTextos = (v: unknown): v is string[] => Array.isArray(v) && v.every(esTexto);

function esPregunta(v: unknown): v is PreguntaEstudio {
  if (!esObjeto(v)) return false;
  if (!esTexto(v.id) || !esTexto(v.idTema) || !esTexto(v.enunciado) || !esTexto(v.tipo) || !esTexto(v.explicacion)) return false;
  if (!DIFICULTADES.includes(v.dificultad as string)) return false;
  if (v.opciones === undefined) return true;
  return Array.isArray(v.opciones) && v.opciones.every((o) => esObjeto(o) && esTexto(o.id) && esTexto(o.etiqueta));
}

const esHistorial = (v: unknown): v is HistorialPreguntas =>
  esObjeto(v) && Object.values(v).every((h) => esObjeto(h) && Number.isFinite(h.aciertos) && Number.isFinite(h.errores) && (h.ultimo === "ok" || h.ultimo === "fallo"));

export function esEstadoPractica(v: unknown): v is EstadoPractica {
  if (!esObjeto(v)) return false;
  return (
    typeof v.ronda === "number" &&
    Number.isInteger(v.ronda) &&
    v.ronda >= 1 &&
    Array.isArray(v.banco) &&
    v.banco.every(esPregunta) &&
    esListaDeTextos(v.idsRonda) &&
    (v.idsSiguiente === null || esListaDeTextos(v.idsSiguiente)) &&
    esListaDeTextos(v.respondidas) &&
    esHistorial(v.historial)
  );
}
