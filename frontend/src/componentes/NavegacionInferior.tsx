import { NavLink } from "react-router-dom";
import { Plus } from "lucide-react";
import { elementosNavegacion } from "./BarraLateral";

/** Barra de navegación inferior para móvil (mismas rutas que el Sidebar). */
export default function NavegacionInferior() {
  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {elementosNavegacion.map(({ to, etiqueta, icono: Icono }) => (
        <NavLink key={to} to={to} className={({ isActive: estaActivo }) => `bottom-nav-link ${estaActivo ? "active" : ""}`}>
          <Icono size={20} />
          <span>{etiqueta === "Mis estudios" ? "Estudios" : etiqueta}</span>
        </NavLink>
      ))}
      <NavLink to="/estudio/nuevo" className="bottom-nav-link cta">
        <Plus size={20} />
        <span>Nuevo</span>
      </NavLink>
    </nav>
  );
}
