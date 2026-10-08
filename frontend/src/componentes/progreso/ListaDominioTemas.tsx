import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import type { TemaEstudio } from "../../tipos";
import { etiquetasNivelDominio } from "../../datos/temasEstudio";
import BarraProgreso from "../BarraProgreso";

/** Dominio de cada tema, de mayor a menor. Cada fila lleva al tema. */
export default function ListaDominioTemas({ temas }: { temas: TemaEstudio[] }) {
  const ordenados = [...temas].sort((a, b) => b.dominio - a.dominio);
  return (
    <ul className="mastery-list stagger">
      {ordenados.map((t) => (
        <li key={t.id}>
          <Link to={`/estudio/${t.id}/resumen`} className="mastery-row">
            <div className="mastery-row-main">
              <span className="mastery-row-title">{t.titulo}</span>
              <span className="mastery-row-sub">
                {t.categoria} · <span className={`level-tag level-${t.nivelDominio}`}>{etiquetasNivelDominio[t.nivelDominio]}</span>
              </span>
            </div>
            <div className="mastery-row-bar">
              <BarraProgreso valor={t.dominio} />
            </div>
            <strong className="mastery-row-pct mono">{t.dominio}%</strong>
            <ChevronRight size={16} className="mastery-row-chevron" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
