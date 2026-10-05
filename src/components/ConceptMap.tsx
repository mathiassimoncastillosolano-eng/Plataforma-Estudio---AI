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
import type { KeyConcept, MindMap } from "../types";
import { normalize } from "../utils/concepts";
import { randomId } from "../utils/mockDelay";
import Button from "./Button";

interface ConceptData {
  label: string;
  detail?: string;
  level: number;
  childCount: number;
  collapsed: boolean;
  dim: boolean;
  onToggle: (id: string) => void;
}

const ConceptNode = memo(function ConceptNode({ id, data, selected }: NodeProps<ConceptData>) {
  return (
    <div className={`cm-node level-${data.level} ${selected ? "is-selected" : ""} ${data.dim ? "is-dim" : ""}`} onDoubleClick={() => data.childCount > 0 && data.onToggle(id)}>
      <Handle type="target" position={Position.Top} className="cm-handle" />
      <span className="cm-label">{data.label}</span>
      {data.childCount > 0 && (
        <button
          className="cm-expand nodrag"
          onClick={(e) => {
            e.stopPropagation();
            data.onToggle(id);
          }}
          aria-label={data.collapsed ? `Expandir ${data.label}` : `Contraer ${data.label}`}
          title={data.collapsed ? "Expandir" : "Contraer"}
        >
          {data.collapsed ? `+${data.childCount}` : "−"}
        </button>
      )}
      <Handle type="source" position={Position.Bottom} className="cm-handle" />
    </div>
  );
});
const nodeTypes = { concept: ConceptNode };

const edgeStyle = { stroke: "var(--color-border-strong)", strokeWidth: 1.6 };

function toNodes(map: MindMap): Node<ConceptData>[] {
  return map.nodes.map((n) => ({
    id: n.id,
    type: "concept",
    position: { x: n.x, y: n.y },
    data: { label: n.label, detail: n.detail, level: n.level, childCount: 0, collapsed: false, dim: false, onToggle: () => {} },
  }));
}
function toEdges(map: MindMap): Edge[] {
  return map.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: "smoothstep", style: edgeStyle }));
}

interface Props {
  map: MindMap;
  concepts: KeyConcept[];
  onRegenerate: () => void;
}

