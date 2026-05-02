import {
  type DiagramV1,
  defaultStyleId,
  type EdgeRecord,
  emptyDiagram,
  type NodeRecord,
} from "@autodraw/core";
import type { Node } from "@xyflow/react";
import { describe, expect, it } from "vitest";
import {
  applyNodeLayoutChanges,
  DIAGRAM_BODY_SOURCE_HANDLE,
  DIAGRAM_BODY_TARGET_HANDLE,
  FRAME_INNER_PAD,
  findDropTargetFrame,
  flowNodePixelSize,
  nextChildRelativePlacement,
  normalizeDiagramConnectionHandle,
  paddedFrameLayout,
  paddedFrameSize,
  toFlowEdges,
  toFlowNodes,
  withPaddedFrames,
} from "./flowAdapter";

function node(id: string, x: number, styleId: string): NodeRecord {
  return {
    id,
    text: id,
    x,
    y: 0,
    w: 120,
    h: 56,
    styleId,
    shape: "roundedRect",
  };
}

function baseEdge(over: Partial<EdgeRecord> & Pick<EdgeRecord, "id" | "from" | "to">): EdgeRecord {
  const { id, from, to, ...rest } = over;
  return {
    id,
    from,
    to,
    routing: "orthogonal",
    dash: "solid",
    head: "lineArrow",
    tail: "none",
    label: "",
    strokeWidth: 2,
    relationshipPreset: 0,
    ...rest,
  };
}

function diagramWith(edge: EdgeRecord): DiagramV1 {
  const d = emptyDiagram();
  const sid = defaultStyleId(d);
  d.nodes.push(node("a", 0, sid), node("b", 200, sid));
  d.edges.push(edge);
  return d;
}

describe("normalizeDiagramConnectionHandle", () => {
  it("returns undefined for every handle id (edges always attach to the node body)", () => {
    expect(normalizeDiagramConnectionHandle(undefined, "source")).toBeUndefined();
    expect(normalizeDiagramConnectionHandle(null, "target")).toBeUndefined();
    expect(normalizeDiagramConnectionHandle("", "source")).toBeUndefined();
    expect(normalizeDiagramConnectionHandle(DIAGRAM_BODY_SOURCE_HANDLE, "source")).toBeUndefined();
    expect(normalizeDiagramConnectionHandle(DIAGRAM_BODY_TARGET_HANDLE, "target")).toBeUndefined();
    expect(normalizeDiagramConnectionHandle("src-top", "source")).toBeUndefined();
    expect(normalizeDiagramConnectionHandle("tgt-bottom", "target")).toBeUndefined();
  });
});

describe("toFlowEdges", () => {
  it("omits React Flow handles when the diagram edge has no stored ports (floating geometry)", () => {
    const d = diagramWith(baseEdge({ id: "e1", from: "a", to: "b" }));
    const fe = toFlowEdges(d)[0];
    expect(fe).toBeDefined();
    expect(fe!.sourceHandle).toBeUndefined();
    expect(fe!.targetHandle).toBeUndefined();
  });

  it("omits flow handles when the record has empty-string ports", () => {
    const d = diagramWith(
      baseEdge({
        id: "e1",
        from: "a",
        to: "b",
        sourceHandle: "",
        targetHandle: "",
      }),
    );
    const fe = toFlowEdges(d)[0];
    expect(fe!.sourceHandle).toBeUndefined();
    expect(fe!.targetHandle).toBeUndefined();
  });

  it("passes through explicit source and target handles for React Flow geometry", () => {
    const d = diagramWith(
      baseEdge({
        id: "e1",
        from: "a",
        to: "b",
        sourceHandle: "src-top",
        targetHandle: "tgt-bottom",
      }),
    );
    const fe = toFlowEdges(d)[0];
    expect(fe).toBeDefined();
    expect(fe!.sourceHandle).toBe("src-top");
    expect(fe!.targetHandle).toBe("tgt-bottom");
  });
});

describe("flowNodePixelSize", () => {
  it("prefers numeric style width/height", () => {
    const n = {
      id: "f1",
      position: { x: 0, y: 0 },
      data: {},
      style: { width: 300, height: 200 },
    } as unknown as Node;
    expect(flowNodePixelSize(n)).toEqual({ w: 300, h: 200 });
  });

  it("clamps to a minimum size", () => {
    const n = {
      id: "f1",
      position: { x: 0, y: 0 },
      data: {},
      style: { width: 12, height: 10 },
    } as unknown as Node;
    expect(flowNodePixelSize(n)).toEqual({ w: 48, h: 48 });
  });
});

