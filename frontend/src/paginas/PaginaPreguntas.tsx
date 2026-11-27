import { usePresentacionModulo } from "../buddy/BuddyProvider";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ListChecks, Search, X } from "lucide-react";
import { useContextoTema } from "../disposiciones/contextoTema";
import * as aiService from "../servicios/servicioIa";
import { empezarSiguienteRonda, generarSiguienteRonda, iniciarPractica, registrarResultadoPregunta } from "../servicios/servicioPreguntas";
import { fueRevelado, marcarRevelado } from "../servicios/generacionSegundoPlano";
import { obtenerEstadoAdaptacion, useSesion } from "../almacen/almacenSesion";
import type { ConceptoClave, PreguntaEstudio } from "../tipos";
import { normalizar, conceptosRelacionados } from "../utilidades/conceptos";
import { cargarEstados, guardarEstados, type EstadoPregunta, type MapaEstados } from "../utilidades/estadoPregunta";
import { rondaCompleta } from "../utilidades/rondaPreguntas";
import { preguntasPorIds } from "../utilidades/practicaPreguntas";
import { TIEMPO_CARGA_PRECARGADA_MS, esperarMinimo } from "../utilidades/tiempoMinimo";
import { ErrorState, EmptyState } from "../componentes/Estados";
import CargaModulo from "../componentes/CargaModulo";
import TarjetaPregunta from "../componentes/TarjetaPregunta";
import SesionPractica from "../componentes/SesionPractica";
import EncabezadoPreguntas from "../componentes/preguntas/EncabezadoPreguntas";
import RondaCompletada from "../componentes/preguntas/RondaCompletada";
import DescargaPreguntas from "../componentes/preguntas/DescargaPreguntas";
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
  usePresentacionModulo("preguntas");
  const { tema } = useContextoTema();
  const [parametros, establecerParametros] = useSearchParams();
  const guardada = useSesion((s) => s.practica[tema.id]);
  const [conceptos, establecerConceptos] = useState<ConceptoClave[]>([]);
  const [estado, establecerEstado] = useState<"cargando" | "exito" | "error">("cargando");
  const [estados, establecerEstados] = useState<MapaEstados>(() => cargarEstados(tema.id));
  const [idsAbiertos, establecerIdsAbiertos] = useState<Set<string>>(new Set());
  const [consulta, establecerConsulta] = useState("");
  const [practica, establecerPractica] = useState<PreguntaEstudio[] | null>(null);
  const [preparando, establecerPreparando] = useState(false);
  const rondaCerrada = useRef("");
  const claveRevelado = `preguntas:${tema.id}`;

  const valorInicial = parametros.get("f") as IdFiltro | null;
  const [filtro, establecerFiltro] = useState<IdFiltro>(FILTROS.some((f) => f.id === valorInicial) ? (valorInicial as IdFiltro) : "todas");

  async function cargar() {
    const inicio = Date.now();
    establecerEstado("cargando");
    try {
      const [resultado, informacion] = await Promise.all([aiService.generarPreguntas(tema.id, tema.titulo), aiService.obtenerConceptosTema(tema.id, tema.titulo)]);
      if (!fueRevelado(claveRevelado)) await esperarMinimo(inicio, TIEMPO_CARGA_PRECARGADA_MS);
      marcarRevelado(claveRevelado);
      iniciarPractica(tema.id, resultado);
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

  function actualizarEstado(id: string, siguienteEstado: EstadoPregunta | null) {
    if (siguienteEstado) registrarResultadoPregunta(tema.id, id, siguienteEstado === "conocida");
    establecerEstados((previo) => {
      const textos = { ...previo };
      if (siguienteEstado) textos[id] = siguienteEstado;
      else delete textos[id];
      guardarEstados(tema.id, textos);
      return textos;
    });
  }

  const banco = useMemo(() => guardada?.banco ?? [], [guardada]);
  const ronda = guardada?.ronda ?? 1;
  const siguiente = guardada?.idsSiguiente ?? null;
  const preguntasRonda = useMemo(() => (guardada ? preguntasPorIds(guardada.banco, guardada.idsRonda) : []), [guardada]);
  const respondidasRonda = useMemo(() => new Set(guardada?.respondidas ?? []), [guardada]);
  const rondaTerminada = rondaCompleta(preguntasRonda, (id) => respondidasRonda.has(id));

  useEffect(() => {
    if (practica || !guardada || siguiente || preparando || !rondaTerminada) return;
    const firma = `${guardada.ronda}:${guardada.idsRonda.join("|")}`;
    if (rondaCerrada.current === firma) return;
    rondaCerrada.current = firma;
    establecerPreparando(true);
    generarSiguienteRonda(tema.id, tema.titulo, { nivelEstudiante: obtenerEstadoAdaptacion(tema.id)?.nivel })
      .catch(() => false)
      .finally(() => establecerPreparando(false));
  }, [practica, guardada, siguiente, preparando, rondaTerminada, tema.id, tema.titulo]);

  function empezarSiguiente() {
    empezarSiguienteRonda(tema.id);
    establecerIdsAbiertos(new Set());
    establecerConsulta("");
    establecerFiltro("todas");
  }

  function cambiarFiltro(siguienteFiltro: IdFiltro) {
    establecerFiltro(siguienteFiltro);
    if (parametros.has("f")) establecerParametros({}, { replace: true });
  }

  const conteos = useMemo(() => {
    const todos = banco;
    const c: Record<IdFiltro, number> = { todas: todos.length, facil: 0, media: 0, dificil: 0, respondidas: 0, pendientes: 0, repasar: 0 };
    for (const q of todos) {
      c[q.dificultad] += 1;
      if (estados[q.id]) c.respondidas += 1;
      else c.pendientes += 1;
      if (estados[q.id] === "repaso") c.repasar += 1;
    }
    return c;
  }, [banco, estados]);

  const conocidas = useMemo(() => banco.filter((q) => estados[q.id] === "conocida").length, [banco, estados]);
  const conocidasRonda = preguntasRonda.filter((q) => estados[q.id] === "conocida").length;

  const visibles = useMemo(() => {
    const q = normalizar(consulta).trim();
    return banco.filter((elemento) => {
      if (filtro === "facil" || filtro === "media" || filtro === "dificil") {
        if (elemento.dificultad !== filtro) return false;
      } else if (filtro === "respondidas" && !estados[elemento.id]) return false;
      else if (filtro === "pendientes" && estados[elemento.id]) return false;
      else if (filtro === "repasar" && estados[elemento.id] !== "repaso") return false;
      if (!q) return true;
      return normalizar(`${elemento.enunciado} ${elemento.explicacion} ${elemento.opciones?.map((o) => o.etiqueta).join(" ") ?? ""}`).includes(q);
    });
  }, [banco, filtro, consulta, estados]);

  function alternar(id: string) {
    establecerIdsAbiertos((previo) => {
      const nuevo = new Set(previo);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  if (estado === "cargando") return <CargaModulo modulo="preguntas" />;
  if (estado === "error") return <ErrorState alReintentar={cargar} />;
  if (banco.length === 0) {
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

  const todosAbiertos = visibles.length > 0 && visibles.every((q) => idsAbiertos.has(q.id));
  const practicarRonda = filtro === "todas" && !consulta;

  return (
    <div className="questions-wrap preg-pagina">
      <EncabezadoPreguntas
        ronda={ronda}
        respondidasRonda={preguntasRonda.filter((q) => respondidasRonda.has(q.id)).length}
        totalRonda={preguntasRonda.length}
        respondidas={conteos.respondidas}
        conocidas={conocidas}
        repasar={conteos.repasar}
        textoPracticar={practicarRonda ? `Practicar ronda ${ronda}` : `Practicar estas (${visibles.length})`}
        practicarDeshabilitado={practicarRonda ? preguntasRonda.length === 0 : visibles.length === 0}
        alPracticar={() => establecerPractica(practicarRonda ? preguntasRonda : visibles)}
      />

      {(preparando || siguiente || rondaTerminada) && (
        <RondaCompletada ronda={ronda} conocidas={conocidasRonda} total={preguntasRonda.length} preparando={preparando} lista={Boolean(siguiente)} alEmpezar={empezarSiguiente} />
      )}

      <div className="filter-bar">
        <div className="chip-filters" role="tablist" aria-label="Filtrar preguntas" data-tour="preguntas-filtros">
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
        <DescargaPreguntas idTema={tema.id} titulo={tema.titulo} total={banco.length} />
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
              <TarjetaPregunta key={q.id} pregunta={q} numero={banco.indexOf(q) + 1 || i + 1} abierto={idsAbiertos.has(q.id)} estado={estados[q.id]} relacionados={conceptosRelacionados(q, conceptos)} alAlternar={() => alternar(q.id)} alEstado={(s) => actualizarEstado(q.id, s)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
