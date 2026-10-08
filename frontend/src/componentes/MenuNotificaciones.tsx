import { useRef, useState } from "react";
import { Bell, Calendar, Trophy, ClipboardCheck, Megaphone } from "lucide-react";
import { useClicFuera } from "../hooks/useClicFuera";
import { notificaciones as notificacionesIniciales, type NotificacionApp, type TipoNotificacion } from "../datos/notificaciones";

const iconoTipo: Record<TipoNotificacion, typeof Bell> = {
  recordatorio: Calendar,
  logro: Trophy,
  prueba: ClipboardCheck,
  sistema: Megaphone,
};

export default function MenuNotificaciones() {
  const [elementos, establecerElementos] = useState<NotificacionApp[]>(notificacionesIniciales);
  const [abierto, establecerAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const noLeidas = elementos.filter((n) => !n.leida).length;

  useClicFuera(ref as React.RefObject<HTMLElement>, () => establecerAbierto(false), abierto);

  function marcarTodoLeido() {
    establecerElementos((previo) => previo.map((n) => ({ ...n, leida: true })));
  }

  function marcarLeido(id: string) {
    establecerElementos((previo) => previo.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="header-icon-btn"
        onClick={() => establecerAbierto((o) => !o)}
        aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`}
        aria-haspopup="menu"
        aria-expanded={abierto}
      >
        <Bell size={18} />
        {noLeidas > 0 && <span className="dot" />}
      </button>

      {abierto && (
        <div className="dropdown-panel notif-panel" role="menu">
          <div className="notif-panel-header">
            <strong>Notificaciones</strong>
            {noLeidas > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={marcarTodoLeido}>
                Marcar todo leído
              </button>
            )}
          </div>

          {elementos.length === 0 ? (
            <div className="dropdown-empty">No tienes notificaciones nuevas.</div>
          ) : (
            <div className="notif-list">
              {elementos.map((n) => {
                const Icono = iconoTipo[n.tipo];
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${n.leida ? "" : "unread"}`}
                    onClick={() => marcarLeido(n.id)}
                    role="menuitem"
                  >
                    <span className="notif-icon">
                      <Icono size={15} />
                    </span>
                    <div>
                      <div className="notif-title">{n.titulo}</div>
                      <div className="notif-time">{n.tiempo}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
