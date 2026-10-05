import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft } from "lucide-react";
import type { StudyTopic } from "../types";
import * as studyService from "../services/studyService";
import { normalize } from "../utils/concepts";
import { useClickOutside } from "../hooks/useClickOutside";

/** Buscador global del header. Atajo "/" para enfocarlo desde cualquier pantalla. */
export default function HeaderSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [topics, setTopics] = useState<StudyTopic[] | null>(null);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef as React.RefObject<HTMLElement>, () => setOpen(false), open);

  // Atajo "/" (ignorado mientras se escribe en otro campo)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      e.preventDefault();
      inputRef.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function handleFocus() {
    setOpen(true);
    if (!topics) studyService.getStudyTopics().then(setTopics).catch(() => setTopics([]));
  }

  const results = useMemo(() => {
    if (!topics) return [];
    const q = normalize(query).trim();
    const list = q ? topics.filter((t) => normalize(`${t.title} ${t.category} ${t.description ?? ""}`).includes(q)) : topics;
    return list.slice(0, 6);
  }, [topics, query]);

  useEffect(() => setActive(0), [query]);

  function go(topic: StudyTopic) {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(`/study/${topic.id}/summary`);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="header-search-wrap" ref={wrapRef}>
      <div className="header-search">
        <Search size={15} />
        <input
          ref={inputRef}
          value={query}
          placeholder="Buscar temas, preguntas..."
          aria-label="Buscar"
          aria-expanded={open}
          aria-controls="header-search-results"
          autoComplete="off"
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onKeyDown={onKeyDown}
        />
        <kbd className="hide-mobile">/</kbd>
      </div>

      {open && (
        <div className="search-results" id="header-search-results" role="listbox">
          {!topics && <p className="search-empty">Buscando…</p>}
          {topics && results.length === 0 && <p className="search-empty">No encontramos temas para «{query}».</p>}
          {results.map((t, i) => (
            <button key={t.id} role="option" aria-selected={i === active} className={`search-item ${i === active ? "active" : ""}`} onMouseEnter={() => setActive(i)} onClick={() => go(t)}>
              <span className="search-item-main">
                <strong>{t.title}</strong>
                <small>{t.category}</small>
              </span>
              {i === active ? <CornerDownLeft size={14} /> : <span className="search-item-pct">{t.mastery}%</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
