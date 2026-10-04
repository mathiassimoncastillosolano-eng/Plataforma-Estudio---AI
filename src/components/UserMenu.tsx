import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useClickOutside } from "../hooks/useClickOutside";
import Avatar from "./Avatar";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref as React.RefObject<HTMLElement>, () => setOpen(false), open);

  if (!user) return null;

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  function handleLogout() {
    setOpen(false);
    logout();
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="header-user-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menú de cuenta"
      >
        <Avatar firstName={user.firstName} lastName={user.lastName} />
        <div className="hide-mobile" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span className="header-user-name">
            {user.firstName} {user.lastName}
          </span>
          <span className="header-user-role">Estudiante</span>
        </div>
        <ChevronDown size={15} className="header-user-chevron hide-mobile" />
      </button>

      {open && (
        <div className="dropdown-panel" role="menu">
          <div className="dropdown-header">
            <div className="dropdown-header-name">
              {user.firstName} {user.lastName}
            </div>
            <div className="dropdown-header-email">{user.email}</div>
          </div>

          <button className="dropdown-item" role="menuitem" onClick={() => go("/profile")}>
            <User size={16} />
            Ver perfil
          </button>
          <button className="dropdown-item" role="menuitem" onClick={() => go("/settings")}>
            <Settings size={16} />
            Configuración
          </button>

          <div className="dropdown-divider" />

          <button className="dropdown-item danger" role="menuitem" onClick={handleLogout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
