import { defaultStyleId } from "@agentsdraw/core";
import { beforeEach, describe, expect, it } from "vitest";
import {
  DIAGRAM_BODY_SOURCE_HANDLE,
  DIAGRAM_BODY_TARGET_HANDLE,
  toFlowEdges,
} from "../canvas/flowAdapter.js";
import { useDocument } from "./useDocument.js";

const PALETTE = "universal" as const;
const STYLE = defaultStyleId(PALETTE);

/** Reset the singleton store and seed two nodes to serve as edge endpoints. */
function resetStoreWithTwoNodes(): { a: string; b: string } {
  useDocument.getState().newDocument(PALETTE);
  const a = useDocument.getState().addNode(
    { text: "", x: 0, y: 0, w: 120, h: 60, styleId: STYLE, shape: "roundedRect" },
    { focusLabel: false },
  );
  const b = useDocument.getState().addNode(
    { text: "", x: 300, y: 0, w: 120, h: 60, styleId: STYLE, shape: "roundedRect" },
    { focusLabel: false },
  );
  return { a, b };
}

/**
 * Regression coverage for the bug that rendered right-angle edges as a long wrap-around
 * whenever the user started or ended a drag on a specific handle: if an edge ended up with
 * `sourceHandle` / `targetHandle` stored on it, `useFloating` became false in `DiagramEdge`
 * and the path was pinned to that side instead of the node's natural edge.
 *
 * The invariants below lock in "edges never pin to a handle" so we always take the floating
 * routing path:
 *   1. `addEdge` drops every handle id, regardless of what the caller passed in.
 *   2. `commitRelationshipDraft` (the drag-to-connect flow) produces edges with no handles,
 *      even if the underlying draft recorded a specific handle at the start or end.
 *   3. `toFlowEdges` carries no React Flow handle ids forward for these edges.
 */
describe("useDocument edge handle stripping", () => {
  beforeEach(() => {
    useDocument.getState().newDocument(PALETTE);
  });

  it("addEdge never stores sourceHandle or targetHandle, regardless of input", () => {
    const { a, b } = resetStoreWithTwoNodes();
    const cases: { sh?: string | null; th?: string | null }[] = [
      { sh: undefined, th: undefined },
      { sh: null, th: null },
      { sh: "", th: "" },
      { sh: DIAGRAM_BODY_SOURCE_HANDLE, th: DIAGRAM_BODY_TARGET_HANDLE },
      { sh: "src-top", th: "tgt-bottom" },
      { sh: "legacy-custom-id", th: "another-custom-id" },
    ];

    for (const { sh, th } of cases) {
      const id = useDocument
        .getState()
        .addEdge({ from: a, to: b, sourceHandle: sh ?? undefined, targetHandle: th ?? undefined });
      const edge = useDocument.getState().diagram.edges.find((e) => e.id === id);
      expect(edge, `edge stored for sh=${String(sh)} th=${String(th)}`).toBeDefined();
      expect(edge!.sourceHandle).toBeUndefined();
      expect(edge!.targetHandle).toBeUndefined();
    }
  });

  it("commitRelationshipDraft drops handles recorded on the draft", () => {
    const { a, b } = resetStoreWithTwoNodes();
    useDocument.getState().setRelationshipDraft({
      source: a,
      target: b,
      sourceHandle: "src-top",
      targetHandle: "tgt-bottom",
    });
    useDocument.getState().commitRelationshipDraft({ head: "lineArrow", tail: "none" });

    const edges = useDocument.getState().diagram.edges;
    expect(edges).toHaveLength(1);
    const edge = edges[0]!;
    expect(edge.sourceHandle).toBeUndefined();
    expect(edge.targetHandle).toBeUndefined();
    expect(edge.from).toBe(a);
    expect(edge.to).toBe(b);
    expect(useDocument.getState().relationshipDraft).toBeNull();
  });

  it("commitRelationshipDraft preserves the user-selected start and end markers", () => {
    const { a, b } = resetStoreWithTwoNodes();
    useDocument.getState().setRelationshipDraft({
      source: a,
      target: b,
      sourceHandle: DIAGRAM_BODY_SOURCE_HANDLE,
      targetHandle: DIAGRAM_BODY_TARGET_HANDLE,
    });
    useDocument.getState().commitRelationshipDraft({ head: "triangleArrow", tail: "diamond" });

    const edge = useDocument.getState().diagram.edges[0]!;
    expect(edge.head).toBe("triangleArrow");
    expect(edge.tail).toBe("diamond");
  });

  it("toFlowEdges never emits sourceHandle/targetHandle for edges created via the draft flow", () => {
    const { a, b } = resetStoreWithTwoNodes();
    useDocument.getState().setRelationshipDraft({
      source: a,
      target: b,
      sourceHandle: "src-top",
      targetHandle: "tgt-bottom",
    });
    useDocument.getState().commitRelationshipDraft({ head: "lineArrow", tail: "none" });

    const flow = toFlowEdges(useDocument.getState().diagram);
    expect(flow).toHaveLength(1);
    expect(flow[0]!.sourceHandle).toBeUndefined();
    expect(flow[0]!.targetHandle).toBeUndefined();
  });
});
