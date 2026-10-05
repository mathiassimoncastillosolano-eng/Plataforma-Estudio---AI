import type { KeyConcept, MindMap, StudyQuestion, TopicSummary } from "../types";
import { summaries } from "../data/summaries";
import { getQuestionsForTopic } from "../data/questions";
import { mindmaps, buildFallbackMindMap } from "../data/mindmaps";
import { mockDelay } from "../utils/mockDelay";

// -----------------------------------------------------------------------
// Servicio de Inteligencia Artificial (simulado).
// Cuando exista el backend, estas funciones pasarán a llamar a endpoints
// como POST /api/ai/summary, POST /api/ai/questions, POST /api/ai/mindmap,
// que a su vez orquestan la comunicación con el modelo de lenguaje.
// La API Key del proveedor de IA NUNCA vivirá en el frontend.
// -----------------------------------------------------------------------

function buildGenericSummary(topicId: string, title: string): TopicSummary {
  return {
    topicId,
    essential: {
      intro: `Este es un resumen esencial generado automáticamente para "${title}". Identifica los conceptos que te permitirán comprender rápidamente el resto del material.`,
      keyConcepts: [
        { order: 1, term: "Concepto central", definition: `Idea principal alrededor de la cual se organiza "${title}".` },
        { order: 2, term: "Definiciones clave", definition: "Términos específicos que aparecen con frecuencia en el material fuente." },
        { order: 3, term: "Relaciones", definition: "Cómo se conectan los conceptos entre sí dentro del tema." },
      ],
      relations: [
        "Los conceptos fundamentales se apoyan entre sí para construir una comprensión general del tema.",
        "El resumen completo profundiza en cada uno de estos conceptos con más detalle.",
      ],
    },
    complete: {
      sections: [
        {
          heading: "Introducción",
          body: `El contenido proporcionado sobre "${title}" fue analizado para extraer sus ideas principales, definiciones y relaciones entre conceptos.`,
        },
        {
          heading: "Desarrollo",
          body: "Esta sección se ampliará con los detalles específicos identificados en tu documento o texto a medida que seas evaluado sobre el tema.",
          bullets: ["Concepto fundamental 1", "Concepto fundamental 2", "Concepto fundamental 3"],
        },
      ],
    },
  };
}

export async function generateGeneralSummary(topicId: string, title = "este tema"): Promise<TopicSummary> {
  const existing = summaries[topicId];
  const result = existing ?? buildGenericSummary(topicId, title);
  return mockDelay(result, 900);
}

export async function generateCompleteSummary(topicId: string, title = "este tema"): Promise<TopicSummary> {
  const existing = summaries[topicId];
  const result = existing ?? buildGenericSummary(topicId, title);
  return mockDelay(result, 900);
}

function buildGenericQuestions(topicId: string, title: string): StudyQuestion[] {
  // Banco mock para temas creados por el usuario: 12 preguntas (4 fáciles,
  // 5 medias, 3 difíciles) con ids estables para poder registrar su estado.
  const specs: Array<[StudyQuestion["difficulty"], string, string, string]> = [
    ["facil", `¿Cuál describe mejor la idea central de "${title}"?`, "La idea principal identificada en el material", "Un detalle sin relación con el tema"],
    ["facil", `¿Qué se espera lograr al estudiar "${title}"?`, "Comprender sus conceptos fundamentales", "Memorizar sin entender"],
    ["facil", `¿Dónde conviene empezar para estudiar "${title}"?`, "Por el resumen esencial", "Por los detalles más específicos"],
    ["facil", `¿Qué tipo de contenido organiza "${title}"?`, "Conceptos, definiciones y relaciones", "Únicamente fechas"],
    ["media", `¿Cómo se relacionan los conceptos principales de "${title}"?`, "Se apoyan entre sí para formar una visión general", "Son completamente independientes"],
    ["media", `¿Qué aporta el mapa conceptual de "${title}"?`, "Una vista de cómo se conectan las ideas", "Una lista alfabética de términos"],
    ["media", `¿Para qué sirven las preguntas de práctica de "${title}"?`, "Para detectar qué conceptos aún no dominas", "Para reemplazar la lectura del resumen"],
    ["media", `¿Qué conviene hacer tras fallar una pregunta sobre "${title}"?`, "Leer la explicación y repasar el concepto", "Ignorarla y continuar"],
    ["media", `¿Qué diferencia un concepto fundamental de uno secundario en "${title}"?`, "El fundamental sostiene la comprensión de los demás", "El secundario siempre es más importante"],
    ["dificil", `¿Qué estrategia consolida mejor lo aprendido sobre "${title}"?`, "Combinar lectura, práctica y autoevaluación", "Releer el mismo párrafo muchas veces"],
    ["dificil", `¿Qué indica un dominio alto en "${title}"?`, "Aciertos sostenidos, incluso en preguntas difíciles", "Haber respondido una sola pregunta"],
    ["dificil", `Ante un error repetido en "${title}", ¿qué es lo más efectivo?`, "Identificar el concepto de fondo y reforzarlo", "Cambiar de tema inmediatamente"],
  ];
  return specs.map(([difficulty, prompt, right, wrong], i) => {
    const correctFirst = i % 2 === 0;
    return {
      id: `${topicId}-g${i + 1}`,
      topicId,
      prompt,
      type: "opcion-multiple" as const,
      difficulty,
      options: [
        { id: "a", label: correctFirst ? right : wrong },
        { id: "b", label: correctFirst ? wrong : right },
        { id: "c", label: "Ninguna de las anteriores" },
        { id: "d", label: "Todas las anteriores" },
      ],
      correctOptionId: correctFirst ? "a" : "b",
      explanation: "Pregunta de ejemplo generada automáticamente. Con tu material real, la IA generará preguntas específicas del contenido.",
    };
  });
}

export async function generateQuestions(topicId: string, title = "este tema"): Promise<StudyQuestion[]> {
  const existing = getQuestionsForTopic(topicId);
  const result = existing.length > 0 ? existing : buildGenericQuestions(topicId, title);
  return mockDelay(result, 1000);
}

export async function generateMindMap(topicId: string, title = "Tema"): Promise<MindMap> {
  const existing = mindmaps[topicId];
  if (existing) return mockDelay(existing, 900);

  const summary = summaries[topicId];
  const concepts = summary
    ? summary.essential.keyConcepts.map((c) => ({ term: c.term, definition: c.definition }))
    : [
        { term: "Concepto 1", definition: "Generado automáticamente" },
        { term: "Concepto 2", definition: "Generado automáticamente" },
        { term: "Concepto 3", definition: "Generado automáticamente" },
      ];

  return mockDelay(buildFallbackMindMap(topicId, title, concepts), 900);
}

/** Conceptos clave del tema (resumen) — alimenta "Conceptos relacionados". */
export async function getTopicConcepts(topicId: string, title = "este tema"): Promise<{ concepts: KeyConcept[]; summary: TopicSummary }> {
  const summary = summaries[topicId] ?? buildGenericSummary(topicId, title);
  return mockDelay({ concepts: summary.essential.keyConcepts, summary }, 250);
}

export interface ProcessingStep {
  label: string;
}

export const processingSteps: ProcessingStep[] = [
  { label: "Documento cargado" },
  { label: "Extrayendo contenido" },
  { label: "Identificando conceptos" },
  { label: "Generando recursos de estudio" },
];