describe("applyNodeLayoutChanges", () => {
  it("updates frame position and dimensions from flow nodes", () => {
    const d = emptyDiagram();
    d.frames.push({
      id: "frame1",
      x: 10,
      y: 20,
      w: 100,
      h: 80,
    });
    const flowNodes: Node[] = [
      {
        id: "frame1",
        type: "diagramFrame",
        position: { x: 5, y: 15 },
        data: { id: "frame1", x: 5, y: 15, w: 100, h: 80, canvasTheme: "light" },
        style: { width: 220, height: 140 },
      } as Node,
    ];
    const next = applyNodeLayoutChanges(d, flowNodes);
    expect(next.frames[0]).toMatchObject({ id: "frame1", x: 5, y: 15, w: 220, h: 140 });
  });
});

describe("toFlowNodes sub-flow", () => {
  it("sets parentId, extent parent, and expandParent for nodes inside a frame", () => {
    const d = emptyDiagram();
    const sid = defaultStyleId(d);
    d.frames.push({ id: "f1", x: 0, y: 0, w: 400, h: 400 });
    d.nodes.push({
      id: "c1",
      text: "c",
      x: 10,
      y: 10,
      w: 50,
      h: 40,
      styleId: sid,
      parentId: "f1",
    });
    const child = toFlowNodes(d).find((n) => n.id === "c1");
    expect(child?.parentId).toBe("f1");
    expect(child?.extent).toBe("parent");
    expect((child as { expandParent?: boolean }).expandParent).toBe(true);
  });

  it("does not set parent props on nodes without a parent", () => {
    const d = emptyDiagram();
    const sid = defaultStyleId(d);
    d.nodes.push(node("a", 0, sid));
    const n = toFlowNodes(d).find((x) => x.id === "a");
    expect(n?.parentId).toBeUndefined();
    expect(n?.extent).toBeUndefined();
    expect((n as { expandParent?: boolean }).expandParent).toBeUndefined();
  });
});

describe("nextChildRelativePlacement", () => {
  it("stacks vertically under siblings inside a frame", () => {
    const d = emptyDiagram();
    const sid = defaultStyleId(d);
    d.frames.push({ id: "f1", x: 0, y: 0, w: 400, h: 400 });
    d.nodes.push({
      id: "a",
      text: "a",
      x: 24,
      y: 36,
      w: 100,
      h: 40,
      styleId: sid,
      parentId: "f1",
    });
    expect(nextChildRelativePlacement(d, "f1")).toEqual({ x: 24, y: 92 });
  });

  it("uses FRAME_INNER_PAD top/left for the first child", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f1", x: 0, y: 0, w: 400, h: 400 });
    expect(nextChildRelativePlacement(d, "f1")).toEqual({
      x: FRAME_INNER_PAD.left,
      y: FRAME_INNER_PAD.top,
    });
  });
});

