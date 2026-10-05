import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dumbbell, ListChecks, Search, X } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import type { KeyConcept, StudyQuestion } from "../types";
import { normalize, relatedConcepts } from "../utils/concepts";
import { loadStatus, saveStatus, type QuestionStatus, type StatusMap } from "../utils/questionStatus";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import QuestionCard from "../components/QuestionCard";
import PracticeSession from "../components/PracticeSession";
import Button from "../components/Button";

type FilterId = "todas" | "facil" | "media" | "dificil" | "respondidas" | "pendientes" | "repasar";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "facil", label: "Fáciles" },
  { id: "media", label: "Medias" },
  { id: "dificil", label: "Difíciles" },
  { id: "respondidas", label: "Respondidas" },
  { id: "pendientes", label: "Pendientes" },
  { id: "repasar", label: "Por repasar" },
];

export default function QuestionsPage() {
  const { topic } = useTopicContext();
  const [params, setParams] = useSearchParams();
  const [questions, setQuestions] = useState<StudyQuestion[] | null>(null);
  const [concepts, setConcepts] = useState<KeyConcept[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [statuses, setStatuses] = useState<StatusMap>(() => loadStatus(topic.id));
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [practice, setPractice] = useState<StudyQuestion[] | null>(null);

  const initial = params.get("f") as FilterId | null;
  const [filter, setFilter] = useState<FilterId>(FILTERS.some((f) => f.id === initial) ? (initial as FilterId) : "todas");

  async function load() {
    setStatus("loading");
    try {
      const [result, info] = await Promise.all([aiService.generateQuestions(topic.id, topic.title), aiService.getTopicConcepts(topic.id, topic.title)]);
      setQuestions(result);
      setConcepts(info.concepts);
      setStatuses(loadStatus(topic.id));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  function updateStatus(id: string, next: QuestionStatus | null) {
    setStatuses((prev) => {
      const copy = { ...prev };
      if (next) copy[id] = next;
      else delete copy[id];
      saveStatus(topic.id, copy);
      return copy;
    });
  }

  function changeFilter(next: FilterId) {
    setFilter(next);
    if (params.has("f")) setParams({}, { replace: true });
  }

  const counts = useMemo(() => {
    const all = questions ?? [];
    const c: Record<FilterId, number> = { todas: all.length, facil: 0, media: 0, dificil: 0, respondidas: 0, pendientes: 0, repasar: 0 };
    for (const q of all) {
      c[q.difficulty] += 1;
      if (statuses[q.id]) c.respondidas += 1;
      else c.pendientes += 1;
      if (statuses[q.id] === "review") c.repasar += 1;
    }
    return c;
  }, [questions, statuses]);

  const visible = useMemo(() => {
    const q = normalize(query).trim();
    return (questions ?? []).filter((item) => {
      if (filter === "facil" || filter === "media" || filter === "dificil") {
        if (item.difficulty !== filter) return false;
      } else if (filter === "respondidas" && !statuses[item.id]) return false;
      else if (filter === "pendientes" && statuses[item.id]) return false;
      else if (filter === "repasar" && statuses[item.id] !== "review") return false;
      if (!q) return true;
      return normalize(`${item.prompt} ${item.explanation} ${item.options?.map((o) => o.label).join(" ") ?? ""}`).includes(q);
    });
  }, [questions, filter, query, statuses]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (status === "loading") return <LoadingState message="Cargando preguntas..." />;
  if (status === "error") return <ErrorState onRetry={load} />;
  if (!questions || questions.length === 0) {
    return <EmptyState title="No hay preguntas disponibles" description="Todavía no se generaron preguntas para este tema." />;
  }

  if (practice) {
    return (
      <div className="questions-wrap">
        <div className="questions-toolbar">
          <button className="back-link" onClick={() => setPractice(null)}>
            <ListChecks size={15} />
            Volver a la lista
          </button>
          <span className="text-muted">Práctica · {practice.length} preguntas</span>
        </div>
        <PracticeSession questions={practice} onAnswered={(id, ok) => updateStatus(id, ok ? "known" : "review")} onExit={() => setPractice(null)} />
      </div>
    );
  }

  const answeredPct = Math.round((counts.respondidas / counts.todas) * 100);
  const allOpen = visible.length > 0 && visible.every((q) => openIds.has(q.id));

  return (
    <div className="questions-wrap">
      <div className="questions-toolbar">
        <div className="questions-progress">
          <strong>
            {counts.respondidas} <span>de {counts.todas} respondidas</span>
          </strong>
          <div className="progress-track" role="progressbar" aria-valuenow={answeredPct} aria-valuemin={0} aria-valuemax={100} aria-label="Preguntas respondidas">
            <div className="progress-fill" style={{ width: `${answeredPct}%` }} />
          </div>
        </div>
        <Button variant="secondary" size="sm" icon={<Dumbbell size={15} />} disabled={visible.length === 0} onClick={() => setPractice(visible)}>
          Practicar {filter === "todas" && !query ? "todas" : `estas (${visible.length})`}
        </Button>
      </div>

      <div className="filter-bar">
        <div className="chip-filters" role="tablist" aria-label="Filtrar preguntas">
          {FILTERS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filter === f.id} className={`fchip ${filter === f.id ? "active" : ""}`} onClick={() => changeFilter(f.id)}>
              {f.label}
              <span>{counts[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="q-search">
          <Search size={15} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar en las preguntas…" aria-label="Buscar preguntas" />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Borrar búsqueda">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Ninguna pregunta coincide"
          description={query ? `No encontramos resultados para «${query}» con este filtro.` : "Cambia el filtro para ver otras preguntas."}
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setQuery("");
                changeFilter("todas");
              }}
            >
              Ver todas
            </Button>
          }
        />
      ) : (
        <>
          <div className="list-meta">
            <span>
              {visible.length} {visible.length === 1 ? "pregunta" : "preguntas"}
            </span>
            <button onClick={() => setOpenIds(allOpen ? new Set() : new Set(visible.map((q) => q.id)))}>{allOpen ? "Ocultar todas las respuestas" : "Mostrar todas las respuestas"}</button>
          </div>
          <div className="qlist stagger">
            {visible.map((q, i) => (
              <QuestionCard key={q.id} question={q} number={(questions.indexOf(q) + 1) || i + 1} open={openIds.has(q.id)} status={statuses[q.id]} related={relatedConcepts(q, concepts)} onToggle={() => toggle(q.id)} onStatus={(s) => updateStatus(q.id, s)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
