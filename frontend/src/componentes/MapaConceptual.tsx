import { memo, useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import { ChevronsDownUp, ChevronsUpDown, Maximize2, Plus, RotateCcw, Trash2, X } from "lucide-react";
import type { ConceptoClave, MapaMental } from "../tipos";
import { normalizar } from "../utilidades/conceptos";
import { idAleatorio } from "../utilidades/retardoSimulado";
import Boton from "./Boton";

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
      <span className="cm-label">{datos.etiqueta}</span>
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

const estiloArista = { stroke: "var(--color-border-strong)", strokeWidth: 1.6 };

function aNodos(mapa: MapaMental): Node<DatosConcepto>[] {
  return mapa.nodos.map((n) => ({
    id: n.id,
    type: "concepto",
    position: { x: n.x, y: n.y },
    data: { etiqueta: n.etiqueta, detalle: n.detalle, nivel: n.nivel, cantidadHijos: 0, contraida: false, tenue: false, alAlternar: () => {} },
  }));
}
function aAristas(mapa: MapaMental): Edge[] {
  return mapa.aristas.map((e) => ({ id: e.id, source: e.fuente, target: e.objetivo, type: "smoothstep", style: estiloArista }));
}

interface Props {
  mapa: MapaMental;
  conceptos: ConceptoClave[];
  alRegenerar: () => void;
}

function Lienzo({ mapa, conceptos, alRegenerar }: Props) {
  const [nodos, establecerNodos] = useState<Node<DatosConcepto>[]>(() => aNodos(mapa));
  const [aristas, establecerAristas] = useState<Edge[]>(() => aAristas(mapa));
  const [contraida, establecerContraida] = useState<Set<string>>(new Set());
  const [idSeleccionado, establecerIdSeleccionado] = useState<string | null>(null);
  const [idHover, establecerIdHover] = useState<string | null>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Reinicia al regenerar el mapa
  useEffect(() => {
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
        datos: { ...n.data, cantidadHijos: (children.get(n.id) ?? []).length, contraida: contraida.has(n.id), tenue: !!vecinos && !vecinos.has(n.id), alAlternar: alternar },
      })),
    [nodos, idsOcultos, children, contraida, vecinos, alternar]
  );
  const aristasVista = useMemo(
    () =>
      aristas.map((e) => {
        const activo = !!idEnfoque && (e.source === idEnfoque || e.target === idEnfoque);
        return { ...e, hidden: idsOcultos.has(e.target) || idsOcultos.has(e.source), animated: activo, style: { ...estiloArista, ...(activo ? { stroke: "var(--color-primary)", strokeWidth: 2.4 } : vecinos ? { opacity: 0.25 } : {}) } };
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
  const definicion = seleccionado
    ? seleccionado.data.detalle ?? conceptos.find((c) => normalizar(c.termino).includes(normalizar(seleccionado.data.etiqueta)) || normalizar(seleccionado.data.etiqueta).includes(normalizar(c.termino)))?.definicion
    : undefined;

  function agregarNodo() {
    const id = idAleatorio("node");
    const padre = seleccionado ?? nodos.find((n) => n.data.nivel === 0) ?? null;
    const base = padre?.position ?? { x: 300, y: 100 };
    const hermanos = padre ? (children.get(padre.id) ?? []).length : 0;
    const nodo: Node<DatosConcepto> = {
      id,
      type: "concept",
      position: { x: base.x + (hermanos - 1) * 170, y: base.y + 140 },
      data: { etiqueta: "Nuevo concepto", nivel: Math.min(2, (padre?.data.nivel ?? 0) + 1), cantidadHijos: 0, contraida: false, tenue: false, alAlternar: alternar },
    };
    establecerNodos((n) => [...n, nodo]);
    if (padre) establecerAristas((e) => [...e, { id: idAleatorio("e"), source: padre.id, target: id, type: "smoothstep", style: estiloArista }]);
    establecerIdSeleccionado(id);
  }

  function rename(etiqueta: string) {
    establecerNodos((ns) => ns.map((n) => (n.id === idSeleccionado ? { ...n, data: { ...n.data, etiqueta } } : n)));
  }

  function quitar() {
    if (!idSeleccionado) return;
    establecerNodos((ns) => ns.filter((n) => n.id !== idSeleccionado));
    establecerAristas((es) => es.filter((e) => e.source !== idSeleccionado && e.target !== idSeleccionado));
    establecerIdSeleccionado(null);
  }

  const todosLosPadres = [...children.keys()];
  const todosContraidos = todosLosPadres.length > 0 && todosLosPadres.every((p) => contraida.has(p) || p === "root") ;

  return (
    <div className="cm-wrap">
      <ReactFlow
        nodes={nodosVista}
        edges={aristasVista}
        nodeTypes={tiposNodo}
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
        <MiniMap pannable zoomable className="cm-minimap" nodeColor="var(--color-primary)" maskColor="transparent" />
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
          <input className="cm-title-input" value={seleccionado.data.etiqueta} onChange={(e) => rename(e.target.value)} aria-label="Nombre del concepto" />
          <p className="cm-def">{definicion ?? "Aún no hay una descripción para este concepto. Puedes revisarlo en el resumen del tema."}</p>

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