describe("paddedFrameSize / withPaddedFrames", () => {
  function frame(id: string, x: number, y: number, w: number, h: number) {
    return { id, x, y, w, h };
  }
  function child(
    id: string,
    parentId: string,
    x: number,
    y: number,
    w: number,
    h: number,
    sid: string,
  ): NodeRecord {
    return { id, text: id, x, y, w, h, styleId: sid, shape: "roundedRect", parentId };
  }

  it("paddedFrameSize grows the frame to fit children + right/bottom padding", () => {
    const f = frame("f1", 0, 0, 100, 80);
    const kids: NodeRecord[] = [
      {
        id: "c1",
        text: "c",
        x: 24,
        y: 36,
        w: 140,
        h: 64,
        styleId: "s",
        shape: "roundedRect",
        parentId: "f1",
      },
    ];
    expect(paddedFrameSize(f, kids)).toEqual({
      w: 164 + FRAME_INNER_PAD.right,
      h: 100 + FRAME_INNER_PAD.bottom,
    });
  });

  it("paddedFrameSize never shrinks below the current frame size", () => {
    const f = frame("f1", 0, 0, 500, 400);
    const kids: NodeRecord[] = [
      {
        id: "c1",
        text: "c",
        x: 24,
        y: 36,
        w: 80,
        h: 50,
        styleId: "s",
        shape: "roundedRect",
        parentId: "f1",
      },
    ];
    expect(paddedFrameSize(f, kids)).toEqual({ w: 500, h: 400 });
  });

  it("paddedFrameSize is a no-op when the frame has no children", () => {
    const f = frame("f1", 0, 0, 200, 150);
    expect(paddedFrameSize(f, [])).toEqual({ w: 200, h: 150 });
  });

  it("withPaddedFrames pads only frames whose children would otherwise touch the border", () => {
    const d: DiagramV1 = emptyDiagram();
    const sid = defaultStyleId(d);
    d.frames.push(frame("tight", 0, 0, 100, 80), frame("loose", 500, 500, 600, 500));
    d.nodes.push(
      child("c1", "tight", 24, 36, 140, 64, sid),
      child("c2", "loose", 24, 36, 80, 40, sid),
    );
    const out = withPaddedFrames(d);
    expect(out.frames.find((f) => f.id === "tight")).toMatchObject({
      w: 164 + FRAME_INNER_PAD.right,
      h: 100 + FRAME_INNER_PAD.bottom,
    });
    expect(out.frames.find((f) => f.id === "loose")).toMatchObject({ w: 600, h: 500 });
  });

  it("withPaddedFrames returns the same reference when nothing needs padding", () => {
    const d = emptyDiagram();
    d.frames.push(frame("f1", 0, 0, 200, 150));
    expect(withPaddedFrames(d)).toBe(d);
  });

  it("withPaddedFrames shifts the frame up-left and re-roots children when they sit inside the left/top gutter", () => {
    const d: DiagramV1 = emptyDiagram();
    const sid = defaultStyleId(d);
    d.frames.push(frame("f1", 100, 100, 200, 150));
    d.nodes.push(child("c1", "f1", 0, 0, 80, 40, sid));
    const out = withPaddedFrames(d);
    const f = out.frames.find((fr) => fr.id === "f1");
    const c = out.nodes.find((n) => n.id === "c1");
    expect(f?.x).toBe(100 - FRAME_INNER_PAD.left);
    expect(f?.y).toBe(100 - FRAME_INNER_PAD.top);
    expect(f?.w).toBe(200 + FRAME_INNER_PAD.left);
    expect(f?.h).toBe(150 + FRAME_INNER_PAD.top);
    expect(c?.x).toBe(FRAME_INNER_PAD.left);
    expect(c?.y).toBe(FRAME_INNER_PAD.top);
  });

  it("withPaddedFrames preserves the child's absolute position after a left/top shift", () => {
    const d: DiagramV1 = emptyDiagram();
    const sid = defaultStyleId(d);
    d.frames.push(frame("f1", 100, 100, 400, 300));
    d.nodes.push(child("c1", "f1", 5, 8, 80, 40, sid));
    const beforeAbs = { x: 100 + 5, y: 100 + 8 };
    const out = withPaddedFrames(d);
    const f = out.frames.find((fr) => fr.id === "f1");
    const c = out.nodes.find((n) => n.id === "c1");
    const afterAbs = { x: (f?.x ?? 0) + (c?.x ?? 0), y: (f?.y ?? 0) + (c?.y ?? 0) };
    expect(afterAbs).toEqual(beforeAbs);
  });

  it("paddedFrameLayout reports zero dx/dy when children already sit beyond the left/top pad", () => {
    const f = frame("f1", 0, 0, 100, 80);
    const kids: NodeRecord[] = [
      {
        id: "c1",
        text: "c",
        x: 24,
        y: 36,
        w: 30,
        h: 20,
        styleId: "s",
        shape: "roundedRect",
        parentId: "f1",
      },
    ];
    expect(paddedFrameLayout(f, kids)).toMatchObject({ dx: 0, dy: 0, x: 0, y: 0 });
  });
});

describe("findDropTargetFrame", () => {
  const sid = defaultStyleId(emptyDiagram());

  it("returns the frame whose bounds contain the node's center", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f1", x: 100, y: 100, w: 400, h: 300 });
    d.nodes.push({
      id: "n1",
      text: "",
      x: 220,
      y: 180,
      w: 60,
      h: 30,
      styleId: sid,
      shape: "roundedRect",
    });
    expect(findDropTargetFrame(d, "n1")?.id).toBe("f1");
  });

  it("returns undefined when the node center is outside any frame", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f1", x: 100, y: 100, w: 400, h: 300 });
    d.nodes.push({
      id: "n1",
      text: "",
      x: 0,
      y: 0,
      w: 60,
      h: 30,
      styleId: sid,
      shape: "roundedRect",
    });
    expect(findDropTargetFrame(d, "n1")).toBeUndefined();
  });

  it("returns undefined when the node already has a parent (extent: parent prevents cross-frame drops)", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f1", x: 100, y: 100, w: 400, h: 300 });
    d.nodes.push({
      id: "n1",
      text: "",
      x: 24,
      y: 36,
      w: 60,
      h: 30,
      styleId: sid,
      shape: "roundedRect",
      parentId: "f1",
    });
    expect(findDropTargetFrame(d, "n1")).toBeUndefined();
  });
});
