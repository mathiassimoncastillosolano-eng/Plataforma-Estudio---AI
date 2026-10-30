import type { TerminoAyuda } from "../tipos/prueba";

export interface SegmentoEnunciado {
  texto: string;
  termino?: TerminoAyuda;
}

/**
 * Parte el enunciado en tramos de texto plano y términos con definición.
 * Usa las posiciones que valida el backend; descarta cualquier posición inválida o solapada.
 * Devuelve texto (no HTML): React lo escapa, así que nada generado por la IA puede inyectar marcado.
 */
export function segmentarEnunciado(enunciado: string, terminos: TerminoAyuda[]): SegmentoEnunciado[] {
  const validos = terminos
    .filter((t) => Number.isInteger(t.inicio) && Number.isInteger(t.fin) && t.inicio >= 0 && t.fin > t.inicio && t.fin <= enunciado.length && t.definicion.trim())
    .sort((a, b) => a.inicio - b.inicio);

  const segmentos: SegmentoEnunciado[] = [];
  let cursor = 0;
  for (const termino of validos) {
    if (termino.inicio < cursor) continue; // solapado con el anterior
    if (termino.inicio > cursor) segmentos.push({ texto: enunciado.slice(cursor, termino.inicio) });
    segmentos.push({ texto: enunciado.slice(termino.inicio, termino.fin), termino });
    cursor = termino.fin;
  }
  if (cursor < enunciado.length) segmentos.push({ texto: enunciado.slice(cursor) });
  return segmentos.length > 0 ? segmentos : [{ texto: enunciado }];
}
