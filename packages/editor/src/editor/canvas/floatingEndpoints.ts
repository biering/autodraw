import { Position } from "@xyflow/react";

const EPS = 1e-9;

function faceMidpoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  position: Position,
): { x: number; y: number } {
  const hw = w / 2;
  const hh = h / 2;
  switch (position) {
    case Position.Right:
      return { x: cx + hw, y: cy };
    case Position.Left:
      return { x: cx - hw, y: cy };
    case Position.Top:
      return { x: cx, y: cy - hh };
    case Position.Bottom:
      return { x: cx, y: cy + hh };
    default:
      return { x: cx, y: cy };
  }
}

/**
 * Picks which side of rectangle A faces point B using a center-to-center ray (same as intersecting
 * the ray with A's bounds), then returns the **midpoint** of that side so edges attach centered on
 * each face (not along the diagonal toward B).
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
    return { ...faceMidpoint(aCx, aCy, aW, aH, Position.Right), position: Position.Right };
  }

  const halfW = aW / 2;
  const halfH = aH / 2;
  const scaleX = Math.abs(dx) < EPS ? Number.POSITIVE_INFINITY : halfW / Math.abs(dx);
  const scaleY = Math.abs(dy) < EPS ? Number.POSITIVE_INFINITY : halfH / Math.abs(dy);

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

  return { ...faceMidpoint(aCx, aCy, aW, aH, position), position };
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
