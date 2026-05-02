/** @vitest-environment jsdom */
import type { Node } from "@xyflow/react";
import { ReactFlow, ReactFlowProvider } from "@xyflow/react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { useDocument } from "../../state/useDocument";
import {
  DIAGRAM_BODY_SOURCE_BUTTON_HANDLE,
  DIAGRAM_BODY_SOURCE_HANDLE,
  type DiagramFlowNode,
} from "../flowAdapter";
import { DiagramNode } from "./DiagramNode";

function anchorSelector(): string {
  return `[data-handleid="${DIAGRAM_BODY_SOURCE_HANDLE}"][data-handlepos="right"]`;
}

function mountDiagramNode(selected: boolean): { container: HTMLDivElement; unmount: () => void } {
  const container = document.createElement("div");
  container.style.width = "640px";
  container.style.height = "480px";
  document.body.appendChild(container);

  const nodeData: DiagramFlowNode["data"] = {
    label: "",
    w: 120,
    h: 56,
    styleId: "test-style",
    shape: "roundedRect",
    resolvedStyle: {
      fill: "#f5f5f5",
      stroke: "#999999",
      defaultShape: "roundedRect",
    },
    canvasTheme: "light",
  };

  const node: Node<DiagramFlowNode["data"], "diagram"> = {
    id: "n-test",
    type: "diagram",
    position: { x: 40, y: 40 },
    data: nodeData,
    selected,
  };

  const root: Root = createRoot(container);
  act(() => {
    root.render(
      <ReactFlowProvider>
        <ReactFlow
          nodes={[node]}
          edges={[]}
          nodeTypes={{ diagram: DiagramNode }}
          proOptions={{ hideAttribution: true }}
        />
      </ReactFlowProvider>,
    );
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

describe("DiagramNode source handles", () => {
  beforeAll(() => {
    // React 19 + Vitest jsdom: silence "not configured to support act(...)" warnings.
    (globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT =
      true;
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    };
  });

  beforeEach(() => {
    useDocument.getState().newDocument();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("always mounts the invisible body-src source handle so edges render when the node is not selected", () => {
    const { container, unmount } = mountDiagramNode(false);
    expect(container.querySelector(anchorSelector())).not.toBeNull();
    expect(
      container.querySelector(`[data-handleid="${DIAGRAM_BODY_SOURCE_BUTTON_HANDLE}"]`),
    ).toBeNull();
    unmount();
  });

  it("keeps body-src mounted when selected and adds the Link2 button source handle", () => {
    const { container, unmount } = mountDiagramNode(true);
    expect(container.querySelector(anchorSelector())).not.toBeNull();
    expect(
      container.querySelector(`[data-handleid="${DIAGRAM_BODY_SOURCE_BUTTON_HANDLE}"]`),
    ).not.toBeNull();
    unmount();
  });
});
