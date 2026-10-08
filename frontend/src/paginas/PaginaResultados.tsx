import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import { cargarUltimoResultado, type ResultadoAlmacenado } from "../servicios/servicioPruebas";
import Boton from "../componentes/Boton";
import { EmptyState } from "../componentes/Estados";
import VistaResultadoPrueba from "../componentes/prueba/VistaResultadoPrueba";

export default function PaginaResultados() {
  const { tema } = useContextoTema();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  // El resultado llega por navegación; si se refresca la página, se recupera de la sesión.
  const estadoGlobal = (ubicacion.state as ResultadoAlmacenado | null) ?? cargarUltimoResultado(tema.id);

  if (!estadoGlobal) {
    return (
      <EmptyState
        titulo="Todavía no tienes un resultado que mostrar"
        descripcion="Completa una prueba para ver aquí tu resultado y tu retroalimentación."
        accion={<Boton onClick={() => navegar(`/estudio/${tema.id}/prueba`)}>Ir a la prueba</Boton>}
        icono={<AlertTriangle size={22} />}
      />
    );
  }

  return <VistaResultadoPrueba resultado={estadoGlobal.resultado} preguntas={estadoGlobal.preguntas} intentos={estadoGlobal.intentos} idTema={tema.id} />;
}
