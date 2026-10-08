import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { InstantaneaProgreso } from "../../tipos";

type Vista = "dominio" | "practica";

const marcaEje = { fontSize: 12, fill: "var(--chart-axis)" };
const estiloTooltip = {
  borderRadius: 12,
  border: "1px solid var(--color-border)",
  background: "var(--color-surface-elevated)",
  color: "var(--color-text)",
  boxShadow: "var(--shadow-md)",
  fontSize: 13,
};

interface PropsGraficaEvolucion {
  evolucion: InstantaneaProgreso[];
  semanal: { semana: string; respondida: number }[];
}

/** Una sola gráfica con dos vistas, en lugar de varias tarjetas de gráficos. */
export default function GraficaEvolucion({ evolucion, semanal }: PropsGraficaEvolucion) {
  const [vista, establecerVista] = useState<Vista>("dominio");

  return (
    <div className="evolution">
      <div className="evolution-head">
        <p>{vista === "dominio" ? "Promedio de dominio de todos tus temas." : "Preguntas respondidas cada semana."}</p>
        <div className="seg seg-sm" role="tablist" aria-label="Vista de la gráfica">
          <button role="tab" aria-selected={vista === "dominio"} className={`seg-btn ${vista === "dominio" ? "active" : ""}`} onClick={() => establecerVista("dominio")}>
            Dominio
          </button>
          <button role="tab" aria-selected={vista === "practica"} className={`seg-btn ${vista === "practica" ? "active" : ""}`} onClick={() => establecerVista("practica")}>
            Práctica
          </button>
        </div>
      </div>

      <div className="evolution-chart" key={vista}>
        <ResponsiveContainer width="100%" height={240}>
          {vista === "dominio" ? (
            <AreaChart data={evolucion} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="masteryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="date" tick={marcaEje} axisLine={false} tickLine={false} />
              <YAxis tick={marcaEje} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={estiloTooltip} formatter={(v) => [`${v}%`, "Dominio"]} />
              <Area type="monotone" dataKey="masteryAverage" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#masteryFill)" />
            </AreaChart>
          ) : (
            <BarChart data={semanal} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
              <XAxis dataKey="week" tick={marcaEje} axisLine={false} tickLine={false} />
              <YAxis tick={marcaEje} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={estiloTooltip} cursor={{ fill: "var(--color-primary-tint)" }} formatter={(v) => [v, "Preguntas"]} />
              <Bar dataKey="answered" fill="var(--chart-1)" radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
