import { useEffect, useState } from "react";
import { NavLink, Outlet, useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { StudyTopic } from "../types";
import * as studyService from "../services/studyService";
import { masteryLevelLabels } from "../data/studyTopics";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import Badge from "../components/Badge";
import ProgressBar from "../components/ProgressBar";
import { TopicContext } from "./topicContext";

export default function TopicLayout() {
  const { id } = useParams<{ id: string }>();
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
      <div className="topic-header">
        <Link to="/topics" className="back-link">
          <ArrowLeft size={15} />
          Mis estudios
        </Link>

        <div className="topic-header-top">
          <div>
            <Badge tone="blue">{topic.category}</Badge>
            <h1>{topic.title}</h1>
          </div>
        </div>

        <div className="topic-mastery-row">
          <div className="topic-mastery-bar-wrap">
            <div className="topic-mastery-label-row">
              <span className="text-soft" style={{ fontWeight: 600 }}>
                Dominio estimado
              </span>
              <span className="text-muted">{masteryLevelLabels[topic.masteryLevel]}</span>
            </div>
            <ProgressBar value={topic.mastery} />
          </div>
          <strong className="mono" style={{ fontSize: 20, color: "var(--color-text)" }}>
            {topic.mastery}%
          </strong>
        </div>

        <nav className="tab-nav">
          <NavLink to={`/study/${id}/summary`} className={({ isActive }) => (isActive ? "active" : "")}>
            Resumen
          </NavLink>
          <NavLink to={`/study/${id}/questions`} className={({ isActive }) => (isActive ? "active" : "")}>
            Preguntas
          </NavLink>
          <NavLink to={`/study/${id}/exam`} className={({ isActive }) => (isActive ? "active" : "")}>
            Prueba
          </NavLink>
          <NavLink to={`/study/${id}/mindmap`} className={({ isActive }) => (isActive ? "active" : "")}>
            Mapa conceptual
          </NavLink>
        </nav>
      </div>

      <Outlet />
    </TopicContext.Provider>
  );
}
