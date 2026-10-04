import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "reactflow";
import "reactflow/dist/style.css";
import { Plus, Trash2, Save, RotateCcw } from "lucide-react";
import { useTopicContext } from "../layouts/topicContext";
import * as aiService from "../services/aiService";
import type { MindMap } from "../types";
import { LoadingState, ErrorState } from "../components/States";
import Button from "../components/Button";
import { randomId } from "../utils/mockDelay";

function toFlowNodes(map: MindMap): Node[] {
  return map.nodes.map((n) => ({
    id: n.id,
    position: { x: n.x, y: n.y },
    data: { label: n.label },
    className: `mm-node level-${n.level}`,
    style: { width: "auto" },
  }));
}

function toFlowEdges(map: MindMap): Edge[] {
  return map.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "smoothstep",
    style: { stroke: "#94a3b8" },
  }));
}

export default function MindMapPage() {
  const { topic } = useTopicContext();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  async function load() {
    setStatus("loading");
    try {
      const map = await aiService.generateMindMap(topic.id, topic.title);
      setNodes(toFlowNodes(map));
      setEdges(toFlowEdges(map));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic.id]);

  const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  const onConnect = useCallback(
    (connection: Connection) =>
      setEdges((eds) => addEdge({ ...connection, type: "smoothstep", style: { stroke: "#94a3b8" } }, eds)),
    []
  );

  function addNode() {
    const id = randomId("node");
    const newNode: Node = {
      id,
      position: { x: 120 + Math.random() * 400, y: 380 + Math.random() * 80 },
      data: { label: "Nuevo concepto" },
      className: "mm-node level-2",
    };
    setNodes((nds) => [...nds, newNode]);
    setSelectedNodeId(id);
  }

  function renameSelected(label: string) {
    setNodes((nds) => nds.map((n) => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label } } : n)));
  }

  function deleteSelected() {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  }

  const selectedNode = useMemo(() => nodes.find((n) => n.id === selectedNodeId) ?? null, [nodes, selectedNodeId]);

  if (status === "loading") return <LoadingState message="Generando mapa conceptual..." />;
  if (status === "error") return <ErrorState onRetry={load} />;

  return (
    <div>
      <div className="mindmap-toolbar">
        <p className="text-muted" style={{ fontSize: 13.5 }}>
          Arrastra los nodos, conéctalos y edítalos. Los cambios se mantienen mientras navegas esta sesión.
        </p>
        <div className="row gap-sm">
          <Button variant="secondary" size="sm" onClick={addNode}>
            <Plus size={14} />
            Nuevo nodo
          </Button>
          <Button variant="ghost" size="sm" onClick={load}>
            <RotateCcw size={14} />
            Regenerar
          </Button>
        </div>
      </div>

      {selectedNode && (
        <div className="row gap-sm" style={{ marginBottom: 14 }}>
          <input
            className="input"
            style={{ maxWidth: 260 }}
            value={(selectedNode.data as { label: string }).label}
            onChange={(e) => renameSelected(e.target.value)}
          />
          <Button variant="danger" size="sm" onClick={deleteSelected}>
            <Trash2 size={14} />
            Eliminar nodo
          </Button>
          <span className="text-muted" style={{ fontSize: 12.5, display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={13} />
            Editando: {(selectedNode.data as { label: string }).label}
          </span>
        </div>
      )}

      <div className="mindmap-shell">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          fitView
        >
          <Background color="#cbd5e1" gap={20} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable style={{ background: "#f8fafc" }} />
        </ReactFlow>
      </div>
    </div>
  );
}
