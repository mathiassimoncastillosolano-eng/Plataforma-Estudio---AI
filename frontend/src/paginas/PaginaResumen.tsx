import { useEffect, useMemo, useRef, useState } from "react";
import { PenLine } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import type { TipoResumen } from "../tipos";
import * as servicioResumen from "../servicios/servicioResumen";
import { ErrorApi } from "../servicios/clienteApi";
import { guardarResumenes, establecerFuenteTema, useSesion } from "../almacen/almacenSesion";
import { useAviso } from "../hooks/useAviso";
import Boton from "../componentes/Boton";
import CompositorResumen from "../componentes/resumen/CompositorResumen";
import GenerandoResumen from "../componentes/resumen/GenerandoResumen";
import LectorResumen, { construirIndice } from "../componentes/resumen/LectorResumen";
import { TEXTOS_TIPO_RESUMEN } from "../componentes/resumen/textosResumen";

type Vista = "lectura" | "redaccion" | "generando";

const TIPOS: TipoResumen[] = ["esencial", "general"];

/**
 * Resumen del tema: redacción del contenido → backend (una sola llamada) → lectura.
 * El resumen general y el esencial llegan juntos y se alternan sin nuevas llamadas.
 * Lo generado vive en la sesión (memoria); los temas demo muestran su resumen de
 * ejemplo hasta que el estudiante genere uno propio.
 */
export default function PaginaResumen() {
  const { tema } = useContextoTema();
  const { mostrarAviso } = useAviso();
  const generados = useSesion((s) => s.resumenes[tema.id]);
  const fuenteGuardada = useSesion((s) => s.fuentes[tema.id]);

  const resumenes = generados ?? servicioResumen.obtenerResumenesEjemplo(tema.id);

  const [tipoVisible, establecerTipoVisible] = useState<TipoResumen>("esencial");
  const [vista, establecerVista] = useState<Vista>(resumenes ? "lectura" : "redaccion");
  const [borrador, establecerBorrador] = useState(fuenteGuardada ?? "");
  const [error, establecerError] = useState<string | null>(null);
  const [idActivo, establecerIdActivo] = useState("");
  const refAborto = useRef<AbortController | null>(null);

  useEffect(() => () => refAborto.current?.abort(), []);

  const indice = useMemo(() => (resumenes && vista === "lectura" ? construirIndice(resumenes, tipoVisible) : []), [resumenes, tipoVisible, vista]);

  // Índice lateral: resalta la sección que se está leyendo
  useEffect(() => {
    if (indice.length === 0) return;
    establecerIdActivo(indice[0].id);
    const elementos = indice.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    const observador = new IntersectionObserver(
      (entradas) => {
        const visibles = entradas.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visibles[0]) establecerIdActivo(visibles[0].target.id);
      },
      { rootMargin: "-90px 0px -60% 0px" }
    );
    elementos.forEach((el) => observador.observe(el));
    return () => observador.disconnect();
  }, [indice]);

  async function generar(contenido: string) {
    refAborto.current?.abort();
    const controlador = new AbortController();
    refAborto.current = controlador;
    establecerError(null);
    establecerVista("generando");
    try {
      const resultado = await servicioResumen.generarResumenes(contenido, tema.titulo, controlador.signal);
      establecerFuenteTema(tema.id, contenido);
      guardarResumenes(tema.id, tema.titulo, resultado);
      establecerTipoVisible("esencial");
      establecerVista("lectura");
      window.scrollTo({ top: 0, behavior: "smooth" });
      mostrarAviso("Resumen general y esencial listos.");
    } catch (fallo) {
      if (controlador.signal.aborted) return;
      establecerError(fallo instanceof ErrorApi ? fallo.message : "No pudimos generar el resumen. Inténtalo de nuevo.");
      establecerVista("redaccion");
    }
  }

  function cancelarGeneracion() {
    refAborto.current?.abort();
    establecerVista(resumenes ? "lectura" : "redaccion");
  }

  function abrirCompositor() {
    establecerBorrador((actual) => actual || fuenteGuardada || "");
    establecerError(null);
    establecerVista("redaccion");
  }

  function saltar(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (vista === "generando") {
    return (
      <div className="summary-stage">
        <GenerandoResumen alCancelar={cancelarGeneracion} />
      </div>
    );
  }

  if (vista === "redaccion" || !resumenes) {
    return (
      <div className="summary-stage">
        <CompositorResumen
          contenido={borrador}
          error={error}
          alCambiarContenido={establecerBorrador}
          alEnviar={() => generar(borrador.trim())}
          alCancelar={resumenes ? () => establecerVista("lectura") : undefined}
        />
      </div>
    );
  }

  return (
    <div className="reader">
      <aside className="reader-rail">
        <div className="seg seg-stack" role="tablist" aria-label="Tipo de resumen">
          {TIPOS.map((tipo) => (
            <button key={tipo} role="tab" aria-selected={tipoVisible === tipo} className={`seg-btn ${tipoVisible === tipo ? "active" : ""}`} onClick={() => establecerTipoVisible(tipo)}>
              {TEXTOS_TIPO_RESUMEN[tipo].etiqueta}
            </button>
          ))}
        </div>
        {indice.length > 0 && (
          <nav className="toc" aria-label="En este resumen">
            <p>En este resumen</p>
            {indice.map((t) => (
              <button key={t.id} className={idActivo === t.id ? "active" : ""} onClick={() => saltar(t.id)}>
                {t.etiqueta}
              </button>
            ))}
          </nav>
        )}
        <Boton variante="secondary" tamano="sm" icono={<PenLine size={15} />} onClick={abrirCompositor}>
          Nuevo resumen
        </Boton>
      </aside>

      <LectorResumen key={`${tipoVisible}-${resumenes.metadatos.generadoEn}`} resumenes={resumenes} tipo={tipoVisible} tituloTema={tema.titulo} />
    </div>
  );
}
