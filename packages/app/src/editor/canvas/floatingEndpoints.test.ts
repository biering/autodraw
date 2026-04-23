import { Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import { floatingEdgeGeometry, rectFloatingEndpoint } from "./floatingEndpoints.js";

/** Endpoint must sit on the AABB perimeter of the rect centered at (cx, cy). */
function expectOnRectPerimeter(
  cx: number,
  cy: number,
  w: number,
  h: number,
  x: number,
  y: number,
  tol = 0.15,
): void {
  const hw = w / 2;
  const hh = h / 2;
  expect(Math.abs(x - cx)).toBeLessThanOrEqual(hw + tol);
  expect(Math.abs(y - cy)).toBeLessThanOrEqual(hh + tol);
  const distVert = Math.abs(Math.abs(x - cx) - hw);
  const distHorz = Math.abs(Math.abs(y - cy) - hh);
  expect(Math.min(distVert, distHorz)).toBeLessThan(tol);
}

describe("rectFloatingEndpoint", () => {
  it("hits the right face when the peer is to the east", () => {
    const r = rectFloatingEndpoint(50, 50, 100, 100, 200, 50);
    expect(r.position).toBe(Position.Right);
    expectOnRectPerimeter(50, 50, 100, 100, r.x, r.y);
    expect(r.x).toBeGreaterThan(95);
    expect(r.x).toBeLessThanOrEqual(100);
    expect(Math.abs(r.y - 50)).toBeLessThan(1);
  });

  it("hits the left face when the peer is to the west", () => {
    const r = rectFloatingEndpoint(50, 50, 100, 100, -100, 50);
    expect(r.position).toBe(Position.Left);
    expectOnRectPerimeter(50, 50, 100, 100, r.x, r.y);
    expect(r.x).toBeLessThan(5);
  });

  it("hits the top face when the peer is to the north", () => {
    const r = rectFloatingEndpoint(50, 50, 100, 100, 50, -80);
    expect(r.position).toBe(Position.Top);
    expectOnRectPerimeter(50, 50, 100, 100, r.x, r.y);
    expect(r.y).toBeLessThan(10);
  });

  it("hits the bottom face when the peer is to the south", () => {
    const r = rectFloatingEndpoint(50, 50, 100, 100, 50, 220);
    expect(r.position).toBe(Position.Bottom);
    expectOnRectPerimeter(50, 50, 100, 100, r.x, r.y);
    expect(r.y).toBeGreaterThan(90);
  });

  it("uses a small vertical ray when B is directly above (dx = 0)", () => {
    const r = rectFloatingEndpoint(50, 50, 100, 100, 50, 0);
    expect(r.position).toBe(Position.Top);
    expectOnRectPerimeter(50, 50, 100, 100, r.x, r.y);
    expect(Math.abs(r.x - 50)).toBeLessThan(1e-6);
  });

  it("falls back when centers coincide", () => {
    const r = rectFloatingEndpoint(50, 50, 100, 100, 50, 50);
    expect(r.position).toBe(Position.Right);
    expect(r.x).toBe(100);
    expect(r.y).toBe(50);
  });
});

describe("floatingEdgeGeometry", () => {
  it("returns mirrored endpoints for A and B", () => {
    const g = floatingEdgeGeometry(
      { cx: 50, cy: 50, w: 100, h: 100 },
      { cx: 250, cy: 50, w: 100, h: 100 },
    );
    expect(g.sourcePosition).toBe(Position.Right);
    expect(g.targetPosition).toBe(Position.Left);
    expect(g.sx).toBeLessThan(g.tx);
    expectOnRectPerimeter(50, 50, 100, 100, g.sx, g.sy);
    expectOnRectPerimeter(250, 50, 100, 100, g.tx, g.ty);
  });

  it("places vertical stack endpoints on bottom / top", () => {
    const g = floatingEdgeGeometry(
      { cx: 100, cy: 80, w: 80, h: 40 },
      { cx: 100, cy: 200, w: 80, h: 40 },
    );
    expect(g.sourcePosition).toBe(Position.Bottom);
    expect(g.targetPosition).toBe(Position.Top);
    // Source exits the lower node toward the lower y-direction; target meets from above (smaller y).
    expect(g.sy).toBeLessThan(g.ty);
  });

  it("updates stub-facing when B is south-east of A (diagonal)", () => {
    const g = floatingEdgeGeometry(
      { cx: 0, cy: 0, w: 40, h: 40 },
      { cx: 100, cy: 80, w: 40, h: 40 },
    );
    expect(g.sourcePosition).toBe(Position.Right);
    expect(g.targetPosition).toBe(Position.Left);
    expect(g.sy).toBe(0);
    expect(g.ty).toBe(80);
  });
});
