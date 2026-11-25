import { Link } from "react-router-dom";
import { FileText, Lock } from "lucide-react";
import type { ModuloEstudio } from "../../datos/modulosEstudio";

export default function ModuloBloqueado({ idTema, modulo, mensaje }: { idTema: string; modulo: ModuloEstudio; mensaje: string }) {
  return (
    <div className="modulo-bloqueado" data-tono={modulo.tono} role="status">
      <span className="modulo-bloqueado-icono" aria-hidden="true">
        <Lock size={30} strokeWidth={1.8} />
      </span>
      <h3>{modulo.etiqueta} aún no está disponible</h3>
      <p>{mensaje}. Las preguntas y las pruebas se crean a partir de tu resumen, y así tienen mucha mejor calidad.</p>
      <Link to={`/estudio/${idTema}/resumen`} className="btn btn-primary">
        <FileText size={16} aria-hidden="true" />
        Ir al resumen
      </Link>
    </div>
  );
}
