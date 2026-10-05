import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, BookOpen, TrendingUp, X, Sparkles, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useSidebar } from "../hooks/useSidebar";
import LogoMark from "./Logo";

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/topics", label: "Mis estudios", icon: BookOpen },
  { to: "/progress", label: "Progreso", icon: TrendingUp },
];

export default function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { collapsed, toggleCollapsed } = useSidebar();

  return (
    <>
      {mobileOpen && <div className="sidebar-backdrop" onClick={onCloseMobile} />}
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""} ${collapsed ? "collapsed" : ""}`}>
        <button className="sidebar-mobile-close" onClick={onCloseMobile} aria-label="Cerrar menú">
          <X size={16} />
        </button>

        <div className="sidebar-brand">
          <LogoMark size={36} />
          <span className="sidebar-brand-name">Cursa</span>
          <button
            className="sidebar-collapse-btn hide-mobile"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir menú" : "Minimizar menú"}
            title={collapsed ? "Expandir menú" : "Minimizar menú"}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <span className="sidebar-section-label">Plataforma</span>
        <nav className="sidebar-nav" aria-label="Principal">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              onClick={onCloseMobile}
              aria-label={label}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{label}</span>
              {collapsed && <span className="sidebar-tooltip">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <Link to="/study/new" className="sidebar-help-card" onClick={onCloseMobile}>
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
