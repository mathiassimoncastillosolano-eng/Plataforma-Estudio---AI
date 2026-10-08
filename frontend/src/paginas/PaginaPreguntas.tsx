import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dumbbell, ListChecks, Search, X } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import * as aiService from "../servicios/servicioIa";
import type { ConceptoClave, PreguntaEstudio } from "../tipos";
import { normalizar, conceptosRelacionados } from "../utilidades/conceptos";
import { cargarEstados, guardarEstados, type EstadoPregunta, type MapaEstados } from "../utilidades/estadoPregunta";
import { EstadoCarga, ErrorState, EmptyState } from "../componentes/Estados";
import TarjetaPregunta from "../componentes/TarjetaPregunta";
import SesionPractica from "../componentes/SesionPractica";
import Boton from "../componentes/Boton";

type IdFiltro = "todas" | "facil" | "media" | "dificil" | "respondidas" | "pendientes" | "repasar";
const FILTROS: { id: IdFiltro; etiqueta: string }[] = [
  { id: "todas", etiqueta: "Todas" },
  { id: "facil", etiqueta: "Fáciles" },
  { id: "media", etiqueta: "Medias" },
  { id: "dificil", etiqueta: "Difíciles" },
  { id: "respondidas", etiqueta: "Respondidas" },
  { id: "pendientes", etiqueta: "Pendientes" },
  { id: "repasar", etiqueta: "Por repasar" },
];

