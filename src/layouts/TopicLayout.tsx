import { useEffect, useState } from "react";
import { Outlet, useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { StudyTopic } from "../types";
import * as studyService from "../services/studyService";
import { masteryLevelLabels } from "../data/studyTopics";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import TopicSelector from "../components/TopicSelector";
import StudyTabs from "../components/StudyTabs";
import { TopicContext } from "./topicContext";

export default function TopicLayout() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const [topic, setTopic] = useState<StudyTopic | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error" | "empty">("loading");

  async function load() {
    if (!id) return;
    setStatus("loading");
    try {
      const result = await studyService.getStudyTopic(id);
      if (!result) {
        setStatus("empty");
        return;
      }
      setTopic(result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (status === "loading") return <LoadingState message="Cargando tema de estudio..." />;
  if (status === "error") return <ErrorState onRetry={load} />;
  if (status === "empty" || !topic) {
    return (
      <EmptyState
        title="No encontramos este tema"
        description="Puede que haya sido eliminado o que el enlace sea incorrecto."
        action={
          <Link to="/topics" className="btn btn-primary">
            Volver a mis estudios
          </Link>
        }
      />
    );
  }

  return (
    <TopicContext.Provider value={{ topic, refresh: load, setTopic }}>
      <div className="topic-shell">
        <header className="topic-head">
          <Link to="/topics" className="back-link">
            <ArrowLeft size={15} />
            Mis estudios
          </Link>

          <div className="topic-title-row">
            <div className="topic-title-block">
              <Badge tone="blue">{topic.category}</Badge>
              <TopicSelector current={topic} />
            </div>
            <div className="topic-mastery-chip" title={masteryLevelLabels[topic.masteryLevel]}>
              <span>
                Dominio <strong className="mono">{topic.mastery}%</strong>
              </span>
              <ProgressBar value={topic.mastery} />
            </div>
          </div>

          <StudyTabs topicId={topic.id} />
        </header>

        {/* key: cada pestaña entra con su propia transición sin recargar el tema */}
        <div className="topic-body tab-enter" key={pathname}>
          <Outlet />
        </div>
      </div>
    </TopicContext.Provider>
  );
}
