import {
  type DiagramV1,
  type EdgeRecord,
  FALLBACK_NODE_BODY_FILL_DARK,
  FALLBACK_NODE_BODY_FILL_RGBA,
  FALLBACK_NODE_BODY_STROKE_DARK,
  FALLBACK_NODE_BODY_STROKE_RGBA,
  type FrameRecord,
  type ImageRecord,
  type NodeRecord,
  type NodeStyleDefinition,
  resolvedNodeBodyFillForCanvas,
  resolvedNodeBodyStrokeForCanvas,
  styleById,
  type TextLabelRecord,
} from "@autodraw/core";
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
  link?: string;
  locked?: boolean;
  /** When true, node UI skips global document editing/connect affordances (marketing peek, etc.). */
  interactionDisabled?: boolean;
};

export type DiagramFrameData = FrameRecord & {
  canvasTheme: DiagramCanvasTheme;
  /** When true (e.g. marketing peek), skip resize / inline title edit. */
  interactionDisabled?: boolean;
};
export type DiagramImageData = ImageRecord & { canvasTheme: DiagramCanvasTheme };
export type DiagramTextLabelData = TextLabelRecord & { canvasTheme: DiagramCanvasTheme };

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
export type DiagramFrameFlowNode = Node<DiagramFrameData, "diagramFrame">;
export type DiagramImageFlowNode = Node<DiagramImageData, "diagramImage">;
export type DiagramTextLabelFlowNode = Node<DiagramTextLabelData, "diagramTextLabel">;

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

export function toFlowNodes(diagram: DiagramV1, canvasTheme: DiagramCanvasTheme = "light"): Node[] {
  const out: Node[] = [];
  for (const f of diagram.frames) {
    out.push({
      id: f.id,
      type: "diagramFrame",
      position: { x: f.x, y: f.y },
      data: { ...f, canvasTheme },
      style: { width: f.w, height: f.h, zIndex: -10 },
      draggable: true,
      selectable: true,
    });
  }
  for (const im of diagram.images) {
    out.push({
      id: im.id,
      type: "diagramImage",
      position: { x: im.x, y: im.y },
      data: { ...im, canvasTheme },
      style: { width: im.w, height: im.h, zIndex: -5 },
      draggable: true,
      selectable: true,
    });
  }
  const frameIds = new Set(diagram.frames.map((f) => f.id));
  for (const n of diagram.nodes) {
    const hasParent = n.parentId != null && frameIds.has(n.parentId);
    out.push({
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
        ...(n.link !== undefined ? { link: n.link } : {}),
        ...(n.locked === true ? { locked: true } : {}),
      },
      style: { width: n.w, height: n.h, zIndex: 0 },
      draggable: n.locked !== true,
      selectable: true,
      // React Flow sub-flow: when parented, position is relative to the frame and dragging
      // is constrained to the frame body. https://reactflow.dev/learn/layouting/sub-flows
      ...(hasParent ? { parentId: n.parentId, extent: "parent" as const, expandParent: true } : {}),
    });
  }
  for (const t of diagram.textLabels) {
    const tw = Math.min(480, Math.max(48, t.text.length * 7 + 20));
    const th = 28;
    out.push({
      id: t.id,
      type: "diagramTextLabel",
      position: { x: t.x, y: t.y },
      data: { ...t, canvasTheme },
      style: { width: tw, height: th, zIndex: 5 },
      draggable: true,
      selectable: true,
    });
  }
  return out;
}

/**
 * Inner padding kept around children of a frame so the dashed border isn't flush with their edges.
 * `top` leaves room for the inline title; `left` matches the title's horizontal inset.
 */
export const FRAME_INNER_PAD = { top: 36, left: 24, right: 16, bottom: 16 } as const;

/** Next relative position for a new child inside `frameId` (stacked vertically under siblings). */
export function nextChildRelativePlacement(
  diagram: DiagramV1,
  frameId: string,
): { x: number; y: number } {
  const siblings = diagram.nodes.filter((n) => n.parentId === frameId);
  const x = FRAME_INNER_PAD.left;
  const y =
    siblings.length === 0
      ? FRAME_INNER_PAD.top
      : Math.round(Math.max(...siblings.map((s) => s.y + s.h)) + 16);
  return { x, y };
}

/**
 * Frame layout that fully contains its children with all four inner paddings honored. When a child
 * sits closer to the parent's relative origin than `FRAME_INNER_PAD.{left,top}`, the frame shifts
 * up/left by `dx`/`dy` (and grows by the same amount) so the child's absolute position is
 * preserved. `dx`/`dy` is the per-axis shift that callers must apply to each child's relative
 * coords to compensate for the new origin.
 */
export function paddedFrameLayout(
  frame: FrameRecord,
  children: readonly NodeRecord[],
): { x: number; y: number; w: number; h: number; dx: number; dy: number } {
  if (children.length === 0) {
    return { x: frame.x, y: frame.y, w: frame.w, h: frame.h, dx: 0, dy: 0 };
  }
  const minX = Math.min(...children.map((c) => c.x));
  const minY = Math.min(...children.map((c) => c.y));
  const dx = Math.max(0, FRAME_INNER_PAD.left - minX);
  const dy = Math.max(0, FRAME_INNER_PAD.top - minY);
  const maxR = Math.max(...children.map((c) => c.x + dx + c.w));
  const maxB = Math.max(...children.map((c) => c.y + dy + c.h));
  return {
    x: Math.round(frame.x - dx),
    y: Math.round(frame.y - dy),
    w: Math.max(frame.w + dx, Math.round(maxR + FRAME_INNER_PAD.right)),
    h: Math.max(frame.h + dy, Math.round(maxB + FRAME_INNER_PAD.bottom)),
    dx,
    dy,
  };
}

