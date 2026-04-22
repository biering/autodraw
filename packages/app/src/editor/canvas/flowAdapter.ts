import {
  styleById,
  type DiagramV1,
  type EdgeRecord,
  type NodeRecord,
  type NodeStyleDefinition,
} from "@agentsdraw/core";
import type { Edge, Node } from "@xyflow/react";

/** Precomputed at adapter time so custom nodes avoid subscribing to the full diagram store. */
export type DiagramNodeResolvedStyle = {
  fill: string;
  stroke: string;
  defaultShape: NodeStyleDefinition["shape"];
};

export type DiagramNodeData = {
  label: string;
  w: number;
  h: number;
  styleId: string;
  shape?: NodeRecord["shape"];
  resolvedStyle: DiagramNodeResolvedStyle;
};

function rgbaFromStyleChannels(r: number, g: number, b: number, a: number): string {
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a})`;
}

function resolvedStyleFromDefinition(
  styleDef: NodeStyleDefinition | undefined,
): DiagramNodeResolvedStyle {
  if (!styleDef) {
    return {
      fill: "#eee",
      stroke: "#444",
      defaultShape: "roundedRect",
    };
  }
  return {
    fill: rgbaFromStyleChannels(
      styleDef.fillRed,
      styleDef.fillGreen,
      styleDef.fillBlue,
      styleDef.fillAlpha,
    ),
    stroke: rgbaFromStyleChannels(
      styleDef.strokeRed,
      styleDef.strokeGreen,
      styleDef.strokeBlue,
      styleDef.strokeAlpha,
    ),
    defaultShape: styleDef.shape,
  };
}

export type DiagramEdgeData = EdgeRecord;

/** React Flow node type for custom `diagram` nodes (used with `NodeProps` / memo comparators). */
export type DiagramFlowNode = Node<DiagramNodeData, "diagram">;

/** React Flow edge type for custom `diagram` edges. */
export type DiagramFlowEdge = Edge<DiagramEdgeData, "diagram">;

/** Default ports when a legacy edge has no stored handles (original right→left layout). */
export const DEFAULT_DIAGRAM_SOURCE_HANDLE = "src";
export const DEFAULT_DIAGRAM_TARGET_HANDLE = "tgt";

export function toFlowNodes(diagram: DiagramV1): DiagramFlowNode[] {
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
      resolvedStyle: resolvedStyleFromDefinition(styleById(diagram, n.styleId)),
    },
    style: { width: n.w, height: n.h },
  }));
}

export function toFlowEdges(diagram: DiagramV1): DiagramFlowEdge[] {
  return diagram.edges.map((e) => ({
    id: e.id,
    source: e.from,
    target: e.to,
    type: "diagram",
    data: { ...e },
    selectable: true,
    focusable: true,
    sourceHandle: e.sourceHandle ?? DEFAULT_DIAGRAM_SOURCE_HANDLE,
    targetHandle: e.targetHandle ?? DEFAULT_DIAGRAM_TARGET_HANDLE,
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
