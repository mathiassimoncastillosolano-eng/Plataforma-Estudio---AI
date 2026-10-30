import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import { cargarUltimoResultado } from "../servicios/servicioPruebas";
import type { ResultadoCompleto } from "../tipos/prueba";
import Boton from "../componentes/Boton";
import { EmptyState } from "../componentes/Estados";
import VistaResultadoPrueba from "../componentes/prueba/VistaResultadoPrueba";

export default function PaginaResultados() {
  const { tema } = useContextoTema();
  const ubicacion = useLocation();
  const navegar = useNavigate();
  // El resultado llega por navegación; si se refresca la página, se recupera de la sesión.
  const datos = (ubicacion.state as ResultadoCompleto | null) ?? cargarUltimoResultado(tema.id);

  if (!datos?.resultado) {
    return (
      <EmptyState
        titulo="Todavía no tienes un resultado que mostrar"
        descripcion="Completa una prueba para ver aquí tu resultado y tu retroalimentación."
        accion={<Boton onClick={() => navegar(`/estudio/${tema.id}/prueba`)}>Ir a la prueba</Boton>}
        icono={<AlertTriangle size={22} />}
      />
    );
  }

  return <VistaResultadoPrueba datos={datos} idTema={tema.id} />;
}
