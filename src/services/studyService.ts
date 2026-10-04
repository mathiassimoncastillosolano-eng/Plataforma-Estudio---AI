import type { SourceDraft, StudyTopic, TopicSummary } from "../types";
import { studyTopics as baseTopics, getMasteryLevel } from "../data/studyTopics";
import { summaries as baseSummaries } from "../data/summaries";
import { mockDelay, randomId } from "../utils/mockDelay";

// -----------------------------------------------------------------------
// Servicio de temas de estudio.
// Reemplazará llamadas como GET /api/topics, POST /api/topics,
// GET /api/topics/:id una vez exista el backend Spring Boot.
// Mientras tanto, persiste los temas creados en memoria + localStorage
// para que la sesión se sienta real al navegar entre pantallas.
// -----------------------------------------------------------------------

const TOPICS_KEY = "cursa.topics";
const SUMMARIES_KEY = "cursa.summaries";

function loadTopics(): StudyTopic[] {
  try {
    const raw = localStorage.getItem(TOPICS_KEY);
    if (raw) return JSON.parse(raw) as StudyTopic[];
  } catch {
    /* ignore corrupted storage */
  }
  return baseTopics;
}

function saveTopics(topics: StudyTopic[]) {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
}

function loadSummaries(): Record<string, TopicSummary> {
  try {
    const raw = localStorage.getItem(SUMMARIES_KEY);
    if (raw) return { ...baseSummaries, ...(JSON.parse(raw) as Record<string, TopicSummary>) };
  } catch {
    /* ignore corrupted storage */
  }
  return baseSummaries;
}

function saveSummaries(summaries: Record<string, TopicSummary>) {
  localStorage.setItem(SUMMARIES_KEY, JSON.stringify(summaries));
}

export async function getStudyTopics(): Promise<StudyTopic[]> {
  return mockDelay(loadTopics(), 500);
}

export async function getStudyTopic(id: string): Promise<StudyTopic | undefined> {
  const topic = loadTopics().find((t) => t.id === id);
  return mockDelay(topic, 350);
}

export async function createStudyTopic(draft: SourceDraft): Promise<StudyTopic> {
  const topics = loadTopics();
  const newTopic: StudyTopic = {
    id: randomId("topic"),
    title: draft.topicTitle,
    category: draft.category || "General",
    mastery: 0,
    masteryLevel: getMasteryLevel(0),
    lastStudiedAt: "Hoy",
    createdAt: new Date().toISOString(),
    questionsAnswered: 0,
    examsCompleted: 0,
    sourceType: draft.sourceType,
    sourceName: draft.fileName,
  };

  saveTopics([newTopic, ...topics]);
  return mockDelay(newTopic, 300);
}

export async function updateTopicMastery(topicId: string, mastery: number): Promise<StudyTopic | undefined> {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx === -1) return undefined;

  const updated: StudyTopic = {
    ...topics[idx],
    mastery,
    masteryLevel: getMasteryLevel(mastery),
    lastStudiedAt: "Hoy",
  };
  topics[idx] = updated;
  saveTopics(topics);
  return mockDelay(updated, 200);
}

export async function incrementQuestionsAnswered(topicId: string, count: number): Promise<void> {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx === -1) return;
  topics[idx] = { ...topics[idx], questionsAnswered: topics[idx].questionsAnswered + count };
  saveTopics(topics);
}

export async function incrementExamsCompleted(topicId: string): Promise<void> {
  const topics = loadTopics();
  const idx = topics.findIndex((t) => t.id === topicId);
  if (idx === -1) return;
  topics[idx] = { ...topics[idx], examsCompleted: topics[idx].examsCompleted + 1 };
  saveTopics(topics);
}

export async function getTopicSummary(topicId: string): Promise<TopicSummary | undefined> {
  return mockDelay(loadSummaries()[topicId], 300);
}

export async function saveGeneratedSummary(summary: TopicSummary): Promise<void> {
  const summaries = loadSummaries();
  summaries[summary.topicId] = summary;
  saveSummaries(summaries);
}
