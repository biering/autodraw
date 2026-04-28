"use client";

import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { DiagramV1 } from "@autodraw/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DiagramEdge } from "./edges/DiagramEdge";
import { DiagramFrameNode } from "./nodes/DiagramFrameNode";
import { DiagramImageNode } from "./nodes/DiagramImageNode";
import { DiagramNode } from "./nodes/DiagramNode";
import { DiagramTextLabelNode } from "./nodes/DiagramTextLabelNode";
import { createLandingPeekDiagram, landingPeekDiagramAtTime } from "./landingPeekDiagram";
import { toFlowEdges, toFlowNodes } from "./flowAdapter";

const nodeTypes = {
  diagram: DiagramNode,
  diagramFrame: DiagramFrameNode,
  diagramImage: DiagramImageNode,
  diagramTextLabel: DiagramTextLabelNode,
} as unknown as NodeTypes;
const edgeTypes = { diagram: DiagramEdge } as unknown as EdgeTypes;

const SNAP_GRID: [number, number] = [16, 16];
const PRO_OPTIONS = { hideAttribution: true } as const;

export type DiagramCanvasPeekProps = {
  className?: string;
  /** Light matches the landing section; dark is available for future use. */
  canvasTheme?: "light" | "dark";
  /** When set, render this diagram read-only instead of the animated landing preview. */
  diagram?: DiagramV1 | null;
  /** Enables pan/zoom interactions in read-only mode. */
  interactive?: boolean;
};

function DiagramCanvasPeekInner({
  className,
  canvasTheme = "light",
  diagram: staticDiagram,
  interactive,
}: DiagramCanvasPeekProps) {
  const baseRef = useRef<DiagramV1>(createLandingPeekDiagram());
  const [tMs, setTMs] = useState(0);
  const lastFrameMs = useRef(0);
  const fitViewRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (staticDiagram != null) return;
    let id = 0;
    const tick = (now: number) => {
      id = window.requestAnimationFrame(tick);
      if (now - lastFrameMs.current < 48) return;
      lastFrameMs.current = now;
      setTMs(now);
    };
    id = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(id);
  }, [staticDiagram]);

  const diagram = useMemo(() => {
    if (staticDiagram != null) return staticDiagram;
    return landingPeekDiagramAtTime(baseRef.current, tMs);
  }, [staticDiagram, tMs]);

  const nodes = useMemo(
    () =>
      toFlowNodes(diagram, canvasTheme).map((n) => ({
        ...n,
        draggable: false,
        selectable: false,
        connectable: false,
        data: { ...n.data, interactionDisabled: true },
      })),
    [diagram, canvasTheme],
  );
  const edges = useMemo(
    () => toFlowEdges(diagram).map((e) => ({ ...e, selectable: false, focusable: false })),
    [diagram],
  );

  const isInteractive = interactive ?? staticDiagram != null;
  const dotGridColor = canvasTheme === "dark" ? "#4b4b52" : "#d9d9d9";

  const onInit = useCallback((inst: { fitView: (opts?: object) => void }) => {
    fitViewRef.current = () => inst.fitView({ padding: 0.12, maxZoom: 1.05, duration: 0 });
    window.requestAnimationFrame(() => fitViewRef.current?.());
  }, []);

  useEffect(() => {
    if (staticDiagram == null) return;
    window.requestAnimationFrame(() => fitViewRef.current?.());
  }, [staticDiagram, diagram.nodes.length, diagram.edges.length]);

  return (
    <div className={className ?? "relative h-full min-h-[200px] w-full"}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={SNAP_GRID}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        edgesFocusable={false}
        panOnDrag={isInteractive}
        panOnScroll={false}
        zoomOnScroll={isInteractive}
        zoomOnPinch={isInteractive}
        zoomOnDoubleClick={false}
        preventScrolling
        proOptions={PRO_OPTIONS}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.4}
        maxZoom={1.25}
        onInit={onInit}
        deleteKeyCode={null}
      >
        <Background gap={16} size={1.5} color={dotGridColor} />
      </ReactFlow>
    </div>
  );
}

/** Same React Flow surface as the editor (nodes + edges), isolated diagram state for marketing or read-only views. */
export const DiagramCanvasPeek = memo(function DiagramCanvasPeek(props: DiagramCanvasPeekProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasPeekInner {...props} />
    </ReactFlowProvider>
  );
});
