// Estado de estudio por pregunta, persistido por tema en localStorage.
//   known  → la respondió/marcó bien
//   review → la falló o la marcó para repasar
// Una pregunta sin registro está "pendiente".
export type QuestionStatus = "known" | "review";
export type StatusMap = Record<string, QuestionStatus>;

const key = (topicId: string) => `cursa.qstatus.${topicId}`;

export function loadStatus(topicId: string): StatusMap {
  try {
    const raw = localStorage.getItem(key(topicId));
    return raw ? (JSON.parse(raw) as StatusMap) : {};
  } catch {
    return {};
  }
}

export function saveStatus(topicId: string, map: StatusMap) {
  try {
    localStorage.setItem(key(topicId), JSON.stringify(map));
  } catch {
    /* almacenamiento lleno o bloqueado: se ignora, no es crítico */
  }
}

export function setStatuses(topicId: string, updates: StatusMap): StatusMap {
  const next = { ...loadStatus(topicId), ...updates };
  saveStatus(topicId, next);
  return next;
}
