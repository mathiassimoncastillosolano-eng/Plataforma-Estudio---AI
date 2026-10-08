import type { ConceptoClave, PreguntaEstudio, ResumenTema } from "../tipos";

// ---------------------------------------------------------------------------
// Clasificación ligera pregunta ↔ contenido del tema (mock de lo que haría el
// backend). Se usa para "Conceptos relacionados" y "Temas con mayor error".
// ---------------------------------------------------------------------------

const PALABRAS_VACIAS = new Set(["para", "como", "cual", "cuales", "esta", "este", "esto", "entre", "sobre", "desde", "hacia", "donde", "cuando", "tiene", "tienen", "puede", "pueden", "ellos", "aquel", "mismo", "mismos", "otras", "otros", "cada", "ellas", "estos", "estas", "forma", "parte", "partes", "siempre", "nunca", "solo", "debe", "describe", "explica", "brevemente", "palabras", "concepto", "tema"]);

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function raices(texto: string, longitudMinima = 5): Set<string> {
  const salida = new Set<string>();
  for (const w of normalizar(texto).split(/\s+/)) {
    if (w.length >= longitudMinima && !PALABRAS_VACIAS.has(w)) salida.add(w.slice(0, 5));
  }
  return salida;
}

function textoPregunta(q: PreguntaEstudio): string {
  const correcta = q.opciones?.find((o) => o.id === q.idOpcionCorrecta)?.etiqueta ?? q.textoRespuestaCorrecta ?? "";
  return `${q.enunciado} ${correcta} ${q.explicacion}`;
}

/** Conceptos clave del resumen que aparecen en la pregunta (máx. `max`). */
export function conceptosRelacionados(q: PreguntaEstudio, conceptos: ConceptoClave[], max = 3): string[] {
  const raicesPreguntas = raices(textoPregunta(q));
  const aciertos: { termino: string; puntaje: number }[] = [];
  for (const c of conceptos) {
    const raicesTerminos = [...raices(c.termino.replace(/\(.*?\)/g, ""), 4)];
    const puntaje = raicesTerminos.filter((s) => raicesPreguntas.has(s.slice(0, 5)) || raicesPreguntas.has(s)).length;
    if (puntaje > 0) aciertos.push({ termino: c.termino, puntaje });
  }
  return aciertos
    .sort((a, b) => b.puntaje - a.puntaje)
    .slice(0, max)
    .map((h) => h.termino);
}

/** Sección del resumen completo con mayor afinidad a la pregunta (o null). */
export function clasificarPregunta(q: PreguntaEstudio, resumen: ResumenTema | undefined): string | null {
  if (!resumen) return null;
  const raicesPreguntas = raices(textoPregunta(q));
  let mejor: { subtitulo: string; puntaje: number } | null = null;
  for (const seccion of resumen.completo.secciones) {
    const raicesSecciones = raices(`${seccion.subtitulo} ${seccion.subtitulo} ${seccion.cuerpo} ${(seccion.puntos ?? []).join(" ")}`);
    let puntaje = 0;
    raicesPreguntas.forEach((s) => {
      if (raicesSecciones.has(s)) puntaje += 1;
    });
    if (!mejor || puntaje > mejor.puntaje) mejor = { subtitulo: seccion.subtitulo, puntaje };
  }
  return mejor && mejor.puntaje >= 2 ? mejor.subtitulo : null;
}
