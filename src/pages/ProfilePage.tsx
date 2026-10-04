import { useEffect, useState } from "react";
import { Mail, Calendar, BookMarked, Clock, HelpCircle, Target, GraduationCap } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import * as progressService from "../services/progressService";
import * as studyService from "../services/studyService";
import type { DashboardStats, StudyTopic } from "../types";
import Avatar from "../components/Avatar";
import Card from "../components/Card";
import StatCard from "../components/StatCard";
import Badge from "../components/Badge";
import { SkeletonText } from "../components/Skeleton";

export default function ProfilePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topics, setTopics] = useState<StudyTopic[] | null>(null);

  useEffect(() => {
    progressService.getDashboardStats().then(setStats);
    studyService.getStudyTopics().then(setTopics);
  }, []);

  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categories = Array.from(new Set((topics ?? []).map((t) => t.category)));

  return (
    <div className="flow-shell" style={{ maxWidth: 820 }}>
      <div className="profile-header">
        <Avatar firstName={user.firstName} lastName={user.lastName} size={68} />
        <div>
          <div className="row gap-xs" style={{ marginBottom: 4 }}>
            <h1 style={{ fontSize: 21 }}>
              {user.firstName} {user.lastName}
            </h1>
            <Badge tone="blue">Estudiante</Badge>
          </div>
          <p className="text-muted" style={{ fontSize: 13.5 }}>{user.email}</p>
        </div>
      </div>

      {stats ? (
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          <StatCard icon={<BookMarked size={17} />} value={String(stats.topicsStudied)} label="Temas estudiados" />
          <StatCard icon={<Clock size={17} />} value={`${stats.studyHours} h`} label="Horas de estudio" />
          <StatCard icon={<HelpCircle size={17} />} value={String(stats.questionsAnswered)} label="Preguntas respondidas" />
          <StatCard icon={<Target size={17} />} value={`${stats.averageMastery}%`} label="Dominio promedio" />
        </div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: 28 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="skeleton-card" key={i}>
              <SkeletonText width={40} height={16} />
            </div>
          ))}
        </div>
      )}

      <div className="profile-grid">
        <Card>
          <h3 style={{ fontSize: 15.5, marginBottom: 16 }}>Información personal</h3>
          <div className="profile-stat-row">
            <span className="row gap-sm text-muted">
              <Mail size={15} /> Correo
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{user.email}</span>
          </div>
          <div className="profile-stat-row">
            <span className="row gap-sm text-muted">
              <Calendar size={15} /> Miembro desde
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{joinDate}</span>
          </div>
          <div className="profile-stat-row">
            <span className="row gap-sm text-muted">
              <GraduationCap size={15} /> Rol
            </span>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>Estudiante</span>
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 15.5, marginBottom: 16 }}>Información académica</h3>
          <p className="text-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Áreas en las que estás estudiando actualmente.
          </p>
          {categories.length > 0 ? (
            <div className="row gap-xs" style={{ flexWrap: "wrap" }}>
              {categories.map((c) => (
                <Badge key={c} tone="neutral">
                  {c}
                </Badge>
              ))}
            </div>
          ) : (
            <SkeletonText width="70%" />
          )}
          <div style={{ marginTop: 18 }} className="profile-stat-row">
            <span className="text-muted">Temas activos</span>
            <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{topics?.length ?? "—"}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
