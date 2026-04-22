import type { EdgeRouting } from "./schema.js";

export type Point = { x: number; y: number };
export type Rect = { x: number; y: number; w: number; h: number };

function midX(r: Rect): number {
  return r.x + r.w / 2;
}
function midY(r: Rect): number {
  return r.y + r.h / 2;
}

export function connectionPoints(from: Rect, to: Rect): { from: Point; to: Point } {
  const sc = { x: midX(from), y: midY(from) };
  const tc = { x: midX(to), y: midY(to) };
  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx >= absDy) {
    if (dx >= 0) {
      return {
        from: { x: from.x + from.w, y: midY(from) },
        to: { x: to.x, y: midY(to) },
      };
    }
    return {
      from: { x: from.x, y: midY(from) },
      to: { x: to.x + to.w, y: midY(to) },
    };
  }
  if (dy >= 0) {
    return {
      from: { x: midX(from), y: from.y + from.h },
      to: { x: midX(to), y: to.y },
    };
  }
  return {
    from: { x: midX(from), y: from.y },
    to: { x: midX(to), y: to.y + to.h },
  };
}

export function pathPoints(routing: EdgeRouting, from: Rect, to: Rect): Point[] {
  const { from: a, to: b } = connectionPoints(from, to);
  if (routing === "straight" || routing === "curved") {
    return [a, b];
  }
  // orthogonal — simple Z / L via midpoint X
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (Math.abs(dx) < 1 || Math.abs(dy) < 1) {
    return [a, b];
  }
  const midXv = a.x + dx * 0.5;
  return [a, { x: midXv, y: a.y }, { x: midXv, y: b.y }, b];
}
