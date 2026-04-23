import {
  FALLBACK_NODE_BODY_FILL_DARK,
  FALLBACK_NODE_BODY_FILL_RGBA,
  FALLBACK_NODE_BODY_STROKE_DARK,
  FALLBACK_NODE_BODY_STROKE_RGBA,
  resolvedNodeBodyFillForCanvas,
  resolvedNodeBodyStrokeForCanvas,
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

/** Matches editor canvas background; included on node data so memoized nodes re-render on toggle. */
export type DiagramCanvasTheme = "light" | "dark";

export type DiagramNodeData = {
  label: string;
  w: number;
  h: number;
  styleId: string;
  shape?: NodeRecord["shape"];
  resolvedStyle: DiagramNodeResolvedStyle;
  canvasTheme: DiagramCanvasTheme;
};

function resolvedStyleFromDefinition(
  styleDef: NodeStyleDefinition | undefined,
  canvasTheme: DiagramCanvasTheme,
): DiagramNodeResolvedStyle {
  if (!styleDef) {
    const dark = canvasTheme === "dark";
    return {
      fill: dark ? FALLBACK_NODE_BODY_FILL_DARK : FALLBACK_NODE_BODY_FILL_RGBA,
      stroke: dark ? FALLBACK_NODE_BODY_STROKE_DARK : FALLBACK_NODE_BODY_STROKE_RGBA,
      defaultShape: "roundedRect",
    };
  }
  return {
    fill: resolvedNodeBodyFillForCanvas(styleDef, styleDef.id, canvasTheme),
    stroke: resolvedNodeBodyStrokeForCanvas(styleDef, canvasTheme),
    defaultShape: styleDef.shape,
  };
}

export type DiagramEdgeData = EdgeRecord;

/** React Flow node type for custom `diagram` nodes (used with `NodeProps` / memo comparators). */
export type DiagramFlowNode = Node<DiagramNodeData, "diagram">;

/** React Flow edge type for custom `diagram` edges. */
export type DiagramFlowEdge = Edge<DiagramEdgeData, "diagram">;

/** Default ports for legacy edges / tests (original right→left layout). Not applied in `toFlowEdges`. */
export const DEFAULT_DIAGRAM_SOURCE_HANDLE = "src";
export const DEFAULT_DIAGRAM_TARGET_HANDLE = "tgt";

/** Full-node handles for floating edges; normalized away before persisting. */
export const DIAGRAM_BODY_SOURCE_HANDLE = "body-src";
/** Visible drag-to-connect affordance (Link2 button) — distinct id so it coexists with the permanent anchor. */
export const DIAGRAM_BODY_SOURCE_BUTTON_HANDLE = "body-src-btn";
export const DIAGRAM_BODY_TARGET_HANDLE = "body-tgt";

/**
 * Always strips the handle id. Edges should attach to the node body (floating geometry chooses the
 * side based on relative layout), never to a specific handle. Kept as a function so call-sites can
 * later opt into per-handle pinning without refactoring every call site.
 */
export function normalizeDiagramConnectionHandle(
  _handleId: string | null | undefined,
  _role: "source" | "target",
): string | undefined {
  return undefined;
}

export function toFlowNodes(
  diagram: DiagramV1,
  canvasTheme: DiagramCanvasTheme = "light",
): DiagramFlowNode[] {
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
      resolvedStyle: resolvedStyleFromDefinition(styleById(diagram, n.styleId), canvasTheme),
      canvasTheme,
    },
    style: { width: n.w, height: n.h },
  }));
}

export function toFlowEdges(diagram: DiagramV1): DiagramFlowEdge[] {
  return diagram.edges.map((e) => {
    const fe: DiagramFlowEdge = {
      id: e.id,
      source: e.from,
      target: e.to,
      type: "diagram",
      data: { ...e },
      selectable: true,
      focusable: true,
    };
    if (e.sourceHandle != null && e.sourceHandle !== "") {
      fe.sourceHandle = e.sourceHandle;
    }
    if (e.targetHandle != null && e.targetHandle !== "") {
      fe.targetHandle = e.targetHandle;
    }
    return fe;
  });
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
