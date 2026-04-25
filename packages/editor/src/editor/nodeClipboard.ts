import {
  defaultStyleId,
  nodeShapeSchema,
  styleById,
  type DiagramV1,
  type NodeRecord,
} from "@autodraw/core";

/** Current clipboard marker (serialized JSON `$type`). */
export const NODE_CLIP_MARKER = "autodraw-node-clip-v1";
export const NODES_CLIP_MARKER = "autodraw-nodes-clip-v1";

/** Legacy markers from Agentsdraw — still accepted when pasting. */
const LEGACY_NODE_CLIP_MARKER = "agentsdraw-node-clip-v1";
const LEGACY_NODES_CLIP_MARKER = "agentsdraw-nodes-clip-v1";

const SNAP = 16;

function snapCoord(v: number): number {
  return Math.round(v / SNAP) * SNAP;
}

export function serializeNodeForClip(n: NodeRecord): string {
  return JSON.stringify({
    $type: NODE_CLIP_MARKER,
    text: n.text,
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    styleId: n.styleId,
    shape: n.shape,
  });
}

/** Multi-node clipboard payload (keyboard copy uses this even for a single node). */
export function serializeNodesForClip(nodes: NodeRecord[]): string {
  return JSON.stringify({
    $type: NODES_CLIP_MARKER,
    nodes: nodes.map((n) => ({
      text: n.text,
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
      styleId: n.styleId,
      shape: n.shape,
    })),
  });
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function parseNodeClipFields(parsed: Record<string, unknown>): Omit<NodeRecord, "id"> | null {
  const label = str(parsed.text);
  const w = num(parsed.w);
  const h = num(parsed.h);
  const styleId = str(parsed.styleId);
  if (label === null || w === null || h === null || styleId === null) return null;
  if (w <= 0 || h <= 0) return null;

  let shape: NodeRecord["shape"];
  if (parsed.shape !== undefined) {
    const sh = nodeShapeSchema.safeParse(parsed.shape);
    if (!sh.success) return null;
    shape = sh.data;
  }

  return {
    text: label,
    x: num(parsed.x) ?? 0,
    y: num(parsed.y) ?? 0,
    w,
    h,
    styleId,
    shape,
  };
}

function isNodesClipType(t: unknown): t is typeof NODES_CLIP_MARKER | typeof LEGACY_NODES_CLIP_MARKER {
  return t === NODES_CLIP_MARKER || t === LEGACY_NODES_CLIP_MARKER;
}

function isNodeClipType(t: unknown): t is typeof NODE_CLIP_MARKER | typeof LEGACY_NODE_CLIP_MARKER {
  return t === NODE_CLIP_MARKER || t === LEGACY_NODE_CLIP_MARKER;
}

/**
 * Parse clipboard JSON: multi-node clip, or single-node clip (current or legacy `$type`).
 */
export function parseAutodrawNodesClipboard(text: string): Omit<NodeRecord, "id">[] | null {
  const t = text.trim();
  if (!t.startsWith("{")) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(t) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;

  if (isNodesClipType(parsed.$type) && Array.isArray(parsed.nodes)) {
    const out: Omit<NodeRecord, "id">[] = [];
    for (const el of parsed.nodes) {
      if (!isRecord(el)) return null;
      const one = parseNodeClipFields(el);
      if (!one) return null;
      out.push(one);
    }
    return out.length > 0 ? out : null;
  }

  if (isNodeClipType(parsed.$type)) {
    const one = parseNodeClipFields(parsed);
    return one ? [one] : null;
  }

  return null;
}

/**
 * Parse clipboard JSON produced by {@link serializeNodeForClip}. Returns `null` if the payload
 * is not exactly one valid node (multi-node clips return `null` here).
 */
export function parseAutodrawNodeClipboard(text: string): Omit<NodeRecord, "id"> | null {
  const arr = parseAutodrawNodesClipboard(text);
  if (!arr || arr.length !== 1) return null;
  return arr[0] ?? null;
}

export function resolveStyleIdForPaste(diagram: DiagramV1, styleId: string): string {
  return styleById(diagram, styleId) ? styleId : defaultStyleId(diagram.palette);
}

/** Place pasted node centered on `(flowX, flowY)` with grid snap; clipboard x/y are ignored. */
export function placementForPaste(
  payload: Omit<NodeRecord, "id">,
  flowX: number,
  flowY: number,
  diagram: DiagramV1,
): Omit<NodeRecord, "id"> {
  const w = payload.w;
  const h = payload.h;
  const x = snapCoord(flowX - w / 2);
  const y = snapCoord(flowY - h / 2);
  return {
    ...payload,
    x,
    y,
    styleId: resolveStyleIdForPaste(diagram, payload.styleId),
  };
}

/** Place pasted nodes: one node is centered like {@link placementForPaste}; multiple keep relative layout. */
export function placementForMultiPaste(
  payloads: Omit<NodeRecord, "id">[],
  flowX: number,
  flowY: number,
  diagram: DiagramV1,
): Omit<NodeRecord, "id">[] {
  if (payloads.length === 0) return [];
  if (payloads.length === 1) {
    return [placementForPaste(payloads[0]!, flowX, flowY, diagram)];
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of payloads) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x + p.w);
    maxY = Math.max(maxY, p.y + p.h);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const ox = flowX - cx;
  const oy = flowY - cy;
  return payloads.map((p) => ({
    ...p,
    x: snapCoord(p.x + ox),
    y: snapCoord(p.y + oy),
    styleId: resolveStyleIdForPaste(diagram, p.styleId),
  }));
}
