import {
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  type Connection,
  ConnectionMode,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type IsValidConnection,
  type Node,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
  ReactFlow,
  useReactFlow,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { EdgeHead, NodeRecord } from "@autodraw/core";
import type { FinalConnectionState } from "@xyflow/system";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../../components/ui/button";
import { readClipboardText, writeClipboardText } from "../../platform/clipboard";
import { isTypingInField } from "../isTypingInField";
import {
  parseAutodrawNodesClipboard,
  placementForMultiPaste,
  serializeNodesForClip,
} from "../nodeClipboard";
import { MAX_VIEW_ZOOM, useDocument } from "../state/useDocument";
import { AuxContextMenu } from "./AuxContextMenu";
import { DiagramConnectionLine } from "./DiagramConnectionLine";
import { EdgeContextMenu } from "./EdgeContextMenu";
import { DiagramEdge } from "./edges/DiagramEdge";
import { FrameContextMenu } from "./FrameContextMenu";
import {
  applyNodeLayoutChanges,
  type DiagramFlowEdge,
  type DiagramNodeData,
  findDropTargetFrame,
  normalizeDiagramConnectionHandle,
  toFlowEdges,
  toFlowNodes,
} from "./flowAdapter";
import { EdgeMarkerDropdown } from "./NewRelationshipPicker";
import { NodeContextMenu } from "./NodeContextMenu";
import { DiagramFrameNode } from "./nodes/DiagramFrameNode";
import { DiagramImageNode } from "./nodes/DiagramImageNode";
import { DiagramNode } from "./nodes/DiagramNode";
import { DiagramTextLabelNode } from "./nodes/DiagramTextLabelNode";
import { PaneContextMenu } from "./PaneContextMenu";

const nodeTypes = {
  diagram: DiagramNode,
  diagramFrame: DiagramFrameNode,
  diagramImage: DiagramImageNode,
  diagramTextLabel: DiagramTextLabelNode,
} as unknown as NodeTypes;
const edgeTypes = { diagram: DiagramEdge } as unknown as EdgeTypes;

/** Stable references for `<ReactFlow />` — new object/array literals each render force internal churn ([docs](https://reactflow.dev/learn/advanced-use/performance)). */
const SNAP_GRID: [number, number] = [16, 16];
const PRO_OPTIONS = { hideAttribution: true } as const;

const isDiagramValidConnection: IsValidConnection<DiagramFlowEdge> = (edge) =>
  Boolean(edge.source && edge.target && edge.source !== edge.target);

/** Margin around node bounds (flow px) when resolving drop target; target handle uses `pointer-events: none`. */
const CONNECTION_DROP_MARGIN = 40;

/**
 * When the pointer ends over the node body (not the tiny handle), React Flow may not fire
 * `onConnect`; use the release position to pick the topmost other node under the cursor.
 */
function pickTargetNodeIdAtFlowPoint(
  nodes: Node[],
  flowPoint: { x: number; y: number },
  sourceId: string,
  marginPx: number,
): string | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const n = nodes[i];
    if (!n || n.id === sourceId || n.type !== "diagram") continue;
    const d = n.data as DiagramNodeData;
    const { x, y } = n.position;
    const w = n.width ?? d.w;
    const h = n.height ?? d.h;
    if (
      flowPoint.x >= x - marginPx &&
      flowPoint.x <= x + w + marginPx &&
      flowPoint.y >= y - marginPx &&
      flowPoint.y <= y + h + marginPx
    ) {
      return n.id;
    }
  }
  return null;
}

const PANE_MENU_W = 248;
const PANE_MENU_H = 360;
const NODE_MENU_W = 280;
const NODE_MENU_H = 440;
const EDGE_MENU_W = 400;
const EDGE_MENU_H = 460;

type CanvasMenu =
  | { kind: "pane"; cx: number; cy: number; fx: number; fy: number }
  | { kind: "node"; cx: number; cy: number; nodeId: string }
  | { kind: "edge"; cx: number; cy: number; edgeId: string };

/**
 * Routes a right-clicked node id to the right shadcn context menu — frames have a rich
 * editor (rename, colour, add child, remove); image / text-label show a compact "delete"
 * menu; everything else falls through to {@link NodeContextMenu} (color/shape/edit/select…).
 */
