import { useMemo, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useMindMap } from '@/hooks/useMindMap';
import { GlassNode } from './GlassNode';

const nodeTypes = { glass: GlassNode };

// Simple auto-layout: arrange nodes in a grid
function layoutNodes(rawNodes: { id: string; label: string; type: string }[]): Node[] {
  const cols = Math.ceil(Math.sqrt(rawNodes.length));
  const spacingX = 220;
  const spacingY = 140;

  return rawNodes.map((n, i) => ({
    id: n.id,
    type: 'glass',
    position: {
      x: (i % cols) * spacingX + Math.random() * 30,
      y: Math.floor(i / cols) * spacingY + Math.random() * 20,
    },
    data: { label: n.label, type: n.type },
  }));
}

function toFlowEdges(rawEdges: { source: string; target: string; label: string }[]): Edge[] {
  return rawEdges.map((e, i) => ({
    id: `e${i}`,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'default',
    animated: true,
    style: { stroke: 'rgba(168,85,247,0.4)', strokeWidth: 1.5 },
    labelStyle: { fill: '#9ca3af', fontSize: 10, fontWeight: 500 },
    labelBgStyle: { fill: '#0f0e1a', fillOpacity: 0.8 },
    labelBgPadding: [6, 3] as [number, number],
    labelBgBorderRadius: 4,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'rgba(168,85,247,0.6)' },
  }));
}

export function MindMapTab() {
  const { activeNotebookId } = useStudyHub();
  const { data, loading, generating, generate } = useMindMap(activeNotebookId);

  const initialNodes = useMemo(() => (data ? layoutNodes(data.nodes) : []), [data]);
  const initialEdges = useMemo(() => (data ? toFlowEdges(data.edges) : []), [data]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes/edges when data changes
  useMemo(() => {
    if (data) {
      setNodes(layoutNodes(data.nodes));
      setEdges(toFlowEdges(data.edges));
    }
  }, [data, setNodes, setEdges]);

  const handleGenerate = useCallback(async () => {
    try {
      await generate();
      toast.success('Mind map generated!');
    } catch (err: any) {
      toast.error('Generation failed', { description: err.message });
    }
  }, [generate]);

  if (!activeNotebookId) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <p className="text-sm text-gray-500">Select a notebook to generate a mind map</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  // No mind map yet — show generate button
  if (!data || data.nodes.length === 0) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <Network className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Generate Mind Map</h3>
        <p className="text-sm text-gray-500 max-w-md mb-8">
          Gemini will analyze your uploaded sources and extract key concepts and relationships into an interactive knowledge graph.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transition-all disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate Mind Map</>
          )}
        </button>
      </div>
    );
  }

  // Render ReactFlow canvas
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-white">{nodes.length} nodes, {edges.length} edges</span>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Regenerating...</>
          ) : (
            <><RefreshCw className="w-3.5 h-3.5" /> Regenerate</>
          )}
        </button>
      </div>

      {/* Canvas */}
      <div className="rounded-xl border border-white/10 overflow-hidden" style={{ height: '520px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          style={{ background: '#0B0A1A' }}
        >
          <Background color="rgba(168,85,247,0.06)" gap={24} size={1} />
          <Controls
            showInteractive={false}
            className="!bg-[#18162e] !border-white/10 !rounded-lg !shadow-xl [&>button]:!bg-white/5 [&>button]:!border-white/10 [&>button]:!text-gray-400 [&>button:hover]:!bg-white/10 [&>button:hover]:!text-white"
          />
          <MiniMap
            nodeColor={() => 'rgba(168,85,247,0.4)'}
            maskColor="rgba(0,0,0,0.7)"
            className="!bg-[#18162e] !border-white/10 !rounded-lg"
          />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {[
          { type: 'concept', color: 'bg-purple-500' },
          { type: 'term', color: 'bg-blue-500' },
          { type: 'person', color: 'bg-green-500' },
          { type: 'process', color: 'bg-amber-500' },
          { type: 'example', color: 'bg-pink-500' },
        ].map(({ type, color }) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-[11px] text-gray-500 capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