function Canvas({ map, concepts, onRegenerate }: Props) {
  const [nodes, setNodes] = useState<Node<ConceptData>[]>(() => toNodes(map));
  const [edges, setEdges] = useState<Edge[]>(() => toEdges(map));
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  // Reinicia al regenerar el mapa
  useEffect(() => {
    setNodes(toNodes(map));
    setEdges(toEdges(map));
    setCollapsed(new Set());
    setSelectedId(null);
  }, [map]);

  const children = useMemo(() => {
    const m = new Map<string, string[]>();
    edges.forEach((e) => m.set(e.source, [...(m.get(e.source) ?? []), e.target]));
    return m;
  }, [edges]);

  const descendants = useCallback(
    (id: string) => {
      const out = new Set<string>();
      const stack = [...(children.get(id) ?? [])];
      while (stack.length) {
        const n = stack.pop()!;
        if (out.has(n)) continue;
        out.add(n);
        stack.push(...(children.get(n) ?? []));
      }
      return out;
    },
    [children]
  );

  const toggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Nodos y aristas visibles (los descendientes de un nodo contraído se ocultan)
  const hiddenIds = useMemo(() => {
    const h = new Set<string>();
    collapsed.forEach((id) => descendants(id).forEach((d) => h.add(d)));
    return h;
  }, [collapsed, descendants]);

  // Resalta el vecindario del nodo en hover/selección y atenúa el resto
  const focusId = hoverId ?? selectedId;
  const neighbors = useMemo(() => {
    if (!focusId) return null;
    const s = new Set<string>([focusId]);
    edges.forEach((e) => {
      if (e.source === focusId) s.add(e.target);
      if (e.target === focusId) s.add(e.source);
    });
    return s;
  }, [focusId, edges]);

  const viewNodes = useMemo(
    () =>
      nodes.map((n) => ({
        ...n,
        hidden: hiddenIds.has(n.id),
        data: { ...n.data, childCount: (children.get(n.id) ?? []).length, collapsed: collapsed.has(n.id), dim: !!neighbors && !neighbors.has(n.id), onToggle: toggle },
      })),
    [nodes, hiddenIds, children, collapsed, neighbors, toggle]
  );
  const viewEdges = useMemo(
    () =>
      edges.map((e) => {
        const active = !!focusId && (e.source === focusId || e.target === focusId);
        return { ...e, hidden: hiddenIds.has(e.target) || hiddenIds.has(e.source), animated: active, style: { ...edgeStyle, ...(active ? { stroke: "var(--color-primary)", strokeWidth: 2.4 } : neighbors ? { opacity: 0.25 } : {}) } };
      }),
    [edges, hiddenIds, focusId, neighbors]
  );

  const onNodesChange = useCallback((c: NodeChange[]) => setNodes((n) => applyNodeChanges(c, n)), []);
  const onEdgesChange = useCallback((c: EdgeChange[]) => setEdges((e) => applyEdgeChanges(c, e)), []);
  const onConnect = useCallback((c: Connection) => setEdges((e) => addEdge({ ...c, type: "smoothstep", style: edgeStyle }, e)), []);

  // Reencuadra tras expandir/contraer
  useEffect(() => {
    const t = setTimeout(() => fitView({ duration: 350, padding: 0.2 }), 60);
    return () => clearTimeout(t);
  }, [collapsed, fitView]);

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const related = selected ? edges.filter((e) => e.source === selected.id || e.target === selected.id).map((e) => nodes.find((n) => n.id === (e.source === selected.id ? e.target : e.source))).filter(Boolean) as Node<ConceptData>[] : [];
  const childCount = selected ? (children.get(selected.id) ?? []).length : 0;
  const definition = selected
    ? selected.data.detail ?? concepts.find((c) => normalize(c.term).includes(normalize(selected.data.label)) || normalize(selected.data.label).includes(normalize(c.term)))?.definition
    : undefined;

  function addNode() {
    const id = randomId("node");
    const parent = selected ?? nodes.find((n) => n.data.level === 0) ?? null;
    const base = parent?.position ?? { x: 300, y: 100 };
    const siblings = parent ? (children.get(parent.id) ?? []).length : 0;
    const node: Node<ConceptData> = {
      id,
      type: "concept",
      position: { x: base.x + (siblings - 1) * 170, y: base.y + 140 },
      data: { label: "Nuevo concepto", level: Math.min(2, (parent?.data.level ?? 0) + 1), childCount: 0, collapsed: false, dim: false, onToggle: toggle },
    };
    setNodes((n) => [...n, node]);
    if (parent) setEdges((e) => [...e, { id: randomId("e"), source: parent.id, target: id, type: "smoothstep", style: edgeStyle }]);
    setSelectedId(id);
  }

  function rename(label: string) {
    setNodes((ns) => ns.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, label } } : n)));
  }

  function remove() {
    if (!selectedId) return;
    setNodes((ns) => ns.filter((n) => n.id !== selectedId));
    setEdges((es) => es.filter((e) => e.source !== selectedId && e.target !== selectedId));
    setSelectedId(null);
  }

  const allParents = [...children.keys()];
  const allCollapsed = allParents.length > 0 && allParents.every((p) => collapsed.has(p) || p === "root") ;

  return (
    <div className="cm-wrap">
      <ReactFlow
        nodes={viewNodes}
        edges={viewEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, n) => setSelectedId(n.id)}
        onNodeMouseEnter={(_, n) => setHoverId(n.id)}
        onNodeMouseLeave={() => setHoverId(null)}
        onPaneClick={() => setSelectedId(null)}
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
        <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={addNode}>
          {selected ? "Añadir subconcepto" : "Nuevo concepto"}
        </Button>
        <Button variant="secondary" size="sm" icon={<Maximize2 size={14} />} onClick={() => fitView({ duration: 350, padding: 0.2 })} aria-label="Ajustar a la pantalla">
          <span className="hide-mobile">Ajustar</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          icon={allCollapsed ? <ChevronsUpDown size={14} /> : <ChevronsDownUp size={14} />}
          onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(allParents.filter((p) => nodes.find((n) => n.id === p)?.data.level === 1)))}
        >
          <span className="hide-mobile">{allCollapsed ? "Expandir todo" : "Contraer ramas"}</span>
        </Button>
        <Button variant="ghost" size="sm" icon={<RotateCcw size={14} />} onClick={onRegenerate}>
          <span className="hide-mobile">Regenerar</span>
        </Button>
      </div>

      {!selected && (
        <p className="cm-hint hide-mobile">
          Arrastra para desplazarte · rueda o pellizco para hacer zoom · clic en un concepto para ver su detalle · doble clic para expandir o contraer
        </p>
      )}

      {selected && (
        <aside className="cm-panel" aria-label="Detalle del concepto">
          <header>
            <span className={`cm-level level-${selected.data.level}`}>{selected.data.level === 0 ? "Tema" : selected.data.level === 1 ? "Concepto" : "Subconcepto"}</span>
            <button className="cm-close" onClick={() => setSelectedId(null)} aria-label="Cerrar detalle">
              <X size={16} />
            </button>
          </header>
          <input className="cm-title-input" value={selected.data.label} onChange={(e) => rename(e.target.value)} aria-label="Nombre del concepto" />
          <p className="cm-def">{definition ?? "Aún no hay una descripción para este concepto. Puedes revisarlo en el resumen del tema."}</p>

          {related.length > 0 && (
            <div className="cm-rel">
              <h4>Conectado con</h4>
              <div className="chip-list">
                {related.map((r) => (
                  <button key={r.id} className="chip chip-btn" onClick={() => setSelectedId(r.id)}>
                    {r.data.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer>
            {childCount > 0 && (
              <Button variant="secondary" size="sm" onClick={() => toggle(selected.id)}>
                {collapsed.has(selected.id) ? "Expandir rama" : "Contraer rama"}
              </Button>
            )}
            {selected.data.level > 0 && (
              <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={remove}>
                Eliminar
              </Button>
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

export default function ConceptMap(props: Props) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
