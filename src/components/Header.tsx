import { Search, Menu, Sun, Moon } from "lucide-react";
import UserMenu from "./UserMenu";
import NotificationsMenu from "./NotificationsMenu";
import { useTheme } from "../hooks/useTheme";

export default function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="app-header">
      <div className="row" style={{ gap: 14, flex: 1, minWidth: 0 }}>
        <button className="menu-toggle" onClick={onOpenMobileMenu} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <div className="header-search">
          <Search size={15} />
          <input placeholder="Buscar temas, preguntas..." aria-label="Buscar" />
          <kbd className="hide-mobile">/</kbd>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="header-icon-btn"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
