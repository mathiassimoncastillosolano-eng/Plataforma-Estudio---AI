import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import BottomNav from "../components/BottomNav";
import { useAuth } from "../hooks/useAuth";

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Las pantallas de un tema (resumen, preguntas, prueba, mapa) usan todo el ancho
  // disponible: el contenido de estudio es el protagonista.
  const studyMatch = location.pathname.match(/^\/study\/([^/]+)(?:\/([^/]+))?/);
  const isStudy = !!studyMatch && studyMatch[1] !== "new";
  const isCanvas = isStudy && studyMatch?.[2] === "mindmap";
  // En un tema, el layout persiste al cambiar de pestaña (no se vuelve a cargar el tema).
  const transitionKey = isStudy ? `study-${studyMatch![1]}` : location.pathname;

  return (
    <div className="app-shell">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="app-main">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <div className={`page-content page-transition ${isStudy ? "wide" : ""} ${isCanvas ? "canvas" : ""}`} key={transitionKey}>
          <Outlet />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
