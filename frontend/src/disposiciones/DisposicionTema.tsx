import { useEffect, useState } from "react";
import { Outlet, useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { TemaEstudio } from "../tipos";
import * as studyService from "../servicios/servicioEstudio";
import { etiquetasNivelDominio } from "../datos/temasEstudio";
import { EstadoCarga, ErrorState, EmptyState } from "../componentes/Estados";
import Insignia from "../componentes/Insignia";
import BarraProgreso from "../componentes/BarraProgreso";
import SelectorTema from "../componentes/SelectorTema";
import PestanasEstudio from "../componentes/PestanasEstudio";
import { ContextoTema } from "./contextoTema";

export default function DisposicionTema() {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const [tema, establecerTema] = useState<TemaEstudio | null>(null);
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error" | "vacio">("cargando");

  async function cargar() {
    if (!id) return;
    establecerEstado("cargando");
    try {
      const resultado = await studyService.obtenerTemaEstudio(id);
      if (!resultado) {
        establecerEstado("vacio");
        return;
      }
      establecerTema(resultado);
      establecerEstado("exito");
    } catch {
      establecerEstado("error");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (estado === "cargando") return <EstadoCarga mensaje="Cargando tema de estudio..." />;
  if (estado === "error") return <ErrorState alReintentar={cargar} />;
  if (estado === "vacio" || !tema) {
    return (
      <EmptyState
        titulo="No encontramos este tema"
        descripcion="Puede que haya sido eliminado o que el enlace sea incorrecto."
        accion={
          <Link to="/temas" className="btn btn-primary">
            Volver a mis estudios
          </Link>
        }
      />
    );
  }

  return (
    <ContextoTema.Provider value={{ tema, refrescar: cargar, establecerTema }}>
      <div className="topic-shell">
        <header className="topic-head">
          <Link to="/temas" className="back-link">
            <ArrowLeft size={15} />
            Mis estudios
          </Link>

          <div className="topic-title-row">
            <div className="topic-title-block">
              <Insignia tono="blue">{tema.categoria}</Insignia>
              <SelectorTema actual={tema} />
            </div>
            <div className="topic-mastery-chip" title={etiquetasNivelDominio[tema.nivelDominio]}>
              <span>
                Dominio <strong className="mono">{tema.dominio}%</strong>
              </span>
              <BarraProgreso valor={tema.dominio} />
            </div>
          </div>

          <PestanasEstudio idTema={tema.id} />
        </header>

        {/* key: cada pestaña entra con su propia transición sin recargar el tema */}
        <div className="topic-body tab-enter" key={pathname}>
          <Outlet />
        </div>
      </div>
    </ContextoTema.Provider>
  );
}