/** `paddedFrameLayout` projection that returns just the (potentially-grown) outer width/height. */
export function paddedFrameSize(
  frame: FrameRecord,
  children: readonly NodeRecord[],
): { w: number; h: number } {
  const { w, h } = paddedFrameLayout(frame, children);
  return { w, h };
}

/**
 * Grow each frame to contain its children plus inner padding on all four sides. Never shrinks a
 * frame; left/top deficits are absorbed by shifting the frame origin up-left while compensating
 * the children's relative coords so absolute positions stay stable.
 */
export function withPaddedFrames(d: DiagramV1): DiagramV1 {
  if (d.frames.length === 0) return d;
  const childrenByParent = new Map<string, NodeRecord[]>();
  for (const n of d.nodes) {
    if (n.parentId == null) continue;
    const arr = childrenByParent.get(n.parentId) ?? [];
    arr.push(n);
    childrenByParent.set(n.parentId, arr);
  }
  const shifts = new Map<string, { dx: number; dy: number }>();
  let frameChanged = false;
  const frames = d.frames.map((f) => {
    const kids = childrenByParent.get(f.id);
    if (!kids || kids.length === 0) return f;
    const { x, y, w, h, dx, dy } = paddedFrameLayout(f, kids);
    if (dx > 0 || dy > 0) shifts.set(f.id, { dx, dy });
    if (x === f.x && y === f.y && w === f.w && h === f.h) return f;
    frameChanged = true;
    return { ...f, x, y, w, h };
  });
  let nodes = d.nodes;
  if (shifts.size > 0) {
    nodes = d.nodes.map((n) => {
      if (n.parentId == null) return n;
      const s = shifts.get(n.parentId);
      if (!s) return n;
      return { ...n, x: Math.round(n.x + s.dx), y: Math.round(n.y + s.dy) };
    });
  }
  if (!frameChanged && nodes === d.nodes) return d;
  return { ...d, frames, nodes };
}

/**
 * Pick the frame whose bounds contain the given node's center, used to re-parent a top-level
 * node when it's dragged onto an area. Returns `undefined` for already-parented nodes.
 */
export function findDropTargetFrame(diagram: DiagramV1, nodeId: string): FrameRecord | undefined {
  const n = diagram.nodes.find((x) => x.id === nodeId);
  if (!n || n.parentId != null) return undefined;
  const cx = n.x + n.w / 2;
  const cy = n.y + n.h / 2;
  return diagram.frames.find((f) => cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h);
}

export function toFlowEdges(diagram: DiagramV1): DiagramFlowEdge[] {
  return diagram.edges.map((e) => {
    const fe: DiagramFlowEdge = {
      id: e.id,
      source: e.from,
      target: e.to,
      type: "diagram",
      data: { ...e },
      selectable: e.locked !== true,
      focusable: e.locked !== true,
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

/** Width/height React Flow reports for a node (style, explicit fields, or measurement). */
export function flowNodePixelSize(n: Node): { w: number; h: number } {
  const rawW =
    (typeof n.width === "number" ? n.width : undefined) ??
    (typeof n.style?.width === "number" ? n.style.width : undefined) ??
    (typeof n.measured?.width === "number" ? n.measured.width : undefined);
  const rawH =
    (typeof n.height === "number" ? n.height : undefined) ??
    (typeof n.style?.height === "number" ? n.style.height : undefined) ??
    (typeof n.measured?.height === "number" ? n.measured.height : undefined);
  const w = rawW != null && Number.isFinite(rawW) ? rawW : 160;
  const h = rawH != null && Number.isFinite(rawH) ? rawH : 120;
  const min = 48;
  return { w: Math.max(min, w), h: Math.max(min, h) };
}

/** Sync node positions and frame dimensions from React Flow after drag / resize. */
export function applyNodeLayoutChanges(diagram: DiagramV1, nodes: Node[]): DiagramV1 {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const next: DiagramV1 = {
    ...diagram,
    nodes: diagram.nodes.map((n) => {
      const flow = byId.get(n.id);
      if (!flow) return n;
      return { ...n, x: flow.position.x, y: flow.position.y };
    }),
    frames: diagram.frames.map((f) => {
      const flow = byId.get(f.id);
      if (!flow) return f;
      const { w, h } = flowNodePixelSize(flow);
      return { ...f, x: flow.position.x, y: flow.position.y, w, h };
    }),
    images: diagram.images.map((im) => {
      const flow = byId.get(im.id);
      if (!flow) return im;
      return { ...im, x: flow.position.x, y: flow.position.y };
    }),
    textLabels: diagram.textLabels.map((t) => {
      const flow = byId.get(t.id);
      if (!flow) return t;
      return { ...t, x: flow.position.x, y: flow.position.y };
    }),
  };
  return withPaddedFrames(next);
}
