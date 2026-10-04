import { useRef, useState } from "react";
import { Bell, Calendar, Trophy, ClipboardCheck, Megaphone } from "lucide-react";
import { useClickOutside } from "../hooks/useClickOutside";
import { notifications as initialNotifications, type AppNotification, type NotificationKind } from "../data/notifications";

const kindIcon: Record<NotificationKind, typeof Bell> = {
  reminder: Calendar,
  achievement: Trophy,
  exam: ClipboardCheck,
  system: Megaphone,
};

export default function NotificationsMenu() {
  const [items, setItems] = useState<AppNotification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = items.filter((n) => !n.read).length;

  useClickOutside(ref as React.RefObject<HTMLElement>, () => setOpen(false), open);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="dropdown" ref={ref}>
      <button
        className="header-icon-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unreadCount > 0 && <span className="dot" />}
      </button>

      {open && (
        <div className="dropdown-panel notif-panel" role="menu">
          <div className="notif-panel-header">
            <strong>Notificaciones</strong>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ padding: "4px 8px" }} onClick={markAllRead}>
                Marcar todo leído
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <div className="dropdown-empty">No tienes notificaciones nuevas.</div>
          ) : (
            <div className="notif-list">
              {items.map((n) => {
                const Icon = kindIcon[n.kind];
                return (
                  <div
                    key={n.id}
                    className={`notif-item ${n.read ? "" : "unread"}`}
                    onClick={() => markRead(n.id)}
                    role="menuitem"
                  >
                    <span className="notif-icon">
                      <Icon size={15} />
                    </span>
                    <div>
                      <div className="notif-title">{n.title}</div>
                      <div className="notif-time">{n.time}</div>
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
