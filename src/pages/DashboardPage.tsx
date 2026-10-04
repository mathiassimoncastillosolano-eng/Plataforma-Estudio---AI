import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  BookMarked,
  Clock,
  HelpCircle,
  Target,
  BookOpen,
  ClipboardCheck,
  Share2,
  FilePlus2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import * as studyService from "../services/studyService";
import * as progressService from "../services/progressService";
import type { DashboardStats, StudyTopic } from "../types";
import { recentActivity, type ActivityKind } from "../data/activities";
import { masteryByCategory } from "../data/progress";
import StatCard from "../components/StatCard";
import StudyTopicCard from "../components/StudyTopicCard";
import MasteryGauge from "../components/MasteryGauge";
import Card from "../components/Card";
import { LoadingState, ErrorState, EmptyState } from "../components/States";
import { SkeletonGrid, SkeletonStatRow, SkeletonText } from "../components/Skeleton";

const activityIcon: Record<ActivityKind, typeof BookOpen> = {
  summary: BookOpen,
  questions: HelpCircle,
  exam: ClipboardCheck,
  mindmap: Share2,
  "topic-created": FilePlus2,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<StudyTopic[] | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  async function load() {
    setStatus("loading");
    try {
      const [topicsResult, statsResult] = await Promise.all([
        studyService.getStudyTopics(),
        progressService.getDashboardStats(),
      ]);
      setTopics(topicsResult);
      setStats(statsResult);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  if (status === "loading") {
    return (
      <div>
        <div className="dashboard-greeting" style={{ marginBottom: 22 }}>
          <SkeletonText width={220} height={26} />
          <div style={{ marginTop: 10 }}>
            <SkeletonText width={280} height={14} />
          </div>
        </div>
        <SkeletonStatRow />
        <div style={{ marginTop: 30 }}>
          <SkeletonGrid count={4} />
        </div>
      </div>
    );
  }
  if (status === "error") return <ErrorState onRetry={load} />;

  const inProgress = (topics ?? []).filter((t) => t.mastery > 0 && t.mastery < 95).slice(0, 4);
  const weakestTopics = [...(topics ?? [])].sort((a, b) => a.mastery - b.mastery).slice(0, 2);

  return (
    <div>
      <div className="dashboard-greeting">
        <h1>
          {greeting}, {user?.firstName} 👋
        </h1>
        <p>Continúa aprendiendo y alcanza tus objetivos.</p>
      </div>

      <div className="cta-card">
        <div>
          <h2>¿Qué quieres aprender hoy?</h2>
          <p>Sube un PDF o pega tu contenido y deja que la IA prepare resúmenes, preguntas y un examen para ti.</p>
        </div>
        <Link to="/study/new" className="btn btn-primary btn-lg">
          <Plus size={17} />
          Nuevo tema de estudio
        </Link>
      </div>

      {stats && (
        <div className="stat-grid">
          <StatCard icon={<BookMarked size={17} />} value={String(stats.topicsStudied)} label="Temas estudiados" />
          <StatCard icon={<Clock size={17} />} value={`${stats.studyHours} h`} label="Horas de estudio" />
          <StatCard icon={<HelpCircle size={17} />} value={String(stats.questionsAnswered)} label="Preguntas respondidas" />
          <StatCard icon={<Target size={17} />} value={`${stats.averageMastery}%`} label="Dominio promedio" />
        </div>
      )}

      <div className="dashboard-grid">
        <div>
          <div className="section-heading">
            <h2>Continúa estudiando</h2>
            <Link to="/topics" className="text-muted" style={{ fontSize: 13, fontWeight: 600 }}>
              Ver todos
            </Link>
          </div>

          {inProgress.length > 0 ? (
            <div className="topic-grid" style={{ marginBottom: 30 }}>
              {inProgress.map((topic) => (
                <StudyTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 30 }}>
              <EmptyState
                title="Todavía no tienes temas de estudio."
                description="Crea tu primer tema para que la IA comience a generar recursos de estudio."
                action={
                  <Link to="/study/new" className="btn btn-primary">
                    Crear primer tema
                  </Link>
                }
              />
            </div>
          )}

          {weakestTopics.length > 0 && (
            <>
              <div className="section-heading">
                <h2>Recomendado para ti</h2>
              </div>
              <div className="stack gap-sm">
                {weakestTopics.map((t) => (
                  <Link key={t.id} to={`/study/${t.id}/questions`} className="recommend-card">
                    <div className="recommend-card-icon">
                      <AlertCircle size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, color: "var(--color-text)", fontSize: 13.5 }}>{t.title}</p>
                      <p className="text-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                        Dominio actual {t.mastery}% · practica unas preguntas para reforzarlo
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-muted" />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="stack gap-md">
          <Card className="summary-panel">
            <span className="card-subtitle" style={{ marginTop: 0 }}>
              Tu progreso general
            </span>
            <MasteryGauge value={stats?.averageMastery ?? 0} label="Dominio promedio" size={132} />
            <div className="summary-panel-breakdown">
              {masteryByCategory.map((c) => (
                <div key={c.category} className="summary-panel-row">
                  <span className="text-soft">{c.category}</span>
                  <strong style={{ color: "var(--color-text)" }}>{c.mastery}%</strong>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Actividad reciente</h3>
            <div className="activity-list">
              {recentActivity.map((a) => {
                const Icon = activityIcon[a.kind];
                return (
                  <div className="activity-item" key={a.id}>
                    <div className="activity-icon">
                      <Icon size={15} />
                    </div>
                    <div>
                      <p className="activity-title">
                        <strong>{a.topicTitle}</strong> — {a.description}
                      </p>
                      <p className="activity-time">{a.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
