import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import * as studyService from "../servicios/servicioEstudio";
import type { TemaEstudio } from "../tipos";
import TarjetaTemaEstudio from "../componentes/TarjetaTemaEstudio";
import { EstadoCarga, ErrorState, EmptyState } from "../componentes/Estados";
import { EsqueletoCuadricula } from "../componentes/Esqueleto";
import EncabezadoPagina from "../componentes/EncabezadoPagina";
import { obtenerEstadoTema, etiquetasEstadoTema, type EstadoTema } from "../datos/temasEstudio";

type ClaveFiltro = "todos" | EstadoTema;

const filtros: { clave: ClaveFiltro; etiqueta: string }[] = [
  { clave: "todos", etiqueta: "Todos" },
  { clave: "en-progreso", etiqueta: etiquetasEstadoTema["en-progreso"] },
  { clave: "completado", etiqueta: etiquetasEstadoTema.completado },
  { clave: "pendiente", etiqueta: etiquetasEstadoTema.pendiente },
];

export default function PaginaListaTemas() {
  const [temas, establecerTemas] = useState<TemaEstudio[] | null>(null);
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [consulta, establecerConsulta] = useState("");
  const [filtro, establecerFiltro] = useState<ClaveFiltro>("todos");

  async function cargar() {
    establecerEstado("cargando");
    try {
      const resultado = await studyService.obtenerTemasEstudio();
      establecerTemas(resultado);
      establecerEstado("exito");
    } catch {
      establecerEstado("error");
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    return (temas ?? []).filter((t) => {
      const coincideConsulta =
        t.titulo.toLowerCase().includes(consulta.toLowerCase()) || t.categoria.toLowerCase().includes(consulta.toLowerCase());
      const coincideFiltro = filtro === "todos" || obtenerEstadoTema(t) === filtro;
      return coincideConsulta && coincideFiltro;
    });
  }, [temas, consulta, filtro]);

  if (estado === "cargando") {
    return (
      <div aria-busy="true">
        <EncabezadoPagina titulo="Mis estudios" descripcion="Cargando tus temas…" />
        <EsqueletoCuadricula cantidad={6} />
      </div>
    );
  }
  if (estado === "error") return <ErrorState alReintentar={cargar} />;

  return (
    <div>
      <EncabezadoPagina
        titulo="Mis estudios"
        descripcion="Todos los temas que has creado, en un solo lugar."
        acciones={
          <Link to="/estudio/nuevo" className="btn btn-primary">
            <Plus size={16} />
            Nuevo tema
          </Link>
        }
      />

      <div className="toolbar">
        <div className="summary-tabs" role="tablist" aria-label="Filtrar por estado">
          {filtros.map((f) => (
            <button
              key={f.clave}
              className={`summary-tab-btn ${filtro === f.clave ? "active" : ""}`}
              onClick={() => establecerFiltro(f.clave)}
              role="tab"
              aria-selected={filtro === f.clave}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>
        <div className="header-search">
          <Search size={15} />
          <input placeholder="Buscar por tema o categoría..." value={consulta} onChange={(e) => establecerConsulta(e.target.value)} />
        </div>
      </div>

      {filtrados.length > 0 ? (
        <div className="topic-grid stagger">
          {filtrados.map((tema) => (
            <TarjetaTemaEstudio key={tema.id} tema={tema} />
          ))}
        </div>
      ) : (
        <EmptyState
          titulo={temas && temas.length > 0 ? "Sin resultados" : "Todavía no tienes temas de estudio."}
          descripcion={
            temas && temas.length > 0
              ? "No encontramos temas que coincidan con tu búsqueda o filtro."
              : "Crea tu primer tema para comenzar a estudiar con IA."
          }
          accion={
            <Link to="/estudio/nuevo" className="btn btn-primary">
              Crear primer tema
            </Link>
          }
        />
      )}
    </div>
  );
}
