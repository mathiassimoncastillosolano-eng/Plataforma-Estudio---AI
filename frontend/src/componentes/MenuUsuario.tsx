import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User as Usuario, Settings, LogOut } from "lucide-react";
import { useAutenticacion } from "../hooks/useAutenticacion";
import { useClicFuera } from "../hooks/useClicFuera";
import Avatar from "./Avatar";

export default function MenuUsuario() {
  const { usuario, cerrarSesion } = useAutenticacion();
  const navegar = useNavigate();
  const [abierto, establecerAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClicFuera(ref as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  if (!usuario) return null;

  function go(ruta: string) {
    establecerAbierto(false);
    navegar(ruta);
  }

  function manejarCierreSesion() {
    establecerAbierto(false);
    cerrarSesion();
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="header-user-trigger"
        onClick={() => establecerAbierto((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-label="Menú de cuenta"
      >
        <Avatar nombre={usuario.nombre} apellido={usuario.apellido} />
        <div className="hide-mobile" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span className="header-user-name">
            {usuario.nombre} {usuario.apellido}
          </span>
          <span className="header-user-role">Estudiante</span>
        </div>
        <ChevronDown size={15} className="header-user-chevron hide-mobile" />
      </button>

      {abierto && (
        <div className="dropdown-panel" role="menu">
          <div className="dropdown-header">
            <div className="dropdown-header-name">
              {usuario.nombre} {usuario.apellido}
            </div>
            <div className="dropdown-header-email">{usuario.correo}</div>
          </div>

          <button className="dropdown-item" role="menuitem" onClick={() => go("/perfil")}>
            <Usuario size={16} />
            Ver perfil
          </button>
          <button className="dropdown-item" role="menuitem" onClick={() => go("/configuracion")}>
            <Settings size={16} />
            Configuración
          </button>

          <div className="dropdown-divider" />

          <button className="dropdown-item danger" role="menuitem" onClick={manejarCierreSesion}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
