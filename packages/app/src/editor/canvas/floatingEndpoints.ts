import { Position } from "@xyflow/react";

const EPS = 1e-9;

/**
 * Ray from the center of rectangle A toward point B, intersected with A's axis-aligned bounds.
 * `position` is the side hit (for existing stub / bezier routing).
 */
export function rectFloatingEndpoint(
  aCx: number,
  aCy: number,
  aW: number,
  aH: number,
  bCx: number,
  bCy: number,
): { x: number; y: number; position: Position } {
  const dx = bCx - aCx;
  const dy = bCy - aCy;

  if (Math.abs(dx) < EPS && Math.abs(dy) < EPS) {
    return { x: aCx, y: aCy, position: Position.Right };
  }

  const halfW = aW / 2;
  const halfH = aH / 2;
  const scaleX = Math.abs(dx) < EPS ? Number.POSITIVE_INFINITY : halfW / Math.abs(dx);
  const scaleY = Math.abs(dy) < EPS ? Number.POSITIVE_INFINITY : halfH / Math.abs(dy);
  const sRaw = Math.min(scaleX, scaleY);
  const s = Math.min(1, sRaw * 0.999);

  const x = aCx + dx * s;
  const y = aCy + dy * s;

  let position: Position;
  if (scaleX < scaleY - EPS) {
    position = dx > 0 ? Position.Right : Position.Left;
  } else if (scaleY < scaleX - EPS) {
    position = dy > 0 ? Position.Bottom : Position.Top;
  } else {
    // Tie: pick the dominant axis by comparing parametric distance to that face.
    if (Math.abs(dx) * halfH >= Math.abs(dy) * halfW) {
      position = dx > 0 ? Position.Right : Position.Left;
    } else {
      position = dy > 0 ? Position.Bottom : Position.Top;
    }
  }

  return { x, y, position };
}

export function floatingEdgeGeometry(
  a: { cx: number; cy: number; w: number; h: number },
  b: { cx: number; cy: number; w: number; h: number },
): {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sourcePosition: Position;
  targetPosition: Position;
} {
  const source = rectFloatingEndpoint(a.cx, a.cy, a.w, a.h, b.cx, b.cy);
  const target = rectFloatingEndpoint(b.cx, b.cy, b.w, b.h, a.cx, a.cy);
  return {
    sx: source.x,
    sy: source.y,
    tx: target.x,
    ty: target.y,
    sourcePosition: source.position,
    targetPosition: target.position,
  };
}
