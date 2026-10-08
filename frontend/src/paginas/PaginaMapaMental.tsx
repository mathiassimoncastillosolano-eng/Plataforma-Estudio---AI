import { useEffect, useState } from "react";
import { useContextoTema } from "../disposiciones/contextoTema";
import * as aiService from "../servicios/servicioIa";
import type { ConceptoClave, MapaMental } from "../tipos";
import { EstadoCarga, ErrorState } from "../componentes/Estados";
import MapaConceptual from "../componentes/MapaConceptual";

export default function PaginaMapaMental() {
  const { tema } = useContextoTema();
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [mapa, establecerMapa] = useState<MapaMental | null>(null);
  const [conceptos, establecerConceptos] = useState<ConceptoClave[]>([]);

  async function cargar() {
    establecerEstado("cargando");
    try {
      const [m, informacion] = await Promise.all([aiService.generarMapaMental(tema.id, tema.titulo), aiService.obtenerConceptosTema(tema.id, tema.titulo)]);
      establecerMapa(m);
      establecerConceptos(informacion.conceptos);
      establecerEstado("exito");
    } catch {
      establecerEstado("error");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema.id]);

  if (estado === "cargando") return <EstadoCarga mensaje="Generando mapa conceptual..." />;
  if (estado === "error" || !mapa) return <ErrorState alReintentar={cargar} />;

  // Los cambios del usuario viven mientras navega; "Regenerar" restaura el mapa original.
  return <MapaConceptual mapa={mapa} conceptos={conceptos} alRegenerar={() => establecerMapa({ ...mapa })} />;
}
