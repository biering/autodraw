import { Position } from "@xyflow/react";

const MIN_SEGMENT_PX = 4;
const INSET_BASE_PX = 7;

/** Outward unit normal from the node along a handle on that side (flow coordinates, +y down). */
export function outwardNormalForHandle(position: Position): { x: number; y: number } {
  switch (position) {
    case Position.Top:
      return { x: 0, y: -1 };
    case Position.Bottom:
      return { x: 0, y: 1 };
    case Position.Left:
      return { x: -1, y: 0 };
    case Position.Right:
      return { x: 1, y: 0 };
    default:
      return { x: 0, y: 0 };
  }
}

export function computeEdgeInsetPx(strokeWidth: number): number {
  return INSET_BASE_PX + Math.min(3, strokeWidth * 0.35);
}

/**
 * Shifts edge endpoints outward from handle centers so the stroke clears the port ring and node edge.
 * When full inset would make the segment shorter than `minSegmentPx`, scales inset down (shared factor).
 */
export function clampedInsetEndpoints(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourcePosition: Position,
  targetPosition: Position,
  sourceInsetPx: number,
  targetInsetPx: number,
  minSegmentPx: number = MIN_SEGMENT_PX,
): { sx: number; sy: number; tx: number; ty: number } {
  const ns = outwardNormalForHandle(sourcePosition);
  const nt = outwardNormalForHandle(targetPosition);
  const s1x = sourceX + ns.x * sourceInsetPx;
  const s1y = sourceY + ns.y * sourceInsetPx;
  const t1x = targetX + nt.x * targetInsetPx;
  const t1y = targetY + nt.y * targetInsetPx;

  const dist = (ax: number, ay: number, bx: number, by: number) => Math.hypot(bx - ax, by - ay);

  const at = (alpha: number) => ({
    sx: sourceX + (s1x - sourceX) * alpha,
    sy: sourceY + (s1y - sourceY) * alpha,
    tx: targetX + (t1x - targetX) * alpha,
    ty: targetY + (t1y - targetY) * alpha,
  });

  const dRaw = dist(sourceX, sourceY, targetX, targetY);
  if (dRaw < minSegmentPx) {
    return { sx: sourceX, sy: sourceY, tx: targetX, ty: targetY };
  }

  const dFull = dist(s1x, s1y, t1x, t1y);
  if (dFull >= minSegmentPx) {
    return { sx: s1x, sy: s1y, tx: t1x, ty: t1y };
  }

  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    const p = at(mid);
    if (dist(p.sx, p.sy, p.tx, p.ty) >= minSegmentPx) lo = mid;
    else hi = mid;
  }
  const out = at(lo);
  return { sx: out.sx, sy: out.sy, tx: out.tx, ty: out.ty };
}
