import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { EmptyState } from "../components/States";

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <EmptyState
        icon={<Compass size={24} />}
        title="Página no encontrada"
        description="La página que buscas no existe o fue movida."
        action={
          <Link to="/dashboard" className="btn btn-primary">
            Volver al dashboard
          </Link>
        }
      />
    </div>
  );
}
