import { Link } from "react-router-dom";
import { ArrowRight, Clock, HelpCircle } from "lucide-react";
import type { StudyTopic } from "../types";
import ProgressBar from "./ProgressBar";
import Badge from "./Badge";
import { getTopicStatus, topicStatusLabels } from "../data/studyTopics";

export default function StudyTopicCard({ topic }: { topic: StudyTopic }) {
  const status = getTopicStatus(topic);

  return (
    <Link to={`/study/${topic.id}`} className="topic-card" style={{ textDecoration: "none" }}>
      <div className="topic-card-top-row">
        <Badge tone="blue">{topic.category}</Badge>
        <span className={`status-pill status-${status}`}>{topicStatusLabels[status]}</span>
      </div>

      <div>
        <h3 className="topic-card-title">{topic.title}</h3>
        {topic.description && (
          <p className="text-muted" style={{ fontSize: "var(--fs-caption)", marginTop: 6, lineHeight: 1.5 }}>
            {topic.description}
          </p>
        )}
      </div>

      <div>
        <div className="topic-card-progress-row">
          <span>Dominio</span>
          <span>{topic.mastery}%</span>
        </div>
        <div style={{ marginTop: 6 }}>
          <ProgressBar value={topic.mastery} />
        </div>
      </div>

      <div className="topic-card-meta">
        <span className="row gap-xs">
          <Clock size={13} aria-hidden="true" />
          {topic.lastStudiedAt}
        </span>
        <span className="row gap-xs">
          <HelpCircle size={13} aria-hidden="true" />
          {topic.questionsAnswered} preguntas
        </span>
      </div>

      <span className="btn btn-secondary btn-sm" style={{ justifyContent: "space-between" }}>
        Continuar estudiando
        <ArrowRight size={15} className="icon-nudge" aria-hidden="true" />
      </span>
    </Link>
  );
}
