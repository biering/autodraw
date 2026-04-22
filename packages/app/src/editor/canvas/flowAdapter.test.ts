import {
  defaultStyleId,
  emptyDiagram,
  type DiagramV1,
  type EdgeRecord,
  type NodeRecord,
} from "@agentsdraw/core";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_DIAGRAM_SOURCE_HANDLE,
  DEFAULT_DIAGRAM_TARGET_HANDLE,
  toFlowEdges,
} from "./flowAdapter.js";

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
    head: "arrowOpen",
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

describe("toFlowEdges", () => {
  it("defaults missing ports to right→left (src → tgt)", () => {
    const d = diagramWith(baseEdge({ id: "e1", from: "a", to: "b" }));
    const fe = toFlowEdges(d)[0];
    expect(fe).toBeDefined();
    expect(fe!.sourceHandle).toBe(DEFAULT_DIAGRAM_SOURCE_HANDLE);
    expect(fe!.targetHandle).toBe(DEFAULT_DIAGRAM_TARGET_HANDLE);
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
