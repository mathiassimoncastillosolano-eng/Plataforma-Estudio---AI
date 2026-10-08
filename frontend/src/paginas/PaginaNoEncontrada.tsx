import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "../componentes/Estados";

export default function PaginaNoEncontrada() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <EmptyState
        icono={<Compass size={24} />}
        titulo="Página no encontrada"
        descripcion="La página que buscas no existe o fue movida."
        accion={
          <Link to="/panel" className="btn btn-primary">
            Volver al dashboard
          </Link>
        }
      />
    </div>
  );
}
