import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { navItems } from "./Sidebar";

/** Barra de navegación inferior para móvil (mismas rutas que el Sidebar). */
export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `bottom-nav-link ${isActive ? "active" : ""}`}>
          <Icon size={20} />
          <span>{label === "Mis estudios" ? "Estudios" : label}</span>
        </NavLink>
      ))}
      <NavLink to="/study/new" className="bottom-nav-link cta">
        <Plus size={20} />
        <span>Nuevo</span>
      </NavLink>
    </nav>
  );
}
