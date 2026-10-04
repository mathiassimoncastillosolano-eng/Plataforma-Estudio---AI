import { createContext, useContext } from "react";
import type { StudyTopic } from "../types";

interface TopicContextValue {
  topic: StudyTopic;
  refresh: () => Promise<void>;
  setTopic: (topic: StudyTopic) => void;
}

export const TopicContext = createContext<TopicContextValue | undefined>(undefined);

export function useTopicContext(): TopicContextValue {
  const ctx = useContext(TopicContext);
  if (!ctx) throw new Error("useTopicContext debe usarse dentro de TopicLayout");
  return ctx;
}
