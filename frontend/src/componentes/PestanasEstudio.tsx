import { NavLink } from "react-router-dom";
import { BookOpen, ClipboardCheck, HelpCircle, Network } from "lucide-react";

const pestanas = [
  { to: "resumen", etiqueta: "Resumen", icono: BookOpen },
  { to: "preguntas", etiqueta: "Preguntas", icono: HelpCircle },
  { to: "prueba", etiqueta: "Prueba", icono: ClipboardCheck },
  { to: "mapa-mental", etiqueta: "Mapa conceptual", icono: Network },
];

/** Pestañas del tema (Resumen · Preguntas · Prueba · Mapa conceptual). */
export default function PestanasEstudio({ idTema }: { idTema: string }) {
  return (
    <nav className="tab-nav study-tabs" aria-label="Secciones del tema">
      {pestanas.map(({ to, etiqueta, icono: Icono }) => (
        <NavLink key={to} to={`/estudio/${idTema}/${to}`} className={({ isActive: estaActivo }) => (estaActivo ? "active" : "")}>
          <Icono size={16} />
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
