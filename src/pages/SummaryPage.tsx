import { useEffect, useMemo, useState } from "react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import type { TopicSummary } from "../types";
import { LoadingState, ErrorState } from "../components/States";

type Mode = "essential" | "complete";
interface TocItem {
  id: string;
  label: string;
}

const slug = (s: string) => "s-" + s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Resumen como material de lectura: tipografía editorial, índice lateral, sin tarjetas por fragmento. */
export default function SummaryPage() {
  const { topic } = useTopicContext();
  const [summary, setSummary] = useState<TopicSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [mode, setMode] = useState<Mode>("essential");
  const [activeId, setActiveId] = useState<string>("");

  async function load() {
    setStatus("loading");
    try {
      setSummary(await aiService.generateGeneralSummary(topic.id, topic.title));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  const toc: TocItem[] = useMemo(() => {
    if (!summary) return [];
    if (mode === "essential") {
      return [
        { id: "s-intro", label: "Idea general" },
        { id: "s-conceptos", label: "Conceptos fundamentales" },
        { id: "s-relaciones", label: "Cómo se relacionan" },
      ];
    }
    return summary.complete.sections.map((s) => ({ id: slug(s.heading), label: s.heading }));
  }, [summary, mode]);

  // Resalta en el índice la sección que se está leyendo
  useEffect(() => {
    if (toc.length === 0) return;
    setActiveId(toc[0].id);
    const els = toc.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [toc]);

  if (status === "loading") return <LoadingState message="Generando resumen..." />;
  if (status === "error" || !summary) return <ErrorState onRetry={load} />;

  const words = mode === "essential" ? summary.essential.intro.split(/\s+/).length + summary.essential.keyConcepts.reduce((n, c) => n + c.definition.split(/\s+/).length, 0) : summary.complete.sections.reduce((n, s) => n + s.body.split(/\s+/).length + (s.bullets ?? []).join(" ").split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 200));

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="reader">
      <aside className="reader-rail">
        <div className="seg seg-stack" role="tablist" aria-label="Tipo de resumen">
          <button role="tab" aria-selected={mode === "essential"} className={`seg-btn ${mode === "essential" ? "active" : ""}`} onClick={() => setMode("essential")}>
            Esencial
          </button>
          <button role="tab" aria-selected={mode === "complete"} className={`seg-btn ${mode === "complete" ? "active" : ""}`} onClick={() => setMode("complete")}>
            Completo
          </button>
        </div>
        <nav className="toc" aria-label="En este resumen">
          <p>En este resumen</p>
          {toc.map((t) => (
            <button key={t.id} className={activeId === t.id ? "active" : ""} onClick={() => jump(t.id)}>
              {t.label}
            </button>
          ))}
        </nav>
      </aside>

      <article className="reader-doc" key={mode}>
        <p className="reader-meta">
          {mode === "essential" ? "Resumen esencial" : "Resumen completo"} · {minutes} min de lectura
        </p>

        {mode === "essential" ? (
          <>
            <section id="s-intro">
              <p className="reader-lead">{summary.essential.intro}</p>
            </section>

            <section id="s-conceptos">
              <h2>Conceptos fundamentales</h2>
              <dl className="reader-terms">
                {summary.essential.keyConcepts.map((c) => (
                  <div key={c.order}>
                    <dt>
                      <span className="mono">{String(c.order).padStart(2, "0")}</span>
                      {c.term}
                    </dt>
                    <dd>{c.definition}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section id="s-relaciones">
              <h2>Cómo se relacionan</h2>
              <ul className="reader-list">
                {summary.essential.relations.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          summary.complete.sections.map((section) => (
            <section key={section.heading} id={slug(section.heading)}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
              {section.bullets && (
                <ul className="reader-list">
                  {section.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </section>
          ))
        )}
      </article>
    </div>
  );
}
