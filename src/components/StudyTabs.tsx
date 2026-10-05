import { NavLink } from "react-router-dom";
import { BookOpen, ClipboardCheck, HelpCircle, Network } from "lucide-react";

const tabs = [
  { to: "summary", label: "Resumen", icon: BookOpen },
  { to: "questions", label: "Preguntas", icon: HelpCircle },
  { to: "exam", label: "Prueba", icon: ClipboardCheck },
  { to: "mindmap", label: "Mapa conceptual", icon: Network },
];

/** Pestañas del tema (Resumen · Preguntas · Prueba · Mapa conceptual). */
export default function StudyTabs({ topicId }: { topicId: string }) {
  return (
    <nav className="tab-nav study-tabs" aria-label="Secciones del tema">
      {tabs.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={`/study/${topicId}/${to}`} className={({ isActive }) => (isActive ? "active" : "")}>
          <Icon size={16} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
