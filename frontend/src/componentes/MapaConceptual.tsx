import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  getSmoothStepPath,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeProps,
  type Node,
  type NodeChange,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { ChevronsDownUp, ChevronsUpDown, Maximize2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { ConceptoClave, MapaMental } from "../tipos";
import { normalizar } from "../utilidades/conceptos";
import { ALTO_NIVEL, calcularPosiciones } from "../utilidades/distribucionMapa";
import { idAleatorio } from "../utilidades/retardoSimulado";
import type { MapaExportable } from "../utilidades/exportacionMapa";
import Boton from "./Boton";
import DescargaMapa from "./DescargaMapa";
import Insignia from "./Insignia";

interface DatosConcepto {
  etiqueta: string;
  detalle?: string;
  nivel: number;
  cantidadHijos: number;
  contraida: boolean;
  tenue: boolean;
  alAlternar: (id: string) => void;
}

const NodoConcepto = memo(function NodoConcepto({ id, data: datos, selected: seleccionado }: NodeProps<DatosConcepto>) {
  return (
    <div className={`cm-node level-${datos.nivel} ${seleccionado ? "is-selected" : ""} ${datos.tenue ? "is-dim" : ""}`} onDoubleClick={() => datos.cantidadHijos > 0 && datos.alAlternar(id)}>
      <Handle type="target" position={Position.Top} className="cm-handle" />
      <span className="cm-label">{datos.etiqueta || "Sin título"}</span>
      {datos.cantidadHijos > 0 && (
        <button
          className="cm-expand nodrag"
          onClick={(e) => {
            e.stopPropagation();
            datos.alAlternar(id);
          }}
          aria-label={datos.contraida ? `Expandir ${datos.etiqueta}` : `Contraer ${datos.etiqueta}`}
          title={datos.contraida ? "Expandir" : "Contraer"}
        >
          {datos.contraida ? `+${datos.cantidadHijos}` : "−"}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="cm-handle" />
    </div>
  );
});
const tiposNodo = { concepto: NodoConcepto };

// Distancia bajo el nodo padre a la que corre el tramo horizontal común de sus conectores.
const SALTO_CONECTOR = 30;

/**
 * Arista con frase de enlace (mapas generados con IA). La relación sale del padre, corre por un tramo
 * horizontal común y baja en vertical hasta el hijo, con la frase justo encima del hijo; así las frases
 * de hermanos no se pisan y todos los trazos son rectos y ordenados.
 */
const AristaEnlace = memo(function AristaEnlace({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, style, label }: EdgeProps) {
  const haySitio = targetY - sourceY > SALTO_CONECTOR * 2;
  const [ruta] = getSmoothStepPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, borderRadius: 10, centerY: haySitio ? sourceY + SALTO_CONECTOR : undefined });
  const etiquetaX = targetX;
  const etiquetaY = haySitio ? targetY - 26 : (sourceY + targetY) / 2;
  return (
    <>
      <BaseEdge id={id} path={ruta} markerEnd={markerEnd} style={style} />
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan"
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${etiquetaX}px, ${etiquetaY}px)`,
              pointerEvents: "none",
              maxWidth: 140,
              padding: "1px 7px",
              borderRadius: 8,
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-secondary)",
              fontSize: 11,
              fontWeight: 500,
              lineHeight: 1.25,
              textAlign: "center",
              opacity: typeof style?.opacity === "number" ? style.opacity : 1,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
});
const tiposArista = { enlace: AristaEnlace };

const estiloArista = { stroke: "var(--color-border-strong)", strokeWidth: 1.6 };

function aNodos(mapa: MapaMental): Node<DatosConcepto>[] {
  return mapa.nodos.map((n) => ({
    id: n.id,
    type: "concepto",
    position: { x: n.x, y: n.y },
    data: { etiqueta: n.etiqueta, detalle: n.detalle, nivel: n.nivel, cantidadHijos: 0, contraida: false, tenue: false, alAlternar: () => {} },
  }));
}
const FLECHA = { type: MarkerType.ArrowClosed, width: 16, height: 16, color: "var(--color-border-strong)" };

/**
 * Arista padre → hijo. Si se indica `etiqueta` (aunque sea vacía) usa el trazo ordenado con flecha y frase de enlace
 * de los mapas generados con IA; sin etiqueta conserva el aspecto original de los mapas de ejemplo.
 */
function crearArista(id: string, source: string, target: string, etiqueta?: string): Edge {
  const base: Edge = { id, source, target, type: "smoothstep", style: estiloArista };
  return etiqueta === undefined ? base : { ...base, type: "enlace", label: etiqueta, markerEnd: FLECHA };
}

function aAristas(mapa: MapaMental): Edge[] {
  return mapa.aristas.map((e) => crearArista(e.id, e.fuente, e.objetivo, e.etiqueta));
}

/** Convierte el estado del lienzo (con las ediciones del estudiante) de nuevo en un mapa, para poder guardarlo. */
function aMapaMental(idTema: string, nodos: Node<DatosConcepto>[], aristas: Edge[]): MapaMental {
  const padreDe = new Map<string, string>();
  aristas.forEach((e) => {
    if (!padreDe.has(e.target)) padreDe.set(e.target, e.source);
  });
  return {
    idTema,
    nodos: nodos.map((n) => ({
      id: n.id,
      etiqueta: n.data.etiqueta,
      detalle: n.data.detalle || undefined,
      nivel: (n.data.nivel <= 0 ? 0 : n.data.nivel === 1 ? 1 : 2) as 0 | 1 | 2,
      idPadre: padreDe.get(n.id) ?? null,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
    })),
    aristas: aristas.map((e) => ({ id: e.id, fuente: e.source, objetivo: e.target, ...(e.type === "enlace" ? { etiqueta: typeof e.label === "string" ? e.label : "" } : {}) })),
  };
}

/** Descripción de un concepto: la propia del nodo o, en los mapas de ejemplo, la del concepto clave que coincide. */
function definicionDe(nodo: Node<DatosConcepto>, conceptos: ConceptoClave[]): string | undefined {
  const etiqueta = normalizar(nodo.data.etiqueta);
  return nodo.data.detalle ?? conceptos.find((c) => normalizar(c.termino).includes(etiqueta) || etiqueta.includes(normalizar(c.termino)))?.definicion;
}

/** Foto del lienzo para exportar: todos los nodos (también los de ramas contraídas) con su tamaño real y las ediciones. */
function aMapaExportable(titulo: string, origen: "ia" | "ejemplo", nodos: Node<DatosConcepto>[], aristas: Edge[], conceptos: ConceptoClave[]): MapaExportable {
  return {
    titulo,
    origen,
    nodos: nodos.map((n) => ({
      id: n.id,
      etiqueta: n.data.etiqueta,
      descripcion: definicionDe(n, conceptos),
      nivel: n.data.nivel,
      x: n.position.x,
      y: n.position.y,
      ancho: n.width ?? undefined,
      alto: n.height ?? undefined,
    })),
    aristas: aristas.map((e) => ({ id: e.id, origen: e.source, destino: e.target, frase: typeof e.label === "string" ? e.label : undefined, conFlecha: e.type === "enlace" })),
  };
}

/**
 * Busca un hueco libre para un nodo nuevo bajo su padre (a la derecha y a la izquierda, y bajando de fila si hace falta)
 * de modo que nunca tape a otro nodo ni a su frase de enlace.
 */
function posicionLibre(padre: Node<DatosConcepto> | null, existentes: Node<DatosConcepto>[], saltoY: number): { x: number; y: number } {
  const base = padre?.position ?? { x: 300, y: 100 };
  const ANCHO = 180;
  const ALTO = 64;
  const PASO_X = 200;
  const PASO_Y = 110;
  const choca = (x: number, y: number) =>
    existentes.some((n) => x - 24 < n.position.x + (n.width ?? ANCHO) && x + ANCHO + 24 > n.position.x && y - 36 < n.position.y + (n.height ?? ALTO) && y + ALTO > n.position.y - 36);
  // Entre los huecos libres se elige el más cercano al punto natural (justo bajo el padre).
  let mejor: { x: number; y: number } | null = null;
  let menorCoste = Infinity;
  for (let fila = 0; fila < 8; fila++) {
    for (let k = 0; k < 14; k++) {
      const desplazamiento = k === 0 ? 0 : (k % 2 === 1 ? 1 : -1) * Math.ceil(k / 2) * PASO_X;
      const x = base.x + desplazamiento;
      const y = base.y + saltoY + fila * PASO_Y;
      const coste = fila + Math.abs(desplazamiento) / PASO_X;
      if (coste < menorCoste && !choca(x, y)) {
        mejor = { x, y };
        menorCoste = coste;
      }
    }
  }
  return mejor ?? { x: base.x, y: base.y + saltoY };
}

/**
 * Vuelve a ordenar todo el mapa con el mismo algoritmo con que se generó (cada concepto bajo su rama, sin solapes),
 * usando el tamaño real de los nodos ya dibujados, y mantiene la raíz donde estaba.
 */
function reordenar(nodos: Node<DatosConcepto>[], aristas: Edge[], anchoNuevo: { id: string; ancho: number }): Node<DatosConcepto>[] {
  const padreDe = new Map<string, string>();
  aristas.forEach((e) => {
    if (!padreDe.has(e.target)) padreDe.set(e.target, e.source);
  });
  const frases = new Map(aristas.map((e) => [e.target, typeof e.label === "string" && e.label ? e.label : undefined]));
  const posiciones = calcularPosiciones(
    nodos.map((n) => ({
      id: n.id,
      etiqueta: n.data.etiqueta,
      nivel: n.data.nivel,
      idPadre: padreDe.get(n.id) ?? null,
      frase: frases.get(n.id),
      ancho: n.id === anchoNuevo.id ? anchoNuevo.ancho : n.width ?? undefined,
      alto: n.height ?? undefined,
    }))
  );
  const raiz = nodos.find((n) => n.data.nivel === 0) ?? nodos[0];
  const origen = posiciones.get(raiz?.id ?? "");
  const dx = raiz && origen ? raiz.position.x - origen.x : 0;
  const dy = raiz && origen ? raiz.position.y - origen.y : 0;
  return nodos.map((n) => {
    const p = posiciones.get(n.id);
    return p ? { ...n, position: { x: p.x + dx, y: p.y + dy } } : n;
  });
}

interface Props {
  mapa: MapaMental;
  conceptos: ConceptoClave[];
  alRegenerar: () => void;
  /** Indica de dónde viene el mapa: generado con IA desde la fuente del usuario, o mapa de ejemplo. */
  origen?: "ia" | "ejemplo";
  /** Si se indica, recibe el mapa con las ediciones del estudiante para guardarlo (nombre, descripción, nodos, posiciones). */
  alEditar?: (mapa: MapaMental) => void;
  /** Título del tema: encabeza las descargas y da nombre a los archivos. */
  titulo?: string;
}

// Tamaño del minimapa. Se pasa al componente (que dimensiona su SVG con él) para que el dibujo coincida con su caja.
const ESTILO_MINIMAPA = { width: 150, height: 100 };

function Lienzo({ mapa, conceptos, alRegenerar, origen, alEditar, titulo }: Props) {
  const [nodos, establecerNodos] = useState<Node<DatosConcepto>[]>(() => aNodos(mapa));
  const [aristas, establecerAristas] = useState<Edge[]>(() => aAristas(mapa));
  const [contraida, establecerContraida] = useState<Set<string>>(new Set());
  const [idSeleccionado, establecerIdSeleccionado] = useState<string | null>(null);
  const [idHover, establecerIdHover] = useState<string | null>(null);
  const [idNuevo, establecerIdNuevo] = useState<string | null>(null);
  const refTitulo = useRef<HTMLInputElement>(null);
  const emitido = useRef<MapaMental | null>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Reinicia al regenerar el mapa (salvo que el cambio sea el propio guardado de las ediciones del lienzo)
  useEffect(() => {
    if (mapa === emitido.current) return;
    establecerNodos(aNodos(mapa));
    establecerAristas(aAristas(mapa));
    establecerContraida(new Set());
    establecerIdSeleccionado(null);
  }, [mapa]);

  const children = useMemo(() => {
    const m = new Map<string, string[]>();
    aristas.forEach((e) => m.set(e.source, [...(m.get(e.source) ?? []), e.target]));
    return m;
  }, [aristas]);

  const descendientes = useCallback(
    (id: string) => {
      const salida = new Set<string>();
      const stack = [...(children.get(id) ?? [])];
      while (stack.length) {
        const n = stack.pop()!;
        if (salida.has(n)) continue;
        salida.add(n);
        stack.push(...(children.get(n) ?? []));
      }
      return salida;
    },
    [children]
  );

  const alternar = useCallback((id: string) => {
    establecerContraida((previo) => {
      const siguiente = new Set(previo);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });
  }, []);

  // Nodos y aristas visibles (los descendientes de un nodo contraído se ocultan)
  const idsOcultos = useMemo(() => {
    const h = new Set<string>();
    contraida.forEach((id) => descendientes(id).forEach((d) => h.add(d)));
    return h;
  }, [contraida, descendientes]);

  // Resalta el vecindario del nodo en hover/selección y atenúa el resto
  const idEnfoque = idHover ?? idSeleccionado;
  const vecinos = useMemo(() => {
    if (!idEnfoque) return null;
    const s = new Set<string>([idEnfoque]);
    aristas.forEach((e) => {
      if (e.source === idEnfoque) s.add(e.target);
      if (e.target === idEnfoque) s.add(e.source);
    });
    return s;
  }, [idEnfoque, aristas]);

  const nodosVista = useMemo(
    () =>
      nodos.map((n) => ({
        ...n,
        hidden: idsOcultos.has(n.id),
        data: { ...n.data, cantidadHijos: (children.get(n.id) ?? []).length, contraida: contraida.has(n.id), tenue: !!vecinos && !vecinos.has(n.id), alAlternar: alternar },
      })),
    [nodos, idsOcultos, children, contraida, vecinos, alternar]
  );
  const aristasVista = useMemo(
    () =>
      aristas.map((e) => {
        const activo = !!idEnfoque && (e.source === idEnfoque || e.target === idEnfoque);
        return { ...e, hidden: idsOcultos.has(e.target) || idsOcultos.has(e.source), animated: activo, style: { ...estiloArista, ...e.style, ...(activo ? { stroke: "var(--color-primary)", strokeWidth: 2.4 } : vecinos ? { opacity: 0.25 } : {}) } };
      }),
    [aristas, idsOcultos, idEnfoque, vecinos]
  );

  const onNodesChange = useCallback((c: NodeChange[]) => establecerNodos((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: EdgeChange[]) => establecerAristas((e) => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback((c: Connection) => establecerAristas((e) => addEdge({ ...c, type: "smoothstep", style: estiloArista }, e)), []);

  // Reencuadra tras expandir/contraer
  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 350, padding: 0.2 }), 60);
    return () => clearTimeout(t);
  }, [contraida, fitView]);

  const seleccionado = nodos.find((n) => n.id === idSeleccionado) ?? null;
  const relacionados = seleccionado ? aristas.filter((e) => e.source === seleccionado.id || e.target === seleccionado.id).map((e) => nodos.find((n) => n.id === (e.source === seleccionado.id ? e.target : e.source))).filter(Boolean) as Node<DatosConcepto>[] : [];
  const cantidadHijos = seleccionado ? (children.get(seleccionado.id) ?? []).length : 0;
  const aristaEntrante = seleccionado ? aristas.find((e) => e.target === seleccionado.id) : undefined;
  const definicion = seleccionado ? definicionDe(seleccionado, conceptos) : undefined;

  function agregarNodo() {
    const id = idAleatorio("node");
    const padre = seleccionado ?? nodos.find((n) => n.data.nivel === 0) ?? null;
    const nivel = Math.min(2, (padre?.data.nivel ?? 0) + 1);
    const nodo: Node<DatosConcepto> = {
      id,
      type: "concepto",
      position: posicionLibre(padre, nodos, origen === "ia" ? ALTO_NIVEL : 140),
      data: { etiqueta: nivel === 1 ? "Nuevo concepto" : "Nuevo subconcepto", detalle: "", nivel, cantidadHijos: 0, contraida: false, tenue: false, alAlternar: alternar },
    };
    const arista = padre ? crearArista(idAleatorio("e"), padre.id, id, origen === "ia" ? "" : undefined) : null;
    if (origen === "ia" && arista) {
      // En los mapas generados el nodo entra en su rama y todo el mapa se reordena con el mismo algoritmo que lo generó.
      establecerNodos(reordenar([...nodos, nodo], [...aristas, arista], { id, ancho: 170 }));
      setTimeout(() => fitView({ duration: 350, padding: 0.2 }), 60);
    } else {
      establecerNodos((n) => [...n, nodo]);
    }
    if (padre && arista) {
      // Con la rama contraída el nodo nuevo quedaría oculto: se expande.
      establecerContraida((previo) => {
        const siguiente = new Set(previo);
        siguiente.delete(padre.id);
        return siguiente;
      });
      establecerAristas((e) => [...e, arista]);
    }
    establecerIdSeleccionado(id);
    establecerIdNuevo(id);
  }

  function rename(etiqueta: string) {
    establecerNodos((ns) => ns.map((n) => (n.id === idSeleccionado ? { ...n, data: { ...n.data, etiqueta } } : n)));
  }

  function describir(detalle: string) {
    establecerNodos((ns) => ns.map((n) => (n.id === idSeleccionado ? { ...n, data: { ...n.data, detalle } } : n)));
  }

  function cambiarFrase(frase: string) {
    establecerAristas((es) => es.map((e) => (e.id === aristaEntrante?.id ? { ...e, label: frase } : e)));
  }

  function quitar() {
    if (!idSeleccionado) return;
    establecerNodos((ns) => ns.filter((n) => n.id !== idSeleccionado));
    establecerAristas((es) => es.filter((e) => e.source !== idSeleccionado && e.target !== idSeleccionado));
    establecerIdSeleccionado(null);
  }

  // Guarda las ediciones (solo si quien monta el mapa lo pide): se agrupan en una sola escritura y se vuelcan al salir.
  const alEditarRef = useRef(alEditar);
  alEditarRef.current = alEditar;
  const firmaPrevia = useRef<string | null>(null);
  const pendiente = useRef<MapaMental | null>(null);
  const volcar = useCallback(() => {
    if (!pendiente.current) return;
    emitido.current = pendiente.current;
    alEditarRef.current?.(pendiente.current);
    pendiente.current = null;
  }, []);
  useEffect(() => {
    if (!alEditarRef.current) return;
    const actual = aMapaMental(mapa.idTema, nodos, aristas);
    const firma = JSON.stringify(actual);
    if (firmaPrevia.current === null) {
      firmaPrevia.current = firma; // estado inicial: no hay nada que guardar
      return;
    }
    if (firma === firmaPrevia.current) return; // cambios que no son del mapa (selección, medidas...)
    firmaPrevia.current = firma;
    pendiente.current = actual;
    const t = setTimeout(volcar, 350);
    return () => clearTimeout(t);
  }, [nodos, aristas, mapa.idTema, volcar]);
  useEffect(() => volcar, [volcar]);

  // Un nodo recién creado deja el cursor en su nombre, ya seleccionado, para escribir el concepto de inmediato.
  useEffect(() => {
    if (idNuevo && idNuevo === idSeleccionado && refTitulo.current) {
      refTitulo.current.focus();
      refTitulo.current.select();
      establecerIdNuevo(null);
    }
  }, [idNuevo, idSeleccionado]);

  const todosLosPadres = [...children.keys()];
  const todosContraidos = todosLosPadres.length > 0 && todosLosPadres.every((p) => contraida.has(p) || p === "root") ;

  return (
    <div className="cm-wrap">
      <ReactFlow
        nodes={nodosVista}
        edges={aristasVista}
        nodeTypes={tiposNodo}
        edgeTypes={tiposArista}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => establecerIdSeleccionado(n.id)}
        onNodeMouseEnter={(_, n) => establecerIdHover(n.id)}
        onNodeMouseLeave={() => establecerIdHover(null)}
        onPaneClick={() => establecerIdSeleccionado(null)}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.25}
        maxZoom={2.2}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="var(--color-border-strong)" gap={22} size={1.4} />
        <Controls showInteractive={false} position="bottom-left" />
        <MiniMap pannable zoomable className="cm-minimap" style={ESTILO_MINIMAPA} nodeColor="var(--color-primary)" maskColor="rgba(100, 116, 139, 0.18)" />
      </ReactFlow>

      <div className="cm-toolbar" role="toolbar" aria-label="Herramientas del mapa">
        <Boton variante="secondary" tamano="sm" icono={<Plus size={14} />} onClick={agregarNodo}>
          {seleccionado ? "Añadir subconcepto" : "Nuevo concepto"}
        </Boton>
        <Boton variante="secondary" tamano="sm" icono={<Maximize2 size={14} />} onClick={() => fitView({ duration: 350, padding: 0.2 })} aria-label="Ajustar a la pantalla">
          <span className="hide-mobile">Ajustar</span>
        </Boton>
        <Boton
          variante="secondary"
          tamano="sm"
          icono={todosContraidos ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
          onClick={() => establecerContraida(todosContraidos ? new Set() : new Set(todosLosPadres.filter((p) => nodos.find((n) => n.id === p)?.data.nivel === 1)))}
        >
          <span className="hide-mobile">{todosContraidos ? "Expandir todo" : "Contraer ramas"}</span>
        </Boton>
        <Boton variante="ghost" tamano="sm" icono={<RotateCcw size={14} />} onClick={alRegenerar}>
          <span className="hide-mobile">Regenerar</span>
        </Boton>
        <DescargaMapa obtenerMapa={() => aMapaExportable(titulo ?? "", origen ?? "ejemplo", nodos, aristas, conceptos)} />
        {origen && <Insignia tono={origen === "ia" ? "blue" : "neutral"}>{origen === "ia" ? "Generado con IA" : "Mapa de ejemplo"}</Insignia>}
      </div>

      {!seleccionado && (
        <p className="cm-hint hide-mobile">
          Arrastra para desplazarte · rueda o pellizco para hacer zoom · clic en un concepto para ver su detalle · doble clic para expandir o contraer
        </p>
      )}

      {seleccionado && (
        <aside className="cm-panel" aria-label="Detalle del concepto">
          <header>
            <span className={`cm-level level-${seleccionado.data.nivel}`}>{seleccionado.data.nivel === 0 ? "Tema" : seleccionado.data.nivel === 1 ? "Concepto" : "Subconcepto"}</span>
            <button className="cm-close" onClick={() => establecerIdSeleccionado(null)} aria-label="Cerrar detalle">
              <X size={16} />
            </button>
          </header>
          <input ref={refTitulo} className="cm-title-input" value={seleccionado.data.etiqueta} onChange={(e) => rename(e.target.value)} placeholder="Escribe el concepto" aria-label="Nombre del concepto" />
          {origen === "ia" && aristaEntrante?.type === "enlace" && (
            <input
              className="cm-link-input"
              value={typeof aristaEntrante.label === "string" ? aristaEntrante.label : ""}
              onChange={(e) => cambiarFrase(e.target.value)}
              placeholder="Frase de enlace con el concepto superior"
              aria-label="Frase de enlace con el concepto superior"
            />
          )}
          <textarea className="cm-def" value={definicion ?? ""} onChange={(e) => describir(e.target.value)} placeholder="Escribe aquí la descripción de este concepto" aria-label="Descripción del concepto" rows={5} />

          {relacionados.length > 0 && (
            <div className="cm-rel">
              <h4>Conectado con</h4>
              <div className="chip-list">
                {relacionados.map((r) => (
                  <button key={r.id} className="chip chip-btn" onClick={() => establecerIdSeleccionado(r.id)}>
                    {r.data.etiqueta}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer>
            {cantidadHijos > 0 && (
              <Boton variante="secondary" tamano="sm" onClick={() => alternar(seleccionado.id)}>
                {contraida.has(seleccionado.id) ? "Expandir rama" : "Contraer rama"}
              </Boton>
            )}
            {seleccionado.data.nivel > 0 && (
              <Boton variante="danger" tamano="sm" icono={<Trash2 size={14} />} onClick={quitar}>
                Eliminar
              </Boton>
            )}
          </footer>
        </aside>
      )}

      <div className="cm-zoom-keys sr-only">
        <button onClick={() => zoomIn()}>Acercar</button>
        <button onClick={() => zoomOut()}>Alejar</button>
      </div>
    </div>
  );
}

export default function MapaConceptual(props: Props) {
  return (
    <ReactFlowProvider>
      <Lienzo {...props} />
    </ReactFlowProvider>
  );
}
