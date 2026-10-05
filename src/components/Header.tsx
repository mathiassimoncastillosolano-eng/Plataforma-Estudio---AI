import { Menu } from "lucide-react";
import UserMenu from "./UserMenu";
import NotificationsMenu from "./NotificationsMenu";
import AppearanceMenu from "./AppearanceMenu";
import HeaderSearch from "./HeaderSearch";

export default function Header({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  return (
    <header className="app-header">
      <div className="row" style={{ gap: 14, flex: 1, minWidth: 0 }}>
        <button className="menu-toggle" onClick={onOpenMobileMenu} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <HeaderSearch />
      </div>

      <div className="header-actions">
        <AppearanceMenu />
        <NotificationsMenu />
        <UserMenu />
      </div>
    </header>
  );
}
