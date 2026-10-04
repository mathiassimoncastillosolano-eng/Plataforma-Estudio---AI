import { Link } from "react-router-dom";
import { BookOpen, HelpCircle, ClipboardCheck, Share2, ArrowRight } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import Card from "../components/Card";
import { masteryLevelCopy } from "../data/studyTopics";

const quickLinks = [
  {
    to: "summary",
    icon: BookOpen,
    title: "Resumen",
    desc: "Repasa las ideas fundamentales y el contenido completo del tema.",
  },
  {
    to: "questions",
    icon: HelpCircle,
    title: "Preguntas",
    desc: "Practica con preguntas y recibe retroalimentación inmediata.",
  },
  {
    to: "exam",
    icon: ClipboardCheck,
    title: "Prueba",
    desc: "Ponte a prueba con un examen cronometrado del tema completo.",
  },
  {
    to: "mindmap",
    icon: Share2,
    title: "Mapa conceptual",
    desc: "Visualiza cómo se relacionan los conceptos entre sí.",
  },
];

export default function TopicOverviewPage() {
  const { topic } = useTopicContext();

  return (
    <div>
      <Card style={{ marginBottom: 24 }}>
        {topic.description && (
          <p className="text-soft" style={{ fontSize: 14.5, lineHeight: 1.6, marginBottom: 14 }}>
            {topic.description}
          </p>
        )}
        <p className="text-muted" style={{ fontSize: 13.5 }}>{masteryLevelCopy[topic.masteryLevel]}</p>

        <div className="row gap-lg" style={{ marginTop: 20, flexWrap: "wrap" }}>
          <div>
            <span className="text-muted" style={{ fontSize: 12.5 }}>
              Preguntas respondidas
            </span>
            <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 18 }}>{topic.questionsAnswered}</p>
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: 12.5 }}>
              Exámenes completados
            </span>
            <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 18 }}>{topic.examsCompleted}</p>
          </div>
          <div>
            <span className="text-muted" style={{ fontSize: 12.5 }}>
              Fuente
            </span>
            <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 18 }}>
              {topic.sourceType === "pdf" ? "PDF" : "Texto"}
            </p>
          </div>
        </div>
      </Card>

      <div className="topic-grid">
        {quickLinks.map(({ to, icon: Icon, title, desc }) => (
          <Link key={to} to={to} className="topic-card">
            <div className="source-choice-icon" style={{ width: 44, height: 44 }}>
              <Icon size={20} />
            </div>
            <div>
              <h3 className="topic-card-title">{title}</h3>
              <p className="text-muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
            <span className="row" style={{ gap: 6, color: "var(--blue)", fontSize: 13, fontWeight: 600 }}>
              Ir a {title.toLowerCase()}
              <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