export default function PaginaPreguntas() {
  const { tema } = useContextoTema();
  const [parametros, establecerParametros] = useSearchParams();
  const [preguntas, establecerPreguntas] = useState<PreguntaEstudio[] | null>(null);
  const [conceptos, establecerConceptos] = useState<ConceptoClave[]>([]);
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [estados, establecerEstados] = useState<MapaEstados>(() => cargarEstados(tema.id));
  const [idsAbiertos, establecerIdsAbiertos] = useState<Set<string>>(new Set());
  const [consulta, establecerConsulta] = useState("");
  const [practica, establecerPractica] = useState<PreguntaEstudio[] | null>(null);

  const valorInicial = parametros.get("f") as IdFiltro | null;
  const [filtro, establecerFiltro] = useState<IdFiltro>(FILTROS.some((f) => f.id === valorInicial) ? (valorInicial as IdFiltro) : "todas");

  async function cargar() {
    establecerEstado("cargando");
    try {
      const [resultado, informacion] = await Promise.all([aiService.generarPreguntas(tema.id, tema.titulo), aiService.obtenerConceptosTema(tema.id, tema.titulo)]);
      establecerPreguntas(resultado);
      establecerConceptos(informacion.conceptos);
      establecerEstados(cargarEstados(tema.id));
      establecerEstado("exito");
    } catch {
      establecerEstado("error");
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema.id]);

  function actualizarEstado(id: string, siguiente: EstadoPregunta | null) {
    establecerEstados((previo) => {
      const textos = { ...previo };
      if (siguiente) textos[id] = siguiente;
      else delete textos[id];
      guardarEstados(tema.id, textos);
      return textos;
    });
  }

  function cambiarFiltro(siguiente: IdFiltro) {
    establecerFiltro(siguiente);
    if (parametros.has("f")) establecerParametros({}, { replace: true });
  }

  const conteos = useMemo(() => {
    const todos = preguntas ?? [];
    const c: Record<IdFiltro, number> = { todas: todos.length, facil: 0, media: 0, dificil: 0, respondidas: 0, pendientes: 0, repasar: 0 };
    for (const q of todos) {
      c[q.dificultad] += 1;
      if (estados[q.id]) c.respondidas += 1;
      else c.pendientes += 1;
      if (estados[q.id] === "repaso") c.repasar += 1;
    }
    return c;
  }, [preguntas, estados]);

  const visibles = useMemo(() => {
    const q = normalizar(consulta).trim();
    return (preguntas ?? []).filter((elemento) => {
      if (filtro === "facil" || filtro === "media" || filtro === "dificil") {
        if (elemento.dificultad !== filtro) return false;
      } else if (filtro === "respondidas" && !estados[elemento.id]) return false;
      else if (filtro === "pendientes" && estados[elemento.id]) return false;
      else if (filtro === "repasar" && estados[elemento.id] !== "repaso") return false;
      if (!q) return true;
      return normalizar(`${elemento.enunciado} ${elemento.explicacion} ${elemento.opciones?.map((o) => o.etiqueta).join(" ") ?? ""}`).includes(q);
    });
  }, [preguntas, filtro, consulta, estados]);

  function alternar(id: string) {
    establecerIdsAbiertos((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }

  if (estado === "cargando") return <EstadoCarga mensaje="Cargando preguntas..." />;
  if (estado === "error") return <ErrorState alReintentar={cargar} />;
  if (!preguntas || preguntas.length === 0) {
    return <EmptyState titulo="No hay preguntas disponibles" descripcion="Todavía no se generaron preguntas para este tema." />;
  }

  if (practica) {
    return (
      <div className="questions-wrap">
        <div className="questions-toolbar">
          <button className="back-link" onClick={() => establecerPractica(null)}>
            <ListChecks size={15} />
            Volver a la lista
          </button>
          <span className="text-muted">Práctica · {practica.length} preguntas</span>
        </div>
        <SesionPractica preguntas={practica} alResponder={(id, ok) => actualizarEstado(id, ok ? "conocida" : "repaso")} alSalir={() => establecerPractica(null)} />
      </div>
    );
  }

  const porcentajeRespondidas = Math.round((conteos.respondidas / conteos.todas) * 100);
  const todosAbiertos = visibles.length > 0 && visibles.every((q) => idsAbiertos.has(q.id));

  return (
    <div className="questions-wrap">
      <div className="questions-toolbar">
        <div className="questions-progress">
          <strong>
            {conteos.respondidas} <span>de {conteos.todas} respondidas</span>
          </strong>
          <div className="progress-track" role="progressbar" aria-valuenow={porcentajeRespondidas} aria-valuemin={0} aria-valuemax={100} aria-label="Preguntas respondidas">
            <div className="progress-fill" style={{ width: `${porcentajeRespondidas}%` }} />
          </div>
        </div>
        <Boton variante="secondary" tamano="sm" icono={<Dumbbell size={15} />} disabled={visibles.length === 0} onClick={() => establecerPractica(visibles)}>
          Practicar {filtro === "todas" && !consulta ? "todas" : `estas (${visibles.length})`}
        </Boton>
      </div>

      <div className="filter-bar">
        <div className="chip-filters" role="tablist" aria-label="Filtrar preguntas">
          {FILTROS.map((f) => (
            <button key={f.id} role="tab" aria-selected={filtro === f.id} className={`fchip ${filtro === f.id ? "active" : ""}`} onClick={() => cambiarFiltro(f.id)}>
              {f.etiqueta}
              <span>{conteos[f.id]}</span>
            </button>
          ))}
        </div>
        <div className="q-search">
          <Search size={15} />
          <input value={consulta} onChange={(e) => establecerConsulta(e.target.value)} placeholder="Buscar en las preguntas…" aria-label="Buscar preguntas" />
          {consulta && (
            <button onClick={() => establecerConsulta("")} aria-label="Borrar búsqueda">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          titulo="Ninguna pregunta coincide"
          descripcion={consulta ? `No encontramos resultados para «${consulta}» con este filtro.` : "Cambia el filtro para ver otras preguntas."}
          accion={
            <Boton
              variante="secondary"
              onClick={() => {
                establecerConsulta("");
                cambiarFiltro("todas");
              }}
            >
              Ver todas
            </Boton>
          }
        />
      ) : (
        <>
          <div className="list-meta">
            <span>
              {visibles.length} {visibles.length === 1 ? "pregunta" : "preguntas"}
            </span>
            <button onClick={() => establecerIdsAbiertos(todosAbiertos ? new Set() : new Set(visibles.map((q) => q.id)))}>{todosAbiertos ? "Ocultar todas las respuestas" : "Mostrar todas las respuestas"}</button>
          </div>
          <div className="qlist stagger">
            {visibles.map((q, i) => (
              <TarjetaPregunta key={q.id} pregunta={q} numero={(preguntas.indexOf(q) + 1) || i + 1} abierto={idsAbiertos.has(q.id)} estado={estados[q.id]} relacionados={conceptosRelacionados(q, conceptos)} alAlternar={() => alternar(q.id)} alEstado={(s) => actualizarEstado(q.id, s)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
