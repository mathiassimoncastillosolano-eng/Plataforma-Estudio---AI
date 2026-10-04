import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import * as studyService from "../services/studyService";
import type { StudyTopic } from "../types";
import StudyTopicCard from "../components/StudyTopicCard";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { SkeletonGrid } from "../components/Skeleton";
import { getTopicStatus, topicStatusLabels, type TopicStatus } from "../data/studyTopics";

type FilterKey = "todos" | TopicStatus;

const filters: { key: FilterKey; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "en-progreso", label: topicStatusLabels["en-progreso"] },
  { key: "completado", label: topicStatusLabels.completado },
  { key: "pendiente", label: topicStatusLabels.pendiente },
];

export default function TopicsListPage() {
  const [topics, setTopics] = useState<StudyTopic[] | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("todos");

  async function load() {
    setStatus("loading");
    try {
      const result = await studyService.getStudyTopics();
      setTopics(result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return (topics ?? []).filter((t) => {
      const matchesQuery =
        t.title.toLowerCase().includes(query.toLowerCase()) || t.category.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "todos" || getTopicStatus(t) === filter;
      return matchesQuery && matchesFilter;
    });
  }, [topics, query, filter]);

  if (status === "loading") {
    return (
      <div>
        <div className="section-heading">
          <div>
            <h1 style={{ fontSize: 23 }}>Mis estudios</h1>
            <p className="text-muted" style={{ marginTop: 6, fontSize: 13.5 }}>
              Cargando tus temas...
            </p>
          </div>
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div>
      <div className="section-heading">
        <div>
          <h1 style={{ fontSize: 23 }}>Mis estudios</h1>
          <p className="text-muted" style={{ marginTop: 6, fontSize: 13.5 }}>
            Todos los temas que has creado, en un solo lugar.
          </p>
        </div>
        <Link to="/study/new" className="btn btn-primary">
          <Plus size={16} />
          Nuevo tema
        </Link>
      </div>

      <div className="row-between" style={{ marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
        <div className="summary-tabs" style={{ marginBottom: 0 }} role="tablist" aria-label="Filtrar por estado">
          {filters.map((f) => (
            <button
              key={f.key}
              className={`summary-tab-btn ${filter === f.key ? "active" : ""}`}
              onClick={() => setFilter(f.key)}
              role="tab"
              aria-selected={filter === f.key}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="header-search" style={{ maxWidth: 280 }}>
          <Search size={15} />
          <input placeholder="Buscar por tema o categoría..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="topic-grid">
          {filtered.map((topic) => (
            <StudyTopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={topics && topics.length > 0 ? "Sin resultados" : "Todavía no tienes temas de estudio."}
          description={
            topics && topics.length > 0
              ? "No encontramos temas que coincidan con tu búsqueda o filtro."
              : "Crea tu primer tema para comenzar a estudiar con IA."
          }
          action={
            <Link to="/study/new" className="btn btn-primary">
              Crear primer tema
            </Link>
          }
        />
      )}
    </div>
  );
}
