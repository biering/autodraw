import { Position } from "@xyflow/react";

const MIN_SEGMENT_PX = 4;
const INSET_BASE_PX = 7;
const ORTHO_STUB_BASE_PX = 18;
const ORTHO_STUB_MIN_LEG_PX = 2;

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

export function computeOrthogonalStubPx(strokeWidth: number): number {
  return ORTHO_STUB_BASE_PX + Math.min(6, strokeWidth * 0.45);
}

function isVerticalHandleNormal(position: Position): boolean {
  return position === Position.Top || position === Position.Bottom;
}

function polylineD(points: readonly [number, number][]): string {
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
}

/** Non-degenerate legs must be at least this long; zero-length “elbow” collapse is allowed. */
function stubPolylineFeasible(
  points: readonly [number, number][],
  minHardPx: number,
): boolean {
  for (let i = 1; i < points.length; i++) {
    const ax = points[i - 1]![0];
    const ay = points[i - 1]![1];
    const bx = points[i]![0];
    const by = points[i]![1];
    const d = Math.hypot(bx - ax, by - ay);
    if (d < 1e-6) continue;
    if (d < minHardPx) return false;
  }
  return true;
}

/**
 * Orthogonal path with short perpendicular stubs at each inset endpoint (bracket shape when
 * both handles are coplanar, e.g. top–top). Stub length is clamped so non-collapsed legs stay
 * at least `ORTHO_STUB_MIN_LEG_PX` when possible; otherwise falls back to the simple elbow
 * without stubs.
 */
export function orthogonalStubPath(
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  sourcePosition: Position,
  targetPosition: Position,
  stubPx: number,
): { d: string; labelX: number; labelY: number } {
  const ns = outwardNormalForHandle(sourcePosition);
  const nt = outwardNormalForHandle(targetPosition);
  const verticalMid = isVerticalHandleNormal(sourcePosition);

  const buildCollapsed = (): { d: string; labelX: number; labelY: number } => {
    if (verticalMid) {
      const midX = (sx + tx) / 2;
      const points: [number, number][] = [
        [sx, sy],
        [midX, sy],
        [midX, ty],
        [tx, ty],
      ];
      return { d: polylineD(points), labelX: midX, labelY: (sy + ty) / 2 };
    }
    const midY = (sy + ty) / 2;
    const points: [number, number][] = [
      [sx, sy],
      [sx, midY],
      [tx, midY],
      [tx, ty],
    ];
    return { d: polylineD(points), labelX: (sx + tx) / 2, labelY: midY };
  };

  const buildStubbed = (stub: number): { d: string; labelX: number; labelY: number; points: [number, number][] } => {
    const s2x = sx + ns.x * stub;
    const s2y = sy + ns.y * stub;
    const t2x = tx + nt.x * stub;
    const t2y = ty + nt.y * stub;

    let points: [number, number][];
    let labelX: number;
    let labelY: number;

    if (verticalMid) {
      const midX = (s2x + t2x) / 2;
      points = [
        [sx, sy],
        [s2x, s2y],
        [midX, s2y],
        [midX, t2y],
        [t2x, t2y],
        [tx, ty],
      ];
      labelX = midX;
      labelY = (s2y + t2y) / 2;
    } else {
      const midY = (s2y + t2y) / 2;
      points = [
        [sx, sy],
        [s2x, s2y],
        [s2x, midY],
        [t2x, midY],
        [t2x, t2y],
        [tx, ty],
      ];
      labelX = (s2x + t2x) / 2;
      labelY = midY;
    }

    return { d: polylineD(points), labelX, labelY, points };
  };

  if (stubPx < ORTHO_STUB_MIN_LEG_PX) {
    return buildCollapsed();
  }

  const full = buildStubbed(stubPx);
  if (stubPolylineFeasible(full.points, ORTHO_STUB_MIN_LEG_PX)) {
    return { d: full.d, labelX: full.labelX, labelY: full.labelY };
  }

  let lo = ORTHO_STUB_MIN_LEG_PX;
  let hi = stubPx;
  if (!stubPolylineFeasible(buildStubbed(lo).points, ORTHO_STUB_MIN_LEG_PX)) {
    return buildCollapsed();
  }

  for (let i = 0; i < 22; i++) {
    const mid = (lo + hi) / 2;
    if (stubPolylineFeasible(buildStubbed(mid).points, ORTHO_STUB_MIN_LEG_PX)) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const best = buildStubbed(lo);
  if (stubPolylineFeasible(best.points, ORTHO_STUB_MIN_LEG_PX)) {
    return { d: best.d, labelX: best.labelX, labelY: best.labelY };
  }
  return buildCollapsed();
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
