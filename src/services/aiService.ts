import type { MindMap, StudyQuestion, TopicSummary } from "../types";
import { summaries } from "../data/summaries";
import { getQuestionsForTopic } from "../data/questions";
import { mindmaps, buildFallbackMindMap } from "../data/mindmaps";
import { mockDelay, randomId } from "../utils/mockDelay";

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
  return [
    {
      id: randomId("q"),
      topicId,
      prompt: `¿Cuál de las siguientes opciones describe mejor la idea central de "${title}"?`,
      type: "opcion-multiple",
      difficulty: "facil",
      options: [
        { id: "a", label: "La idea principal identificada por la IA" },
        { id: "b", label: "Un concepto no relacionado" },
        { id: "c", label: "Un dato secundario" },
        { id: "d", label: "Ninguna de las anteriores" },
      ],
      correctOptionId: "a",
      explanation: "Esta pregunta se genera automáticamente a partir del contenido que proporcionaste.",
    },
    {
      id: randomId("q"),
      topicId,
      prompt: `El material sobre "${title}" incluye al menos un concepto fundamental.`,
      type: "verdadero-falso",
      difficulty: "facil",
      options: [
        { id: "v", label: "Verdadero" },
        { id: "f", label: "Falso" },
      ],
      correctOptionId: "v",
      explanation: "Todo contenido analizado produce al menos un concepto fundamental identificado por la IA.",
    },
  ];
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

export interface ProcessingStep {
  label: string;
}

export const processingSteps: ProcessingStep[] = [
  { label: "Documento cargado" },
  { label: "Extrayendo contenido" },
  { label: "Identificando conceptos" },
  { label: "Generando recursos de estudio" },
];