function CanvasNodeContextMenu({
  cx,
  cy,
  nodeId,
  onClose,
}: {
  cx: number;
  cy: number;
  nodeId: string;
  onClose: () => void;
}) {
  const kind = useDocument(
    useShallow((s) => {
      if (s.diagram.frames.some((f) => f.id === nodeId)) return "frame" as const;
      if (s.diagram.images.some((im) => im.id === nodeId)) return "aux" as const;
      if (s.diagram.textLabels.some((t) => t.id === nodeId)) return "aux" as const;
      return "node" as const;
    }),
  );
  if (kind === "frame") {
    return <FrameContextMenu cx={cx} cy={cy} frameId={nodeId} onClose={onClose} />;
  }
  if (kind === "aux") {
    return <AuxContextMenu cx={cx} cy={cy} elementId={nodeId} onClose={onClose} />;
  }
  return <NodeContextMenu cx={cx} cy={cy} nodeId={nodeId} onClose={onClose} />;
}

export function DiagramCanvas() {
  const diagram = useDocument(useShallow((s) => s.diagram));
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const selection = useDocument(useShallow((s) => s.selection));
  const setDiagram = useDocument((s) => s.setDiagram);
  const setSelection = useDocument((s) => s.setSelection);
  const setZoom = useDocument((s) => s.setZoom);
  const removeElementById = useDocument((s) => s.removeElementById);
  const removeEdge = useDocument((s) => s.removeEdge);
  const addNode = useDocument((s) => s.addNode);
  const updateNode = useDocument((s) => s.updateNode);
  const addTextLabel = useDocument((s) => s.addTextLabel);
  const addFrame = useDocument((s) => s.addFrame);
  const rf = useReactFlow();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [menu, setMenu] = useState<CanvasMenu | null>(null);
  const relationshipDraft = useDocument((s) => s.relationshipDraft);
  const setRelationshipDraft = useDocument((s) => s.setRelationshipDraft);
  const commitRelationshipDraft = useDocument((s) => s.commitRelationshipDraft);
  const connectListenersRef = useRef<{ up: () => void } | null>(null);
  /** True after `onConnect` runs so `onConnectEnd` does not open the picker twice. */
  const connectHandledRef = useRef(false);

  // Controlled selection: merge Zustand `selection` into props so `<ReactFlow />` stays in sync with
  // the [Adding Interactivity](https://reactflow.dev/learn/concepts/adding-interactivity) pattern
  // (apply*Changes + controlled elements). `onSelectionChange` mirrors RF → store; `setSelection` skips no-ops.
  const nodeSelSet = useMemo(() => new Set(selection.nodeIds), [selection.nodeIds]);
  const edgeSelSet = useMemo(() => new Set(selection.edgeIds), [selection.edgeIds]);

  const nodes = useMemo(
    () => toFlowNodes(diagram, canvasTheme).map((n) => ({ ...n, selected: nodeSelSet.has(n.id) })),
    [diagram, nodeSelSet, canvasTheme],
  );
  const edges = useMemo(
    () => toFlowEdges(diagram).map((e) => ({ ...e, selected: edgeSelSet.has(e.id) })),
    [diagram, edgeSelSet],
  );

  const dotGridColor = canvasTheme === "dark" ? "#4b4b52" : "#d9d9d9";

  const diagramRef = useRef(diagram);
  diagramRef.current = diagram;
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef<Edge[]>(edges);
  edgesRef.current = edges;

  // React Flow dispatches `select` changes when the user clicks an element; the controlled props
  // still carry stale `selected` values, so we derive the next selection by applying the changes
  // directly instead of reading `rf.getEdges()`/`rf.getNodes()` (which mirror the stale props).
  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, nodesRef.current);
      // Only persist `dimensions` from real resize gestures. RF also fires `dimensions` whenever a
      // node is mounted/measured (no `setAttributes`, no `resizing`), and persisting those caused a
      // measure→setDiagram→re-measure loop that broke node creation.
      const frameIdSet = new Set(diagramRef.current.frames.map((f) => f.id));
      const isResizeGestureChange = (c: NodeChange) =>
        c.type === "dimensions" &&
        frameIdSet.has(c.id) &&
        // `setAttributes` is only set during XYResizer's drag; `resizing: false` ends the gesture.
        ((c as { setAttributes?: boolean | "width" | "height" }).setAttributes != null ||
          (c as { resizing?: boolean }).resizing === false);
      const persistLayout =
        changes.some((c) => c.type === "position") || changes.some(isResizeGestureChange);
      if (persistLayout) {
        setDiagram(applyNodeLayoutChanges(diagramRef.current, nextNodes), { dirty: true });
      }
      for (const c of changes) {
        if (c.type === "remove") removeElementById(c.id);
      }
      if (changes.some((c) => c.type === "select")) {
        const prev = useDocument.getState().selection;
        setSelection(
          nextNodes.filter((n) => n.selected).map((n) => n.id),
          prev.edgeIds,
        );
      }
    },
    [setDiagram, removeElementById, setSelection],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === "remove") removeEdge(c.id);
      }
      if (changes.some((c) => c.type === "select")) {
        const nextEdges = applyEdgeChanges(changes, edgesRef.current);
        const prev = useDocument.getState().selection;
        setSelection(
          prev.nodeIds,
          nextEdges.filter((e) => e.selected).map((e) => e.id),
        );
      }
    },
    [removeEdge, setSelection],
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: ns, edges: es }) => {
      setSelection(
        ns.map((n) => n.id),
        es.map((e) => e.id),
      );
    },
    [setSelection],
  );

  // Drop a top-level diagram node onto a frame to re-parent it. Children with `extent: "parent"`
  // can't escape, so we only need to handle the un-parented → parented transition here.
  const onNodeDragStop = useCallback(
    (_event: ReactMouseEvent<Element> | globalThis.MouseEvent | TouchEvent, node: Node) => {
      if (node.type !== "diagram") return;
      const d = diagramRef.current;
      const rec = d.nodes.find((n) => n.id === node.id);
      if (!rec || rec.parentId != null) return;
      const target = findDropTargetFrame(d, node.id);
      if (!target) return;
      updateNode(node.id, {
        parentId: target.id,
        x: rec.x - target.x,
        y: rec.y - target.y,
      });
    },
    [updateNode],
  );

  const clampMenu = useCallback((clientX: number, clientY: number, mw: number, mh: number) => {
    const wrap = wrapRef.current;
    const rect = wrap?.getBoundingClientRect();
    const w = wrap?.clientWidth ?? 0;
    const h = wrap?.clientHeight ?? 0;
    let cx = clientX - (rect?.left ?? 0);
    let cy = clientY - (rect?.top ?? 0);
    if (w > 0) cx = Math.min(Math.max(4, cx), w - mw - 4);
    if (h > 0) cy = Math.min(Math.max(4, cy), h - mh - 4);
    return { cx, cy };
  }, []);

  const openRelationshipDraft = useCallback(
    (
      source: string,
      target: string,
      ports?: { sourceHandle?: string | null; targetHandle?: string | null },
    ) => {
      if (!source || !target || source === target) return;
      setRelationshipDraft({
        source,
        target,
        sourceHandle: normalizeDiagramConnectionHandle(ports?.sourceHandle, "source"),
        targetHandle: normalizeDiagramConnectionHandle(ports?.targetHandle, "target"),
      });
    },
    [setRelationshipDraft],
  );

  const onConnect: OnConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      connectHandledRef.current = true;
      openRelationshipDraft(c.source, c.target, {
        sourceHandle: normalizeDiagramConnectionHandle(c.sourceHandle, "source"),
        targetHandle: normalizeDiagramConnectionHandle(c.targetHandle, "target"),
      });
    },
    [openRelationshipDraft],
  );

  const clearConnectPointerListeners = useCallback(() => {
    const cur = connectListenersRef.current;
    if (cur) {
      window.removeEventListener("pointerup", cur.up, true);
      window.removeEventListener("pointercancel", cur.up, true);
      connectListenersRef.current = null;
    }
  }, []);

  const onConnectStart = useCallback(() => {
    connectHandledRef.current = false;
    setRelationshipDraft(null);
    clearConnectPointerListeners();
    const up = () => {
      window.setTimeout(() => clearConnectPointerListeners(), 0);
    };
    connectListenersRef.current = { up };
    window.addEventListener("pointerup", up, { capture: true });
    window.addEventListener("pointercancel", up, { capture: true });
  }, [clearConnectPointerListeners, setRelationshipDraft]);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      clearConnectPointerListeners();
      if (connectHandledRef.current) {
        connectHandledRef.current = false;
        return;
      }
      if (!state.fromHandle || state.fromHandle.type !== "source") return;
      const sourceId = state.fromHandle.nodeId;
      let targetId = state.toHandle?.nodeId ?? state.toNode?.id ?? null;

      const clientX = "clientX" in event ? event.clientX : event.changedTouches?.[0]?.clientX;
      const clientY = "clientY" in event ? event.clientY : event.changedTouches?.[0]?.clientY;
      if (!targetId && typeof clientX === "number" && typeof clientY === "number") {
        const flow = rf.screenToFlowPosition({ x: clientX, y: clientY });
        targetId = pickTargetNodeIdAtFlowPoint(
          nodesRef.current,
          flow,
          sourceId,
          CONNECTION_DROP_MARGIN,
        );
      }

      if (!targetId || sourceId === targetId) return;
      if (
        !isDiagramValidConnection({
          source: sourceId,
          target: targetId,
          sourceHandle: null,
          targetHandle: null,
        } as DiagramFlowEdge)
      ) {
        return;
      }
      const sourceHandleRaw =
        state.fromHandle?.id != null && state.fromHandle.id !== ""
          ? state.fromHandle.id
          : undefined;
      const targetHandleRaw =
        state.toHandle?.id != null && state.toHandle.id !== "" ? state.toHandle.id : undefined;
      openRelationshipDraft(sourceId, targetId, {
        sourceHandle: normalizeDiagramConnectionHandle(sourceHandleRaw, "source"),
        targetHandle: normalizeDiagramConnectionHandle(targetHandleRaw, "target"),
      });
    },
    [clearConnectPointerListeners, openRelationshipDraft, rf],
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const dismissOverlays = useCallback(() => {
    setMenu(null);
    setRelationshipDraft(null);
  }, [setRelationshipDraft]);

  const onPaneContextMenu = useCallback(
    (e: ReactMouseEvent<Element> | globalThis.MouseEvent) => {
      e.preventDefault();
      const flow = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const { cx, cy } = clampMenu(e.clientX, e.clientY, PANE_MENU_W, PANE_MENU_H);
      setMenu({ kind: "pane", cx, cy, fx: flow.x, fy: flow.y });
    },
    [rf, clampMenu],
  );

  const onNodeContextMenu = useCallback(
    (e: ReactMouseEvent<Element>, node: Node) => {
      e.preventDefault();
      e.stopPropagation();
      const { cx, cy } = clampMenu(e.clientX, e.clientY, NODE_MENU_W, NODE_MENU_H);
      setMenu({ kind: "node", cx, cy, nodeId: node.id });
    },
    [clampMenu],
  );

  const onEdgeContextMenu = useCallback(
    (e: ReactMouseEvent<Element>, edge: Edge) => {
      e.preventDefault();
      e.stopPropagation();
      const prev = useDocument.getState().selection;
      if (!prev.edgeIds.includes(edge.id)) {
        setSelection([], [edge.id]);
      }
      const { cx, cy } = clampMenu(e.clientX, e.clientY, EDGE_MENU_W, EDGE_MENU_H);
      setMenu({ kind: "edge", cx, cy, edgeId: edge.id });
    },
    [clampMenu, setSelection],
  );

  const syncZoomFromViewport = useCallback(() => {
    setZoom(rf.getZoom());
  }, [rf, setZoom]);

  const onMoveEnd = useCallback(
    (_e: globalThis.MouseEvent | globalThis.TouchEvent | null, viewport: Viewport) => {
      setZoom(viewport.zoom);
    },
    [setZoom],
  );

  const onFlowInit = useCallback(
    (instance: { fitView: (o?: object) => Promise<boolean>; getZoom: () => number }) => {
      void instance.fitView({ padding: 0.12, duration: 0, maxZoom: MAX_VIEW_ZOOM });
      setZoom(instance.getZoom());
      window.setTimeout(() => setZoom(instance.getZoom()), 160);
    },
    [setZoom],
  );

  const handleZoomIn = useCallback(() => {
    rf.zoomIn({ duration: 180 });
    window.setTimeout(syncZoomFromViewport, 200);
    closeMenu();
  }, [rf, closeMenu, syncZoomFromViewport]);

  const handleZoomOut = useCallback(() => {
    rf.zoomOut({ duration: 180 });
    window.setTimeout(syncZoomFromViewport, 200);
    closeMenu();
  }, [rf, closeMenu, syncZoomFromViewport]);

  const handleZoomTo100 = useCallback(() => {
    rf.zoomTo(1, { duration: 180 });
    window.setTimeout(syncZoomFromViewport, 200);
    closeMenu();
  }, [rf, closeMenu, syncZoomFromViewport]);

  const handleSelectAll = useCallback(() => {
    for (const n of rf.getNodes()) {
      rf.updateNode(n.id, { selected: true });
    }
    for (const e of rf.getEdges()) {
      rf.updateEdge(e.id, { selected: true });
    }
    closeMenu();
  }, [rf, closeMenu]);

  const pasteAtFlowPosition = useCallback(
    async (flowX: number, flowY: number) => {
      let clip: string;
      try {
        clip = await readClipboardText();
      } catch (err) {
        console.warn("Paste: clipboard read failed", err);
        return;
      }
      const payloads = parseAutodrawNodesClipboard(clip);
      if (!payloads || payloads.length === 0) return;
      const d = useDocument.getState().diagram;
      const placed = placementForMultiPaste(payloads, flowX, flowY, d);
      const newIds: string[] = [];
      for (const p of placed) {
        newIds.push(addNode(p, { focusLabel: false }));
      }
      if (newIds.length > 0) {
        setSelection(newIds, []);
      }
    },
    [addNode, setSelection],
  );

  const copySelectedNodesToClipboard = useCallback(async () => {
    const { selection, diagram } = useDocument.getState();
    const records: NodeRecord[] = [];
    for (const id of selection.nodeIds) {
      const n = diagram.nodes.find((x) => x.id === id);
      if (n) records.push(n);
    }
    if (records.length === 0) return;
    await writeClipboardText(serializeNodesForClip(records));
  }, []);

  const cutSelectedNodes = useCallback(async () => {
    const ids = [...useDocument.getState().selection.nodeIds];
    if (ids.length === 0) return;
    try {
      await copySelectedNodesToClipboard();
    } catch (err) {
      console.warn("Cut: copy failed", err);
      return;
    }
    for (const id of ids) {
      removeElementById(id);
    }
  }, [copySelectedNodesToClipboard, removeElementById]);

  useHotkeys(
    "mod+v",
    (e) => {
      if (isTypingInField()) return;
      if (useDocument.getState().relationshipDraft) return;
      e.preventDefault();
      const el = wrapRef.current;
      const r = el?.getBoundingClientRect();
      const cx = (r?.left ?? 0) + (r?.width ?? 0) / 2;
      const cy = (r?.top ?? 0) + (r?.height ?? 0) / 2;
      const flow = rf.screenToFlowPosition({ x: cx, y: cy });
      void pasteAtFlowPosition(flow.x, flow.y);
      closeMenu();
    },
    [rf, pasteAtFlowPosition, closeMenu],
  );

  useHotkeys(
    "mod+c",
    (e) => {
      if (isTypingInField()) return;
      if (useDocument.getState().relationshipDraft) return;
      if (useDocument.getState().selection.nodeIds.length === 0) return;
      e.preventDefault();
      void copySelectedNodesToClipboard().catch((err) => console.warn("Copy failed", err));
      closeMenu();
    },
    [copySelectedNodesToClipboard, closeMenu],
  );

  useHotkeys(
    "mod+x",
    (e) => {
      if (isTypingInField()) return;
      if (useDocument.getState().relationshipDraft) return;
      if (useDocument.getState().selection.nodeIds.length === 0) return;
      e.preventDefault();
      void cutSelectedNodes().catch((err) => console.warn("Cut failed", err));
      closeMenu();
    },
    [cutSelectedNodes, closeMenu],
  );

  useHotkeys(
    "mod+a",
    (e) => {
      if (isTypingInField()) return;
      if (useDocument.getState().relationshipDraft) return;
      e.preventDefault();
      const d = useDocument.getState().diagram;
      const ids = [
        ...d.nodes.map((n) => n.id),
        ...d.frames.map((f) => f.id),
        ...d.images.map((im) => im.id),
        ...d.textLabels.map((t) => t.id),
      ];
      setSelection(ids, []);
      closeMenu();
    },
    [setSelection, closeMenu],
  );

  useEffect(() => {
    if (!menu && !relationshipDraft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissOverlays();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, relationshipDraft, dismissOverlays]);

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        snapToGrid
        snapGrid={SNAP_GRID}
        nodesConnectable
        elementsSelectable
        edgesFocusable
        elevateEdgesOnSelect
        selectNodesOnDrag
        connectionMode={ConnectionMode.Loose}
        connectionLineComponent={DiagramConnectionLine}
        connectionRadius={200}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onConnect={onConnect}
        isValidConnection={isDiagramValidConnection}
        onSelectionChange={onSelectionChange}
        onPaneContextMenu={onPaneContextMenu}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeContextMenu={onEdgeContextMenu}
        onPaneClick={dismissOverlays}
        onMoveStart={dismissOverlays}
        onMoveEnd={onMoveEnd}
        onInit={onFlowInit}
        maxZoom={MAX_VIEW_ZOOM}
        proOptions={PRO_OPTIONS}
        deleteKeyCode={null}
      >
        <Background gap={16} size={1.5} color={dotGridColor} />
      </ReactFlow>
      {relationshipDraft ? (
        <RelationshipDraftDialog
          onCancel={() => setRelationshipDraft(null)}
          onCommit={(markers) => commitRelationshipDraft(markers)}
        />
      ) : null}
      {menu?.kind === "pane" ? (
        <PaneContextMenu
          cx={menu.cx}
          cy={menu.cy}
          fx={menu.fx}
          fy={menu.fy}
          onAddElement={(flow) =>
            window.dispatchEvent(
              new CustomEvent("autodraw:open-add-element", { detail: { x: flow.x, y: flow.y } }),
            )
          }
          onPasteHere={(flow) => {
            void pasteAtFlowPosition(flow.x, flow.y);
          }}
          onSelectAll={handleSelectAll}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomTo100={handleZoomTo100}
          onClose={closeMenu}
        />
      ) : null}
      {menu?.kind === "node" ? (
        <CanvasNodeContextMenu cx={menu.cx} cy={menu.cy} nodeId={menu.nodeId} onClose={closeMenu} />
      ) : null}
      {menu?.kind === "edge" ? (
        <EdgeContextMenu cx={menu.cx} cy={menu.cy} edgeId={menu.edgeId} onClose={closeMenu} />
      ) : null}
    </div>
  );
}

