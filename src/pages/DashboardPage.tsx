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
  ArrowRight,
  Play,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import * as studyService from "../services/studyService";
import * as progressService from "../services/progressService";
import type { DashboardStats, StudyTopic } from "../types";
import { recentActivity, type ActivityKind } from "../data/activities";
import { masteryByCategory } from "../data/progress";
import StudyTopicCard from "../components/StudyTopicCard";
import MasteryGauge from "../components/MasteryGauge";
import ProgressBar from "../components/ProgressBar";
import Card from "../components/Card";
import { ErrorState, EmptyState } from "../components/States";
import { SkeletonGrid, SkeletonText } from "../components/Skeleton";

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
      <div aria-busy="true" aria-label="Cargando tu espacio de estudio">
        <div className="dash-greeting">
          <SkeletonText width={240} height={28} />
          <div style={{ marginTop: 12 }}>
            <SkeletonText width={300} height={14} />
          </div>
        </div>
        <div className="skeleton" style={{ height: 224, borderRadius: "var(--radius-xl)" }} />
        <div className="skeleton" style={{ height: 82, marginTop: 28, borderRadius: "var(--radius-lg)" }} />
        <div className="dashboard-grid">
          <div className="dash-main">
            <SkeletonGrid count={2} />
          </div>
          <div className="dash-aside">
            <div className="skeleton" style={{ height: 300, borderRadius: "var(--radius-lg)" }} />
          </div>
        </div>
      </div>
    );
  }
  if (status === "error") return <ErrorState onRetry={load} />;

  const inProgress = (topics ?? []).filter((t) => t.mastery > 0 && t.mastery < 95).slice(0, 4);
  const weakestTopics = [...(topics ?? [])].sort((a, b) => a.mastery - b.mastery).slice(0, 2);

  // AHORA: el tema que el estudiante debería retomar
  const focusTopic = inProgress[0];
  // CONTINUAR: el resto de temas en progreso
  const otherTopics = inProgress.slice(1);

  return (
    <div>
      <div className="dash-greeting reveal">
        <h1>
          {greeting}, {user?.firstName}
        </h1>
        <p>
          {focusTopic
            ? "Esto es lo mejor que puedes hacer ahora para seguir avanzando."
            : "Continúa aprendiendo y alcanza tus objetivos."}
        </p>
      </div>

      {/* ───────── AHORA ───────── */}
      {focusTopic ? (
        <section className="continue-hero reveal" style={{ ["--i" as string]: 1 }} aria-labelledby="hero-title">
          <div className="continue-hero-body">
            <span className="eyebrow">Continúa donde lo dejaste</span>
            <h2 id="hero-title">{focusTopic.title}</h2>
            {focusTopic.description && <p className="continue-hero-desc">{focusTopic.description}</p>}
            <div className="continue-hero-meta">
              <span className="hero-chip">{focusTopic.category}</span>
              <span className="row" style={{ gap: 6 }}>
                <Clock size={14} aria-hidden="true" />
                {focusTopic.lastStudiedAt}
              </span>
              <span className="row" style={{ gap: 6 }}>
                <HelpCircle size={14} aria-hidden="true" />
                {focusTopic.questionsAnswered} preguntas
              </span>
            </div>
            <div className="continue-hero-progress">
              <div className="continue-hero-progress-row">
                <span>Dominio</span>
                <span>{focusTopic.mastery}%</span>
              </div>
              <ProgressBar value={focusTopic.mastery} />
            </div>
            <div className="continue-hero-actions">
              <Link to={`/study/${focusTopic.id}`} className="btn btn-hero btn-lg">
                <Play size={16} fill="currentColor" aria-hidden="true" />
                Continuar estudiando
              </Link>
              <Link to="/study/new" className="btn btn-hero-ghost btn-lg">
                <Plus size={17} aria-hidden="true" />
                Nuevo tema
              </Link>
            </div>
          </div>
          <div className="continue-hero-gauge">
            <MasteryGauge value={focusTopic.mastery} label="Dominio" size={148} strokeWidth={11} />
          </div>
        </section>
      ) : (
        <section className="continue-hero reveal" style={{ ["--i" as string]: 1 }} aria-labelledby="hero-title">
          <div className="continue-hero-body">
            <span className="eyebrow">Empieza hoy</span>
            <h2 id="hero-title">¿Qué quieres aprender hoy?</h2>
            <p className="continue-hero-desc">
              Sube un PDF o pega tu contenido y deja que la IA prepare resúmenes, preguntas y un examen para ti.
            </p>
            <div className="continue-hero-actions">
              <Link to="/study/new" className="btn btn-hero btn-lg">
                <Plus size={17} aria-hidden="true" />
                Nuevo tema de estudio
              </Link>
            </div>
          </div>
          <div className="hero-chips" aria-hidden="true">
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <BookOpen size={17} />
              </span>
              Resumen
            </span>
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <HelpCircle size={17} />
              </span>
              Preguntas
            </span>
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <ClipboardCheck size={17} />
              </span>
              Examen
            </span>
            <span className="hero-feature">
              <span className="hero-feature-icon">
                <Share2 size={17} />
              </span>
              Mapa conceptual
            </span>
          </div>
        </section>
      )}

      {/* ───────── PROGRESO ───────── */}
      {stats && (
        <section className="reveal" style={{ ["--i" as string]: 2 }} aria-label="Tu progreso en cifras">
          <div className="stat-strip">
            <div className="stat-item">
              <span className="stat-item-icon">
                <BookMarked size={19} aria-hidden="true" />
              </span>
              <div>
                <div className="stat-item-value">{stats.topicsStudied}</div>
                <div className="stat-item-label">Temas estudiados</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-item-icon">
                <Clock size={19} aria-hidden="true" />
              </span>
              <div>
                <div className="stat-item-value">{stats.studyHours} h</div>
                <div className="stat-item-label">Horas de estudio</div>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-item-icon">
                <HelpCircle size={19} aria-hidden="true" />
              </span>
              <div>
                <div className="stat-item-value">{stats.questionsAnswered}</div>
                <div className="stat-item-label">Preguntas respondidas</div>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="dashboard-grid">
        <div className="dash-main">
          {/* ───────── CONTINUAR ───────── */}
          <section className="reveal" style={{ ["--i" as string]: 3 }}>
            <div className="section-heading">
              <h2>{focusTopic ? "Sigue con tus otros temas" : "Continúa estudiando"}</h2>
              <Link to="/topics" className="link-arrow">
                Ver todos
                <ArrowRight size={14} className="icon-nudge" aria-hidden="true" />
              </Link>
            </div>

            {otherTopics.length > 0 ? (
              <div className="topic-grid stagger">
                {otherTopics.map((topic) => (
                  <StudyTopicCard key={topic.id} topic={topic} />
                ))}
              </div>
            ) : focusTopic ? (
              <p className="text-muted">Por ahora tu foco está en un solo tema. Crea otro cuando quieras sumar uno más.</p>
            ) : (
              <EmptyState
                title="Todavía no tienes temas de estudio."
                description="Crea tu primer tema para que la IA comience a generar recursos de estudio."
                action={
                  <Link to="/study/new" className="btn btn-primary">
                    Crear primer tema
                  </Link>
                }
              />
            )}
          </section>

          {/* ───────── DESCUBRIR ───────── */}
          {weakestTopics.length > 0 && (
            <section className="reveal" style={{ ["--i" as string]: 4 }}>
              <div className="section-heading">
                <h2>Recomendado para ti</h2>
              </div>
              <div className="stack gap-sm stagger">
                {weakestTopics.map((t) => (
                  <Link key={t.id} to={`/study/${t.id}/questions`} className="recommend-card">
                    <div className="recommend-card-icon">
                      <Target size={19} aria-hidden="true" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="recommend-card-title">{t.title}</p>
                      <p className="recommend-card-sub">
                        Dominio actual {t.mastery}% · practica unas preguntas para reforzarlo
                      </p>
                    </div>
                    <ArrowRight size={17} className="icon-nudge text-muted" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="dash-aside" aria-label="Resumen de tu avance">
          <Card className="summary-panel reveal" style={{ ["--i" as string]: 3 }}>
            <span className="eyebrow" style={{ marginBottom: 14 }}>
              Tu progreso general
            </span>
            <MasteryGauge value={stats?.averageMastery ?? 0} label="Dominio promedio" size={148} strokeWidth={11} />
            <div className="summary-panel-breakdown">
              {masteryByCategory.map((c) => (
                <div key={c.category}>
                  <div className="summary-panel-row">
                    <span className="text-soft">{c.category}</span>
                    <strong style={{ color: "var(--color-text)" }}>{c.mastery}%</strong>
                  </div>
                  <div className="summary-panel-bar">
                    <ProgressBar value={c.mastery} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <section className="reveal" style={{ ["--i" as string]: 4 }}>
            <div className="section-heading">
              <h2>Actividad reciente</h2>
            </div>
            <div className="activity-list">
              {recentActivity.map((a) => {
                const Icon = activityIcon[a.kind];
                return (
                  <div className="activity-item" key={a.id}>
                    <div className="activity-icon">
                      <Icon size={16} aria-hidden="true" />
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
          </section>
        </aside>
      </div>
    </div>
  );
}
