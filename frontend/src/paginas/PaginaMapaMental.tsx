import { useBuddy, usePresentacionModulo } from "../buddy/BuddyProvider";
import { celebracionHito } from "../buddy/mensajes";
import { useEffect, useRef, useState } from "react";
import { Network, Sparkles } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import * as aiService from "../servicios/servicioIa";
import { fueRevelado, huellaFuente, marcarRevelado, solicitarMapa } from "../servicios/generacionSegundoPlano";
import { TIEMPO_CARGA_PRECARGADA_MS, esperarMinimo } from "../utilidades/tiempoMinimo";
import { ErrorApi } from "../servicios/clienteApi";
import { guardarMapa, useSesion } from "../almacen/almacenSesion";
import { useAviso } from "../hooks/useAviso";
import type { ConceptoClave, MapaMental } from "../tipos";
import { EmptyState, ErrorState } from "../componentes/Estados";
import CargaModulo from "../componentes/CargaModulo";
import Boton from "../componentes/Boton";
import MapaConceptual from "../componentes/MapaConceptual";

const MENSAJE_ERROR = "No pudimos generar el mapa conceptual. Inténtalo de nuevo.";

/**
 * Mapa conceptual del tema. Si el estudiante aportó su fuente en esta sesión (texto o PDF) el mapa se
 * genera con IA a partir de ella; si no, se conserva el comportamiento anterior (mapas de ejemplo y de respaldo).
 */
export default function PaginaMapaMental() {
  usePresentacionModulo("mapa");
  const { tema } = useContextoTema();
  // Igual que en el resumen: en los temas con PDF la fuente es el documento; el texto guardado son solo indicaciones.
  const esPdf = tema.tipoFuente === "pdf";
  const texto = useSesion((s) => s.fuentes[tema.id]);
  const archivo = useSesion((s) => s.archivos[tema.id]) ?? null;
  const huella = huellaFuente(esPdf, texto, archivo);

  return huella ? <MapaDesdeFuente key={tema.id} huella={huella} esPdf={esPdf} texto={texto ?? ""} archivo={archivo} /> : <MapaDeEjemplo />;
}

interface PropsMapaDesdeFuente {
  huella: string;
  esPdf: boolean;
  texto: string;
  archivo: File | null;
}

function MapaDesdeFuente({ huella, esPdf, texto, archivo }: PropsMapaDesdeFuente) {
  const { tema } = useContextoTema();
  const { mostrarAviso } = useAviso();
  const guardado = useSesion((s) => s.mapas[tema.id]);
  const totalMapas = useSesion((s) => Object.keys(s.mapas).length);
  const { anunciar } = useBuddy();
  const [generando, establecerGenerando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);
  const turno = useRef(0);

  const mapa = guardado && guardado.huella === huella ? guardado.mapa : null;
  const claveRevelado = `mapa:${tema.id}`;
  const [revelado, establecerRevelado] = useState(() => fueRevelado(claveRevelado));

  async function generar(forzar = false) {
    const inicio = Date.now();
    const mio = ++turno.current;
    const yaListo = Boolean(mapa) && !forzar;
    establecerError(null);
    establecerGenerando(true);
    try {
      await solicitarMapa({ idTema: tema.id, titulo: tema.titulo, esPdf }, huella, texto, archivo, forzar);
      await esperarMinimo(inicio, TIEMPO_CARGA_PRECARGADA_MS);
      if (turno.current !== mio) return;
      if (totalMapas <= 1 && !revelado) anunciar(celebracionHito("primer-mapa"));
      marcarRevelado(claveRevelado);
      establecerRevelado(true);
      if (!yaListo) mostrarAviso("Mapa conceptual listo.");
    } catch (fallo) {
      if (turno.current !== mio) return;
      establecerError(fallo instanceof ErrorApi ? fallo.message : MENSAJE_ERROR);
    } finally {
      if (turno.current === mio) establecerGenerando(false);
    }
  }

  function cancelar() {
    turno.current += 1;
    establecerGenerando(false);
  }

  function regenerar() {
    // Los cambios del estudiante viven solo en el lienzo: regenerar los reemplaza por un mapa nuevo.
    if (window.confirm("Se generará un mapa nuevo con la IA y se perderán los cambios que hiciste en este. ¿Quieres continuar?")) generar(true);
  }

  if (generando) return <CargaModulo modulo="mapa" alCancelar={cancelar} />;
  if (error) return <ErrorState titulo="No pudimos generar el mapa conceptual." descripcion={error} alReintentar={() => generar()} />;
  if (!mapa || !revelado) {
    return (
      <EmptyState
        icono={<Network size={24} />}
        titulo="Genera el mapa conceptual de tu material"
        descripcion={`La IA analizará ${esPdf ? "tu PDF" : "tu texto"} y construirá un mapa con los conceptos, su definición y las relaciones entre ellos. Pulsa un concepto para ver su definición.`}
        accion={
          <Boton icono={<Sparkles size={16} />} onClick={() => generar()} data-tour="mapa-generar">
            Generar mapa conceptual
          </Boton>
        }
      />
    );
  }
  return <MapaConceptual mapa={mapa} conceptos={[]} alRegenerar={regenerar} origen="ia" titulo={tema.titulo} alEditar={(editado) => guardarMapa(tema.id, editado, huella)} />;
}

/** Comportamiento anterior, sin cambios: mapa de ejemplo del tema demo o mapa de respaldo. */
function MapaDeEjemplo() {
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

  if (estado === "cargando") return <CargaModulo modulo="mapa" />;
  if (estado === "error" || !mapa) return <ErrorState alReintentar={cargar} />;

  // Los cambios del usuario viven mientras navega; "Regenerar" restaura el mapa original.
  return <MapaConceptual mapa={mapa} conceptos={conceptos} alRegenerar={() => establecerMapa({ ...mapa })} origen="ejemplo" titulo={tema.titulo} />;
}
