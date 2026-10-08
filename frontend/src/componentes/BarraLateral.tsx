import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, X, Sparkles, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useBarraLateral } from "../hooks/useBarraLateral";
import MarcaLogo from "./MarcaLogo";

interface PropsBarraLateral {
  movilAbierto: boolean;
  alCerrarMovil: () => void;
}

export const elementosNavegacion = [
  { to: "/panel", etiqueta: "Dashboard", icono: LayoutDashboard },
  { to: "/temas", etiqueta: "Mis estudios", icono: BookOpen },
  { to: "/progreso", etiqueta: "Progreso", icono: TrendingUp },
];

export default function BarraLateral({ movilAbierto, alCerrarMovil }: PropsBarraLateral) {
  const { contraida, alternarContraido } = useBarraLateral();

  return (
    <>
      {movilAbierto && <div className="sidebar-backdrop" onClick={alCerrarMovil} />}
      <aside className={`sidebar ${movilAbierto ? "mobile-open" : ""} ${contraida ? "collapsed" : ""}`}>
        <button className="sidebar-mobile-close" onClick={alCerrarMovil} aria-label="Cerrar menú">
          <X size={16} />
        </button>

        <div className="sidebar-brand">
          <MarcaLogo tamano={36} />
          <span className="sidebar-brand-name">Cursa</span>
          <button
            className="sidebar-collapse-btn hide-mobile"
            onClick={alternarContraido}
            aria-label={contraida ? "Expandir menú" : "Minimizar menú"}
            title={contraida ? "Expandir menú" : "Minimizar menú"}
          >
            {contraida ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <span className="sidebar-section-label">Plataforma</span>
        <nav className="sidebar-nav" aria-label="Principal">
          {elementosNavegacion.map(({ to, etiqueta, icono: Icono }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive: estaActivo }) => `sidebar-link ${estaActivo ? "active" : ""}`}
              onClick={alCerrarMovil}
              aria-label={etiqueta}
            >
              <Icono size={19} strokeWidth={2} />
              <span>{etiqueta}</span>
              {contraida && <span className="sidebar-tooltip">{etiqueta}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <Link to="/estudio/nuevo" className="sidebar-help-card" onClick={alCerrarMovil}>
          <span className="sidebar-help-icon">
            <Sparkles size={16} />
          </span>
          <p>Sube un PDF o pega tu contenido y deja que la IA prepare tu material de estudio.</p>
          <span className="sidebar-help-cta">
            Nuevo tema
            <ArrowRight size={14} />
          </span>
        </Link>
      </aside>
    </>
  );
}
