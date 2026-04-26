import {
  defaultStyleId,
  emptyDiagram,
  type DiagramV1,
  type EdgeRecord,
  type NodeRecord,
} from "@autodraw/core";
import { describe, expect, it } from "vitest";
import {
  DIAGRAM_BODY_SOURCE_HANDLE,
  DIAGRAM_BODY_TARGET_HANDLE,
  normalizeDiagramConnectionHandle,
  toFlowEdges,
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
  const preset = "universal" as const;
  const sid = defaultStyleId(preset);
  const d = emptyDiagram(preset);
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
