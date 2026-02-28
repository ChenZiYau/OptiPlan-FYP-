import { useMemo, useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, Loader2, RefreshCw, Sparkles, Maximize2, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStudyHub } from '@/contexts/StudyHubContext';
import { useMindMap } from '@/hooks/useMindMap';
import { GlassNode } from './GlassNode';
import { ChatPanel, type ChatPanelHandle } from './ChatPanel';
import {
  getLayoutedElements,
  getDefaultCollapsedIds,
  buildChildrenMap,
} from '@/lib/mindmap-layout';

const nodeTypes = { studyCard: GlassNode };

function MindMapTabInner() {
  const { activeNotebookId } = useStudyHub();
  const { data, loading, generating, generate } = useMindMap(activeNotebookId);
  const { fitView } = useReactFlow();

  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const prevDataRef = useRef(data);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const chatRef = useRef<ChatPanelHandle>(null);
  const [pendingQuestion, setPendingQuestion] = useState<{ question: string; context?: string } | null>(null);

  // Resizable chat panel
  const [chatWidth, setChatWidth] = useState(380);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;

    const startX = e.clientX;
    const startWidth = chatWidth;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return;
      // Dragging left = wider chat, dragging right = narrower chat
      const delta = startX - moveEvent.clientX;
      const containerWidth = containerRef.current?.offsetWidth ?? 1000;
      const minChat = 280;
      const maxChat = Math.floor(containerWidth * 0.6);
      setChatWidth(Math.min(maxChat, Math.max(minChat, startWidth + delta)));
    };

    const onMouseUp = () => {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [chatWidth]);

  // When data changes: show root + level-1 children only; everything deeper starts collapsed
  useEffect(() => {
    if (data !== prevDataRef.current) {
      prevDataRef.current = data;
      if (data && data.nodes.length > 0 && data.edges.length > 0) {
        setCollapsedIds(getDefaultCollapsedIds(data.edges, data.nodes));
      } else {
        setCollapsedIds(new Set());
      }
    }
  }, [data]);

  // Handle chat click from node button or leaf-node click
  const handleNodeChat = useCallback((label: string, details: string) => {
    const question = `Explain "${label}"`;
    // Pass node details as hidden context so the AI uses it without showing in chat
    const context = details || undefined;

    if (!chatOpen) {
      setChatOpen(true);
      setPendingQuestion({ question, context });
    } else {
      chatRef.current?.sendQuestion(question, context);
    }
  }, [chatOpen]);

  // Flush pending question once chat panel is mounted
  useEffect(() => {
    if (chatOpen && pendingQuestion && chatRef.current) {
      chatRef.current.sendQuestion(pendingQuestion.question, pendingQuestion.context);
      setPendingQuestion(null);
    }
  }, [chatOpen, pendingQuestion]);

  // Build children map for leaf detection
  const childrenMap = useMemo(() => {
    if (!data) return new Map<string, string[]>();
    return buildChildrenMap(data.edges);
  }, [data]);

  // Compute layout via dagre
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!data || data.nodes.length === 0) {
      return { nodes: [], edges: [] };
    }
    return getLayoutedElements({
      rawNodes: data.nodes,
      rawEdges: data.edges,
      collapsedIds,
      onChatClick: handleNodeChat,
    });
  }, [data, collapsedIds, handleNodeChat]);

  // Node click: leaf → chat, parent → expand/collapse
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const hasChildren = (childrenMap.get(node.id) ?? []).length > 0;

    if (!hasChildren) {
      // Leaf node → send to chat
      handleNodeChat(node.data.label, node.data.details || '');
      return;
    }

    // Parent node → expand/collapse
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(node.id)) {
        next.delete(node.id);
      } else {
        next.add(node.id);
      }
      return next;
    });
  }, [childrenMap, handleNodeChat]);

  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);

  // Sync layout into state and fitView
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);

    if (layoutedNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 400, padding: 0.25 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

  // Re-fit when chat panel toggles (canvas width changes)
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ duration: 300, padding: 0.25 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [chatOpen, fitView, nodes.length]);

  const handleGenerate = useCallback(async () => {
    try {
      await generate();
      toast.success('Mind map generated!');
    } catch (err: any) {
      toast.error('Generation failed', { description: err.message });
    }
  }, [generate]);

  const handleExpandAll = useCallback(() => {
    setCollapsedIds(new Set());
  }, []);

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

  if (!data || data.nodes.length === 0) {
    return (
      <div className="rounded-xl bg-[#18162e] border border-white/10 p-16 flex flex-col items-center justify-center text-center">
        <Network className="w-12 h-12 text-gray-600 mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Generate Mind Map</h3>
        <p className="text-sm text-gray-500 max-w-md mb-8">
          AI will analyze your uploaded sources and build an interactive study map with key concepts, definitions, and formulas you can expand step by step.
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

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-purple-400" />
          <span className="text-sm font-semibold text-white">
            {nodes.length} nodes
          </span>
          <span className="text-xs text-gray-500">Click a node to expand · Click leaf to chat</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setChatOpen((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              chatOpen
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/30'
                : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
          {collapsedIds.size > 0 && (
            <button
              onClick={handleExpandAll}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Expand All
            </button>
          )}
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
      </div>

      {/* Canvas + Chat side-by-side */}
      <div ref={containerRef} className="flex" style={{ height: '560px' }}>
        {/* ReactFlow Canvas */}
        <div className="flex-1 rounded-xl border border-white/10 overflow-hidden min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            nodesDraggable={false}
            nodesConnectable={false}
            fitView
            fitViewOptions={{ padding: 0.25 }}
            minZoom={0.2}
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

        {/* Resize handle + Chat Panel */}
        {chatOpen && (
          <>
            {/* Drag handle */}
            <div
              onMouseDown={handleResizeStart}
              className="group/handle w-4 shrink-0 flex items-center justify-center cursor-col-resize hover:bg-purple-500/10 transition-colors"
            >
              <div className="w-[3px] h-10 rounded-full bg-white/10 group-hover/handle:bg-purple-500/50 transition-colors" />
            </div>

            {/* Chat */}
            <div className="shrink-0 relative" style={{ width: chatWidth }}>
              <button
                onClick={() => setChatOpen(false)}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <ChatPanel ref={chatRef} />
            </div>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 px-1">
        {[
          { label: 'Main Topic', color: 'bg-purple-500' },
          { label: 'Section', color: 'bg-blue-500' },
          { label: 'Topic', color: 'bg-emerald-500' },
          { label: 'Detail', color: 'bg-amber-500' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
            <span className="text-[11px] text-gray-500">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MindMapTab() {
  return (
    <ReactFlowProvider>
      <MindMapTabInner />
    </ReactFlowProvider>
  );
}
