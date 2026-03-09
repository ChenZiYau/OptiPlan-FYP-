import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { MindMapNode, MindMapEdge } from '@/types/studyhub';

const NODE_WIDTH = 280;
const NODE_HEIGHT = 90;

/** Build parent → children adjacency map from edges */
export function buildChildrenMap(edges: MindMapEdge[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const e of edges) {
    const children = map.get(e.source) ?? [];
    children.push(e.target);
    map.set(e.source, children);
  }
  return map;
}

/** Find root node IDs (nodes that are never a target) */
export function findRootIds(
  nodes: MindMapNode[],
  edges: MindMapEdge[]
): string[] {
  const targets = new Set(edges.map((e) => e.target));
  return nodes.filter((n) => !targets.has(n.id)).map((n) => n.id);
}

/**
 * Compute the set of node IDs to collapse by default:
 * Root is expanded (visible + its direct children visible).
 * Everything at level 2+ starts collapsed.
 */
export function getDefaultCollapsedIds(
  edges: MindMapEdge[],
  nodes: MindMapNode[]
): Set<string> {
  const childrenMap = buildChildrenMap(edges);
  const rootIds = new Set(findRootIds(nodes, edges));
  const collapsed = new Set<string>();

  // Every node that has children AND is not a root gets collapsed
  for (const [parentId, children] of childrenMap) {
    if (children.length > 0 && !rootIds.has(parentId)) {
      collapsed.add(parentId);
    }
  }
  return collapsed;
}

/** Recursively collect all descendant IDs of collapsed nodes */
function getHiddenIds(
  collapsedIds: Set<string>,
  childrenMap: Map<string, string[]>
): Set<string> {
  const hidden = new Set<string>();
  function recurse(parentId: string) {
    const children = childrenMap.get(parentId) ?? [];
    for (const cid of children) {
      hidden.add(cid);
      recurse(cid);
    }
  }
  for (const id of collapsedIds) {
    recurse(id);
  }
  return hidden;
}

interface LayoutInput {
  rawNodes: MindMapNode[];
  rawEdges: MindMapEdge[];
  collapsedIds: Set<string>;
  onChatClick?: (label: string, details: string) => void;
}

export function getLayoutedElements({
  rawNodes,
  rawEdges,
  collapsedIds,
  onChatClick,
}: LayoutInput): { nodes: Node[]; edges: Edge[] } {
  const childrenMap = buildChildrenMap(rawEdges);
  const hiddenIds = getHiddenIds(collapsedIds, childrenMap);

  // Filter to visible nodes/edges
  const visibleNodes = rawNodes.filter((n) => !hiddenIds.has(n.id));
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = rawEdges.filter(
    (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
  );

  // Create dagre graph
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', ranksep: 150, nodesep: 80 });

  for (const node of visibleNodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }
  for (const edge of visibleEdges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  // Map dagre results to ReactFlow nodes
  const flowNodes: Node[] = visibleNodes.map((n) => {
    const pos = g.node(n.id);
    const hasChildren = (childrenMap.get(n.id) ?? []).length > 0;
    const isCollapsed = collapsedIds.has(n.id);

    return {
      id: n.id,
      type: 'studyCard',
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
      data: {
        label: n.label,
        details: n.details || '',
        type: n.type,
        hasChildren,
        isCollapsed,
        onChatClick,
      },
    };
  });

  // Map to ReactFlow edges
  const flowEdges: Edge[] = visibleEdges.map((e, i) => ({
    id: `e-${e.source}-${e.target}-${i}`,
    source: e.source,
    target: e.target,
    type: 'smoothstep',
    animated: false,
    style: { stroke: 'rgba(168,85,247,0.3)', strokeWidth: 1.5 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(168,85,247,0.4)',
    },
  }));

  return { nodes: flowNodes, edges: flowEdges };
}
