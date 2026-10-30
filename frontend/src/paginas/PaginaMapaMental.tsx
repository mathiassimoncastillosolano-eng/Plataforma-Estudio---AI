import { useEffect, useRef, useState } from "react";
import { Loader2, Network, Sparkles } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import * as aiService from "../servicios/servicioIa";
import { generarMapaConceptual, generarMapaConceptualDesdePdf } from "../servicios/servicioMapaConceptual";
import { ErrorApi } from "../servicios/clienteApi";
import { guardarMapa, useSesion } from "../almacen/almacenSesion";
import { useAviso } from "../hooks/useAviso";
import type { ConceptoClave, MapaMental } from "../tipos";
import { EmptyState, EstadoCarga, ErrorState } from "../componentes/Estados";
import Boton from "../componentes/Boton";
import MapaConceptual from "../componentes/MapaConceptual";

const MENSAJE_ERROR = "No pudimos generar el mapa conceptual. Inténtalo de nuevo.";

/** Identifica la fuente con la que se generó un mapa: si el estudiante la cambia, el mapa guardado deja de valer. */
function huellaFuente(esPdf: boolean, texto: string | undefined, archivo: File | null): string | null {
  if (esPdf) return archivo ? `pdf:${archivo.name}:${archivo.size}:${archivo.lastModified}` : null;
  const limpio = texto?.trim();
  return limpio ? `texto:${limpio}` : null;
}

/**
 * Mapa conceptual del tema. Si el estudiante aportó su fuente en esta sesión (texto o PDF) el mapa se
 * genera con IA a partir de ella; si no, se conserva el comportamiento anterior (mapas de ejemplo y de respaldo).
 */
export default function PaginaMapaMental() {
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
  const [generando, establecerGenerando] = useState(false);
  const [error, establecerError] = useState<string | null>(null);
  const refAborto = useRef<AbortController | null>(null);

  useEffect(() => () => refAborto.current?.abort(), []);

  const mapa = guardado && guardado.huella === huella ? guardado.mapa : null;

  async function generar() {
    refAborto.current?.abort();
    const controlador = new AbortController();
    refAborto.current = controlador;
    establecerError(null);
    establecerGenerando(true);
    try {
      const resultado =
        esPdf && archivo
          ? await generarMapaConceptualDesdePdf(tema.id, archivo, tema.titulo, controlador.signal)
          : await generarMapaConceptual(tema.id, texto, tema.titulo, controlador.signal);
      guardarMapa(tema.id, resultado, huella);
      mostrarAviso("Mapa conceptual listo.");
    } catch (fallo) {
      if (controlador.signal.aborted) return;
      establecerError(fallo instanceof ErrorApi ? fallo.message : MENSAJE_ERROR);
    } finally {
      if (!controlador.signal.aborted) establecerGenerando(false);
    }
  }

  function cancelar() {
    refAborto.current?.abort();
    establecerGenerando(false);
  }

  function regenerar() {
    // Los cambios del estudiante viven solo en el lienzo: regenerar los reemplaza por un mapa nuevo.
    if (window.confirm("Se generará un mapa nuevo con la IA y se perderán los cambios que hiciste en este. ¿Quieres continuar?")) generar();
  }

  if (generando) {
    return (
      <EmptyState
        icono={<Loader2 size={24} className="spin" />}
        titulo="Construyendo tu mapa conceptual…"
        descripcion="La IA está identificando los conceptos y las relaciones de tu material. Puede tardar un momento."
        accion={
          <Boton variante="ghost" tamano="sm" onClick={cancelar}>
            Cancelar
          </Boton>
        }
      />
    );
  }
  if (error) return <ErrorState titulo="No pudimos generar el mapa conceptual." descripcion={error} alReintentar={generar} />;
  if (!mapa) {
    return (
      <EmptyState
        icono={<Network size={24} />}
        titulo="Genera el mapa conceptual de tu material"
        descripcion={`La IA analizará ${esPdf ? "tu PDF" : "tu texto"} y construirá un mapa con los conceptos, su definición y las relaciones entre ellos. Pulsa un concepto para ver su definición.`}
        accion={
          <Boton icono={<Sparkles size={16} />} onClick={generar}>
            Generar mapa conceptual
          </Boton>
        }
      />
    );
  }
  return <MapaConceptual mapa={mapa} conceptos={[]} alRegenerar={regenerar} origen="ia" alEditar={(editado) => guardarMapa(tema.id, editado, huella)} />;
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

  if (estado === "cargando") return <EstadoCarga mensaje="Generando mapa conceptual..." />;
  if (estado === "error" || !mapa) return <ErrorState alReintentar={cargar} />;

  // Los cambios del usuario viven mientras navega; "Regenerar" restaura el mapa original.
  return <MapaConceptual mapa={mapa} conceptos={conceptos} alRegenerar={() => establecerMapa({ ...mapa })} origen="ejemplo" />;
}
