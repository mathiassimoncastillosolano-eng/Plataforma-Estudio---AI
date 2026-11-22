import { Menu } from "lucide-react";
import MenuUsuario from "./MenuUsuario";
import MenuNotificaciones from "./MenuNotificaciones";
import MenuApariencia from "./MenuApariencia";
import BotonAyuda from "../buddy/ayuda/BotonAyuda";
import BuscadorEncabezado from "./BuscadorEncabezado";

export default function Encabezado({ alAbrirMenuMovil }: { alAbrirMenuMovil: () => void }) {
  return (
    <header className="app-header">
      <div className="row" style={{ gap: 14, flex: 1, minWidth: 0 }}>
        <button className="menu-toggle" onClick={alAbrirMenuMovil} aria-label="Abrir menú">
          <Menu size={22} />
        </button>
        <BuscadorEncabezado />
      </div>

      <div className="header-actions">
        <BotonAyuda />
        <MenuApariencia />
        <MenuNotificaciones />
        <MenuUsuario />
      </div>
    </header>
  );
}
