import type { DiagramV1, EdgeRecord, NodeRecord } from "@agentsdraw/core";
import type { Edge, Node } from "@xyflow/react";

export type DiagramNodeData = {
  label: string;
  w: number;
  h: number;
  styleId: string;
  shape?: NodeRecord["shape"];
};

export type DiagramEdgeData = EdgeRecord;

export function toFlowNodes(diagram: DiagramV1): Node<DiagramNodeData>[] {
  return diagram.nodes.map((n) => ({
    id: n.id,
    type: "diagram",
    position: { x: n.x, y: n.y },
    data: {
      label: n.text,
      w: n.w,
      h: n.h,
      styleId: n.styleId,
      shape: n.shape,
    },
    style: { width: n.w, height: n.h },
  }));
}

export function toFlowEdges(diagram: DiagramV1): Edge<DiagramEdgeData>[] {
  return diagram.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: "diagram",
    data: { ...e },
  }));
}

export function applyNodePositionChanges(diagram: DiagramV1, nodes: Node[]): DiagramV1 {
  const pos = new Map(nodes.map((n) => [n.id, n.position]));
  return {
    ...diagram,
    nodes: diagram.nodes.map((n) => {
      const p = pos.get(n.id);
      if (!p) return n;
      return { ...n, x: p.x, y: p.y };
    }),
  };
}