/** Modal for a just-drawn connection: pick start/end markers before the edge is created. */
function RelationshipDraftDialog({
  onCancel,
  onCommit,
}: {
  onCancel: () => void;
  onCommit: (markers: { head: EdgeHead; tail: EdgeHead }) => void;
}) {
  const [tail, setTail] = useState<EdgeHead>("none");
  const [head, setHead] = useState<EdgeHead>("lineArrow");

  return (
    <>
      <div
        className="absolute inset-0 z-[55] bg-black/15 backdrop-blur-[1px]"
        role="presentation"
        aria-hidden
        onMouseDown={onCancel}
      />
      <div
        className="absolute left-1/2 top-1/2 z-[56] w-[min(520px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-lg"
        role="dialog"
        aria-labelledby="relationship-draft-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="relationship-draft-title"
              className="m-0 text-[15px] font-semibold tracking-tight"
            >
              New relationship
            </h2>
            <p className="mt-1 max-w-xl text-xs leading-snug text-muted-foreground">
              Pick start and end markers. The edge is added between the two elements you connected.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1">
            <EdgeMarkerDropdown role="start" value={tail} onChange={setTail} label="Start marker" />
          </div>
          <div className="flex-1">
            <EdgeMarkerDropdown role="end" value={head} onChange={setHead} label="End marker" />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" size="sm" onClick={() => onCommit({ head, tail })}>
            Add relationship
          </Button>
        </div>
      </div>
    </>
  );
}
