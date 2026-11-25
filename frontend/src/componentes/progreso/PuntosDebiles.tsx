import { Link } from "react-router-dom";
import { ArrowRight, TriangleAlert } from "lucide-react";
import type { PuntoDebil } from "../../utilidades/panelProgreso";

interface Props {
  puntos: PuntoDebil[];
}

const NIVELES: Record<string, string> = { facil: "fáciles", media: "de dificultad media", dificil: "difíciles" };

function descripcion(punto: PuntoDebil): string {
  if (punto.motivo === "sin-practica") return "Aún no lo has practicado y su dominio es bajo.";
  const base = `Aciertas el ${punto.precision}% de sus preguntas.`;
  return punto.nivelDebil ? `${base} Fallas más en las ${NIVELES[punto.nivelDebil]}.` : base;
}

export default function PuntosDebiles({ puntos }: Props) {
  if (puntos.length === 0) return <p className="dash-vacio">No detectamos temas débiles por ahora. Sigue practicando para mantenerlo así.</p>;
  return (
    <ul className="dash-debiles">
      {puntos.map((punto) => (
        <li key={punto.idTema}>
          <Link to={`/estudio/${punto.idTema}/preguntas`} className="dash-debil">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>
              <strong>{punto.titulo}</strong>
              <span className="dash-debil-texto">{descripcion(punto)}</span>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
