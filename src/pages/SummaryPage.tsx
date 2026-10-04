import { useEffect, useState } from "react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import type { TopicSummary } from "../types";
import { LoadingState, ErrorState } from "../components/States";
import Card from "../components/Card";

type Tab = "essential" | "complete";

export default function SummaryPage() {
  const { topic } = useTopicContext();
  const [summary, setSummary] = useState<TopicSummary | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [tab, setTab] = useState<Tab>("essential");

  async function load() {
    setStatus("loading");
    try {
      const result = await aiService.generateGeneralSummary(topic.id, topic.title);
      setSummary(result);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  if (status === "loading") return <LoadingState message="Generando resumen..." />;
  if (status === "error" || !summary) return <ErrorState onRetry={load} />;

  return (
    <div>
      <div className="summary-tabs">
        <button className={`summary-tab-btn ${tab === "essential" ? "active" : ""}`} onClick={() => setTab("essential")}>
          Resumen esencial
        </button>
        <button className={`summary-tab-btn ${tab === "complete" ? "active" : ""}`} onClick={() => setTab("complete")}>
          Resumen completo
        </button>
      </div>

      <Card>
        {tab === "essential" ? (
          <div className="summary-doc">
            <p className="card-subtitle" style={{ marginTop: -8, marginBottom: 18 }}>
              Comprende las ideas fundamentales del tema.
            </p>
            <h3>{topic.title}</h3>
            <p>{summary.essential.intro}</p>

            <h3>Conceptos fundamentales</h3>
            <div className="concept-list">
              {summary.essential.keyConcepts.map((c) => (
                <div className="concept-item" key={c.order}>
                  <span className="concept-number">{String(c.order).padStart(2, "0")}</span>
                  <div>
                    <div className="concept-term">{c.term}</div>
                    <div className="concept-def">{c.definition}</div>
                  </div>
                </div>
              ))}
            </div>

            <h3>Relaciones principales</h3>
            <ul className="relation-list">
              {summary.essential.relations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="summary-doc">
            <p className="card-subtitle" style={{ marginTop: -8, marginBottom: 18 }}>
              Versión desarrollada con explicaciones y ejemplos.
            </p>
            {summary.complete.sections.map((section) => (
              <div key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
                {section.bullets && (
                  <ul>
                    {section.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
