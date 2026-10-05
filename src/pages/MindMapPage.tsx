import { useEffect, useState } from "react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import type { KeyConcept, MindMap } from "../types";
import { LoadingState, ErrorState } from "../components/States";
import ConceptMap from "../components/ConceptMap";

export default function MindMapPage() {
  const { topic } = useTopicContext();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [map, setMap] = useState<MindMap | null>(null);
  const [concepts, setConcepts] = useState<KeyConcept[]>([]);

  async function load() {
    setStatus("loading");
    try {
      const [m, info] = await Promise.all([aiService.generateMindMap(topic.id, topic.title), aiService.getTopicConcepts(topic.id, topic.title)]);
      setMap(m);
      setConcepts(info.concepts);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  if (status === "loading") return <LoadingState message="Generando mapa conceptual..." />;
  if (status === "error" || !map) return <ErrorState onRetry={load} />;

  // Los cambios del usuario viven mientras navega; "Regenerar" restaura el mapa original.
  return <ConceptMap map={map} concepts={concepts} onRegenerate={() => setMap({ ...map })} />;
}
