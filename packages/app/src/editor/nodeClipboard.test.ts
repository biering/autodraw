import { defaultStyleId, emptyDiagram, type NodeRecord } from "@agentsdraw/core";
import { describe, expect, it } from "vitest";
import {
  NODE_CLIP_MARKER,
  NODES_CLIP_MARKER,
  parseAgentsdrawNodeClipboard,
  parseAgentsdrawNodesClipboard,
  placementForMultiPaste,
  placementForPaste,
  resolveStyleIdForPaste,
  serializeNodeForClip,
  serializeNodesForClip,
} from "./nodeClipboard.js";

function sampleNode(over: Partial<NodeRecord> = {}): NodeRecord {
  const d = emptyDiagram("universal");
  const sid = defaultStyleId("universal");
  return {
    id: "n1",
    text: "Hello",
    x: 48,
    y: 64,
    w: 120,
    h: 56,
    styleId: sid,
    shape: "roundedRect",
    ...over,
  };
}

describe("parseAgentsdrawNodeClipboard", () => {
  it("returns null for non-JSON or wrong marker", () => {
    expect(parseAgentsdrawNodeClipboard("")).toBeNull();
    expect(parseAgentsdrawNodeClipboard("not json")).toBeNull();
    expect(parseAgentsdrawNodeClipboard("{}")).toBeNull();
    expect(parseAgentsdrawNodeClipboard(JSON.stringify({ $type: "other", text: "x" }))).toBeNull();
  });

  it("returns null when required fields are missing or invalid", () => {
    expect(
      parseAgentsdrawNodeClipboard(
        JSON.stringify({
          $type: NODE_CLIP_MARKER,
          text: "a",
          w: 0,
          h: 40,
          styleId: "x",
        }),
      ),
    ).toBeNull();
    expect(
      parseAgentsdrawNodeClipboard(
        JSON.stringify({
          $type: NODE_CLIP_MARKER,
          text: "a",
          w: 100,
          h: 40,
          styleId: "x",
          shape: "not-a-shape",
        }),
      ),
    ).toBeNull();
  });

  it("parses a valid payload (shape optional)", () => {
    const n = sampleNode({ shape: undefined });
    const json = serializeNodeForClip(n);
    const parsed = parseAgentsdrawNodeClipboard(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.text).toBe("Hello");
    expect(parsed!.w).toBe(120);
    expect(parsed!.h).toBe(56);
    expect(parsed!.styleId).toBe(n.styleId);
    expect(parsed!.shape).toBeUndefined();
  });

  it("round-trips through serialize and parse", () => {
    const n = sampleNode({ text: "Round", shape: "oval" });
    const parsed = parseAgentsdrawNodeClipboard(serializeNodeForClip(n));
    expect(parsed).toMatchObject({
      text: "Round",
      x: n.x,
      y: n.y,
      w: n.w,
      h: n.h,
      styleId: n.styleId,
      shape: "oval",
    });
  });

  it("returns null for multi-node clipboard (use parseAgentsdrawNodesClipboard)", () => {
    const a = sampleNode({ id: "a", text: "A", x: 0, y: 0 });
    const b = sampleNode({ id: "b", text: "B", x: 200, y: 0 });
    const json = serializeNodesForClip([a, b]);
    expect(parseAgentsdrawNodeClipboard(json)).toBeNull();
    const multi = parseAgentsdrawNodesClipboard(json);
    expect(multi).toHaveLength(2);
    expect(multi![0]!.text).toBe("A");
    expect(multi![1]!.text).toBe("B");
  });
});

describe("parseAgentsdrawNodesClipboard", () => {
  it("rejects invalid multi payload", () => {
    expect(
      parseAgentsdrawNodesClipboard(JSON.stringify({ $type: NODES_CLIP_MARKER, nodes: "bad" })),
    ).toBeNull();
    expect(
      parseAgentsdrawNodesClipboard(JSON.stringify({ $type: NODES_CLIP_MARKER, nodes: [] })),
    ).toBeNull();
  });
});

describe("placementForMultiPaste", () => {
  it("matches single-node placement behavior", () => {
    const d = emptyDiagram("universal");
    const n = sampleNode();
    const payload = parseAgentsdrawNodeClipboard(serializeNodeForClip(n))!;
    const placed = placementForMultiPaste([payload], 100, 100, d);
    expect(placed).toHaveLength(1);
    expect(placed[0]).toEqual(placementForPaste(payload, 100, 100, d));
  });

  it("preserves relative layout for multiple nodes", () => {
    const d = emptyDiagram("universal");
    const sid = defaultStyleId("universal");
    const a: Omit<NodeRecord, "id"> = {
      text: "A",
      x: 0,
      y: 0,
      w: 80,
      h: 40,
      styleId: sid,
      shape: "roundedRect",
    };
    const b: Omit<NodeRecord, "id"> = {
      text: "B",
      x: 96,
      y: 32,
      w: 80,
      h: 40,
      styleId: sid,
      shape: "roundedRect",
    };
    const placed = placementForMultiPaste([a, b], 400, 300, d);
    expect(placed).toHaveLength(2);
    expect(placed[0]!.x % 16).toBe(0);
    expect(placed[0]!.y % 16).toBe(0);
    expect(placed[1]!.x - placed[0]!.x).toBe(96);
    expect(placed[1]!.y - placed[0]!.y).toBe(32);
  });
});

describe("placementForPaste", () => {
  it("centers on flow coords with 16px snap and resolves unknown styleId", () => {
    const d = emptyDiagram("universal");
    const fallback = defaultStyleId("universal");
    const payload = sampleNode({ styleId: "does-not-exist-in-diagram" });
    const placed = placementForPaste(payload, 100, 100, d);
    expect(placed.styleId).toBe(fallback);
    expect(placed.w).toBe(120);
    expect(placed.h).toBe(56);
    expect(placed.x % 16).toBe(0);
    expect(placed.y % 16).toBe(0);
    // Top-left is snapped to 16px grid; center may be a few px off the exact flow point.
    expect(Math.abs(placed.x + placed.w / 2 - 100)).toBeLessThanOrEqual(16);
    expect(Math.abs(placed.y + placed.h / 2 - 100)).toBeLessThanOrEqual(16);
  });

  it("keeps known styleId", () => {
    const d = emptyDiagram("universal");
    const sid = defaultStyleId("universal");
    const payload = sampleNode({ styleId: sid });
    const placed = placementForPaste(payload, 200, 200, d);
    expect(placed.styleId).toBe(sid);
  });
});

describe("resolveStyleIdForPaste", () => {
  it("falls back to default when style is unknown", () => {
    const d = emptyDiagram("universal");
    expect(resolveStyleIdForPaste(d, "__missing__")).toBe(defaultStyleId("universal"));
  });
});
