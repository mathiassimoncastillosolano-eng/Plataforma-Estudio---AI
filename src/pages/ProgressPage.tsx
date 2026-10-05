import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import * as progressService from "../services/progressService";
import * as examService from "../services/examService";
import type { DashboardStats, ProgressSnapshot } from "../types";
import type { PastExam } from "../data/exams";
import Card from "../components/Card";
import MasteryGauge from "../components/MasteryGauge";
import { LoadingState, ErrorState } from "../components/States";

export default function ProgressPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [evolution, setEvolution] = useState<ProgressSnapshot[]>([]);
  const [weekly, setWeekly] = useState<{ week: string; answered: number }[]>([]);
  const [byCategory, setByCategory] = useState<{ category: string; mastery: number }[]>([]);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  async function load() {
    setStatus("loading");
    try {
      const [s, e, w, c, exams] = await Promise.all([
        progressService.getDashboardStats(),
        progressService.getMasteryEvolution(),
        progressService.getQuestionsPerWeek(),
        progressService.getMasteryByCategory(),
        examService.getPastExams(),
      ]);
      setStats(s);
      setEvolution(e);
      setWeekly(w);
      setByCategory(c);
      setPastExams(exams);
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (status === "loading") return <LoadingState message="Cargando tu progreso..." />;
  if (status === "error" || !stats) return <ErrorState onRetry={load} />;

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 6 }}>Mi progreso</h1>
      <p className="text-muted" style={{ fontSize: 14, marginBottom: 24 }}>
        Un vistazo a tu evolución como estudiante en Cursa.
      </p>

      <div className="row gap-lg" style={{ alignItems: "stretch", flexWrap: "wrap", marginBottom: 8 }}>
        <Card className="row gap-lg" style={{ flex: "1 1 260px", alignItems: "center" }}>
          <MasteryGauge value={stats.averageMastery} label="Dominio promedio" size={110} />
          <div>
            <p className="text-muted" style={{ fontSize: 13 }}>Dominio promedio</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--color-text)" }}>
              {stats.averageMastery}%
            </p>
            <p className="text-muted" style={{ fontSize: 12.5, marginTop: 4 }}>
              Basado en {stats.topicsStudied} temas estudiados
            </p>
          </div>
        </Card>
      </div>

      <div className="progress-charts-grid">
        <Card className="chart-card">
          <h3>Evolución del dominio</h3>
          <p>Promedio de dominio a lo largo del tiempo, en todos tus temas.</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolution}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface-elevated)", color: "var(--color-text)", boxShadow: "var(--shadow-md)", fontSize: 13 }} cursor={{ fill: "var(--color-primary-tint)" }} />
              <Line type="monotone" dataKey="masteryAverage" stroke="var(--chart-1)" strokeWidth={3} dot={false} name="Dominio %" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3>Dominio por categoría</h3>
          <p>Cómo te va en cada área de estudio.</p>
          <div className="stack gap-md">
            {byCategory.map((c) => (
              <div key={c.category}>
                <div className="row-between" style={{ marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{c.category}</span>
                  <span className="text-muted">{c.mastery}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${c.mastery}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="progress-charts-grid" style={{ marginTop: 18 }}>
        <Card className="chart-card">
          <h3>Preguntas respondidas por semana</h3>
          <p>Tu constancia practicando preguntas.</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weekly}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--chart-axis)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", background: "var(--color-surface-elevated)", color: "var(--color-text)", boxShadow: "var(--shadow-md)", fontSize: 13 }} cursor={{ fill: "var(--color-primary-tint)" }} />
              <Bar dataKey="answered" fill="var(--chart-1)" radius={[6, 6, 0, 0]} name="Preguntas" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="chart-card">
          <h3>Exámenes recientes</h3>
          <p>Resultados de tus últimas pruebas completadas.</p>
          <div className="stack gap-sm">
            {pastExams.map((exam) => (
              <div key={exam.id} className="row-between" style={{ fontSize: 13.5, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "var(--color-text)" }}>{exam.topicTitle}</div>
                  <div className="text-muted" style={{ fontSize: 12 }}>{exam.date}</div>
                </div>
                <strong style={{ color: exam.scorePercent >= 70 ? "var(--green)" : "var(--amber)" }}>
                  {exam.scorePercent}%
                </strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
