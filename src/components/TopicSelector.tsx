import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ChevronDown, Plus, Search } from "lucide-react";
import type { StudyTopic } from "../types";
import * as studyService from "../services/studyService";
import { normalize } from "../utils/concepts";
import { useClickOutside } from "../hooks/useClickOutside";
import { SkeletonText } from "./Skeleton";

const TABS = ["summary", "questions", "exam", "mindmap"];

let cache: StudyTopic[] | null = null;

/**
 * Título del tema como selector interactivo (popover tipo command menu):
 * buscar, cambiar de tema conservando la pestaña, volver a Mis estudios.
 */
export default function TopicSelector({ current }: { current: StudyTopic }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<StudyTopic[] | null>(cache);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef as React.RefObject<HTMLElement>, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    inputRef.current?.focus();
    studyService
      .getStudyTopics()
      .then((list) => {
        cache = list;
        setTopics(list);
      })
      .catch(() => setTopics((prev) => prev ?? []));
  }, [open]);

  const filtered = useMemo(() => {
    if (!topics) return [];
    const q = normalize(query).trim();
    return q ? topics.filter((t) => normalize(`${t.title} ${t.category}`).includes(q)) : topics;
  }, [topics, query]);

  useEffect(() => setActive(0), [query, open]);

  // Mantiene visible el ítem activo al navegar con el teclado
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function select(topic: StudyTopic) {
    setOpen(false);
    if (topic.id === current.id) return;
    const segment = pathname.split("/")[3];
    navigate(`/study/${topic.id}/${TABS.includes(segment) ? segment : "summary"}`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[active]) {
      e.preventDefault();
      select(filtered[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="topic-selector" ref={wrapRef}>
      <button className="topic-title-btn" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} title="Cambiar de tema">
        <h1>{current.title}</h1>
        <span className="topic-title-chevron">
          <ChevronDown size={18} />
        </span>
      </button>

      {open && (
        <>
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="cmd-panel" role="dialog" aria-label="Cambiar de tema">
            <div className="cmd-search">
              <Search size={16} />
              <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Buscar un tema…" aria-label="Buscar tema" autoComplete="off" />
              <kbd>esc</kbd>
            </div>

            <div className="cmd-list" ref={listRef} role="listbox" aria-label="Temas disponibles">
              {!topics && (
                <div className="cmd-loading">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="cmd-skeleton">
                      <SkeletonText width="60%" height={13} />
                      <SkeletonText width="30%" height={10} />
                    </div>
                  ))}
                </div>
              )}
              {topics && filtered.length === 0 && <p className="cmd-empty">No hay temas que coincidan con «{query}».</p>}
              {filtered.map((t, i) => {
                const isCurrent = t.id === current.id;
                return (
                  <button key={t.id} role="option" aria-selected={isCurrent} data-active={i === active} className={`cmd-item ${i === active ? "active" : ""} ${isCurrent ? "current" : ""}`} onMouseEnter={() => setActive(i)} onClick={() => select(t)}>
                    <span className="cmd-item-main">
                      <strong>{t.title}</strong>
                      <small>
                        {t.category} · {t.lastStudiedAt}
                      </small>
                    </span>
                    <span className="cmd-item-side">
                      <span className="cmd-pct">{t.mastery}%</span>
                      {isCurrent && (
                        <span className="cmd-check" aria-label="Tema actual">
                          <Check size={14} strokeWidth={3} />
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="cmd-footer">
              <button onClick={() => navigate("/topics")}>
                <ArrowLeft size={14} />
                Mis estudios
              </button>
              <button onClick={() => navigate("/study/new")}>
                <Plus size={14} />
                Nuevo tema
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
