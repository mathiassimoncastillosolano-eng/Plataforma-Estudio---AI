import type { KeyConcept, StudyQuestion, TopicSummary } from "../types";

// ---------------------------------------------------------------------------
// Clasificación ligera pregunta ↔ contenido del tema (mock de lo que haría el
// backend). Se usa para "Conceptos relacionados" y "Temas con mayor error".
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(["para", "como", "cual", "cuales", "esta", "este", "esto", "entre", "sobre", "desde", "hacia", "donde", "cuando", "tiene", "tienen", "puede", "pueden", "ellos", "aquel", "mismo", "mismos", "otras", "otros", "cada", "ellas", "estos", "estas", "forma", "parte", "partes", "siempre", "nunca", "solo", "debe", "describe", "explica", "brevemente", "palabras", "concepto", "tema"]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function stems(text: string, minLen = 5): Set<string> {
  const out = new Set<string>();
  for (const w of normalize(text).split(/\s+/)) {
    if (w.length >= minLen && !STOPWORDS.has(w)) out.add(w.slice(0, 5));
  }
  return out;
}

function questionText(q: StudyQuestion): string {
  const correct = q.options?.find((o) => o.id === q.correctOptionId)?.label ?? q.correctAnswerText ?? "";
  return `${q.prompt} ${correct} ${q.explanation}`;
}

/** Conceptos clave del resumen que aparecen en la pregunta (máx. `max`). */
export function relatedConcepts(q: StudyQuestion, concepts: KeyConcept[], max = 3): string[] {
  const qStems = stems(questionText(q));
  const hits: { term: string; score: number }[] = [];
  for (const c of concepts) {
    const termStems = [...stems(c.term.replace(/\(.*?\)/g, ""), 4)];
    const score = termStems.filter((s) => qStems.has(s.slice(0, 5)) || qStems.has(s)).length;
    if (score > 0) hits.push({ term: c.term, score });
  }
  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((h) => h.term);
}

/** Sección del resumen completo con mayor afinidad a la pregunta (o null). */
export function classifyQuestion(q: StudyQuestion, summary: TopicSummary | undefined): string | null {
  if (!summary) return null;
  const qStems = stems(questionText(q));
  let best: { heading: string; score: number } | null = null;
  for (const section of summary.complete.sections) {
    const sectionStems = stems(`${section.heading} ${section.heading} ${section.body} ${(section.bullets ?? []).join(" ")}`);
    let score = 0;
    qStems.forEach((s) => {
      if (sectionStems.has(s)) score += 1;
    });
    if (!best || score > best.score) best = { heading: section.heading, score };
  }
  return best && best.score >= 2 ? best.heading : null;
}
