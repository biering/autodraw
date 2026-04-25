import {
  Background,
  ConnectionMode,
  ReactFlow,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type EdgeTypes,
  type IsValidConnection,
  type NodeChange,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
  type Node,
  type Viewport,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import {
  resolvedNodeBodyFillRgba,
  resolvedNodeBodyStrokeRgba,
  styleById,
  type DiagramV1,
  type EdgeDash,
  type EdgeHead,
  type EdgeRouting,
  type NodeRecord,
  type NodeShape,
} from "@autodraw/core";
import type { FinalConnectionState } from "@xyflow/system";
import {
  applyNodePositionChanges,
  normalizeDiagramConnectionHandle,
  type DiagramFlowEdge,
  type DiagramNodeData,
  toFlowEdges,
  toFlowNodes,
} from "./flowAdapter";
import { DiagramConnectionLine } from "./DiagramConnectionLine";
import { DiagramEdge } from "./edges/DiagramEdge";
import { DiagramNode } from "./nodes/DiagramNode";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { readClipboardText, writeClipboardText } from "../../platform/clipboard";
import { CreationShapeToggleInner, creationShapeToggleLabel } from "../CreationShapeChoice";
import { creationMenuColors, creationMenuShapes } from "../creationMenuCatalog";
import { isTypingInField } from "../isTypingInField";
import {
  parseAutodrawNodesClipboard,
  placementForMultiPaste,
  serializeNodeForClip,
  serializeNodesForClip,
} from "../nodeClipboard";
import { MAX_VIEW_ZOOM, useDocument } from "../state/useDocument";
import { EdgeMarkerDropdown } from "./NewRelationshipPicker";

const nodeTypes = { diagram: DiagramNode } as unknown as NodeTypes;
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
const PANE_MENU_H = 300;
const NODE_MENU_W = 280;
const NODE_MENU_H = 440;
const EDGE_MENU_W = 400;
const EDGE_MENU_H = 460;

const CTX_BACKDROP = "absolute inset-0 z-50";

const CTX_MENU =
  "absolute z-[51] min-w-[232px] max-w-[min(320px,calc(100vw-24px))] whitespace-nowrap rounded-lg border border-border bg-popover py-1.5 pl-1 pr-1 text-[13px] leading-snug text-popover-foreground shadow-lg";

const CTX_ITEM =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-md border-0 bg-transparent px-2 py-1.5 text-left font-inherit text-sm text-popover-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";

const CTX_ICON =
  "flex h-[18px] w-[18px] shrink-0 items-center justify-center text-muted-foreground";

const CTX_SEP = "mx-2 my-1 h-px bg-border";

const EDGE_CTX_MENU =
  "absolute z-[51] min-w-[280px] max-w-[min(440px,calc(100vw-24px))] rounded-lg border border-border bg-popover py-2 pl-1 pr-1 text-[13px] leading-snug text-popover-foreground shadow-lg whitespace-normal";

const EDGE_SECTION =
  "px-2 pb-1 pt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

const EDGE_TOGGLE_ROW = "grid grid-cols-3 gap-1 px-2 pb-2";

const NODE_SHAPE_TOGGLE_ROW = "grid grid-cols-2 gap-1 px-2 pb-2";

const EDGE_TOGGLE =
  "rounded-md border border-border bg-background px-1.5 py-1.5 text-center text-[11px] font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type CanvasMenu =
  | { kind: "pane"; cx: number; cy: number; fx: number; fy: number }
  | { kind: "node"; cx: number; cy: number; nodeId: string }
  | { kind: "edge"; cx: number; cy: number; edgeId: string };

function connectedNodeIds(diagram: DiagramV1, startId: string): Set<string> {
  const ids = new Set<string>([startId]);
  let added = true;
  while (added) {
    added = false;
    for (const e of diagram.edges) {
      if (ids.has(e.from) && !ids.has(e.to)) {
        ids.add(e.to);
        added = true;
      }
      if (ids.has(e.to) && !ids.has(e.from)) {
        ids.add(e.from);
        added = true;
      }
    }
  }
  return ids;
}

function shapeEqual(a: NodeRecord["shape"], b: NodeRecord["shape"]): boolean {
  return (a ?? null) === (b ?? null);
}

export function DiagramCanvas() {
  const diagram = useDocument(useShallow((s) => s.diagram));
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const selection = useDocument(useShallow((s) => s.selection));
  const setDiagram = useDocument((s) => s.setDiagram);
  const setSelection = useDocument((s) => s.setSelection);
  const setZoom = useDocument((s) => s.setZoom);
  const removeNode = useDocument((s) => s.removeNode);
  const removeEdge = useDocument((s) => s.removeEdge);
  const addNode = useDocument((s) => s.addNode);
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
      if (changes.some((c) => c.type === "position")) {
        setDiagram(applyNodePositionChanges(diagramRef.current, nextNodes), { dirty: true });
      }
      for (const c of changes) {
        if (c.type === "remove") removeNode(c.id);
      }
      if (changes.some((c) => c.type === "select")) {
        const prev = useDocument.getState().selection;
        setSelection(
          nextNodes.filter((n) => n.selected).map((n) => n.id),
          prev.edgeIds,
        );
      }
    },
    [setDiagram, removeNode, setSelection],
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
      removeNode(id);
    }
  }, [copySelectedNodesToClipboard, removeNode]);

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
      const ids = useDocument.getState().diagram.nodes.map((n) => n.id);
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
      {menu ? (
        <div
          className={CTX_BACKDROP}
          role="presentation"
          onMouseDown={dismissOverlays}
          onContextMenu={(e) => {
            e.preventDefault();
            closeMenu();
          }}
        >
          {menu.kind === "pane" ? (
            <div
              className={CTX_MENU}
              role="menu"
              style={{ left: menu.cx, top: menu.cy }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className={CTX_ITEM}
                role="menuitem"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("autodraw:open-add-element", {
                      detail: { x: menu.fx, y: menu.fy },
                    }),
                  );
                  closeMenu();
                }}
              >
                <span className={CTX_ICON} aria-hidden>
                  <IconAddNewElement />
                </span>
                Add New Element…
              </button>
              <div className={CTX_SEP} role="separator" />
              <button
                type="button"
                className={CTX_ITEM}
                role="menuitem"
                onClick={() => {
                  void pasteAtFlowPosition(menu.fx, menu.fy);
                  closeMenu();
                }}
              >
                <span className={CTX_ICON} aria-hidden>
                  <IconPaste />
                </span>
                Paste Here
              </button>
              <div className={CTX_SEP} role="separator" />
              <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleSelectAll}>
                <span className={CTX_ICON} aria-hidden>
                  <IconSelectAll />
                </span>
                Select All
              </button>
              <div className={CTX_SEP} role="separator" />
              <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleZoomIn}>
                <span className={CTX_ICON} aria-hidden>
                  <IconZoomIn />
                </span>
                Zoom In
              </button>
              <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleZoomOut}>
                <span className={CTX_ICON} aria-hidden>
                  <IconZoomOut />
                </span>
                Zoom Out
              </button>
              <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleZoomTo100}>
                <span className={CTX_ICON} aria-hidden>
                  <IconZoom100 />
                </span>
                Zoom to 100%
              </button>
            </div>
          ) : menu.kind === "node" ? (
            <NodeContextMenu x={menu.cx} y={menu.cy} nodeId={menu.nodeId} onClose={closeMenu} />
          ) : (
            <EdgeContextMenu x={menu.cx} y={menu.cy} edgeId={menu.edgeId} onClose={closeMenu} />
          )}
        </div>
      ) : null}
    </div>
  );
}

function nodeEffectiveShape(diagram: DiagramV1, node: NodeRecord | undefined): NodeShape {
  if (!node) return "roundedRect";
  return node.shape ?? styleById(diagram, node.styleId)?.shape ?? "roundedRect";
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

function NodeContextMenuInner({
  x,
  y,
  nodeId,
  onClose,
}: {
  x: number;
  y: number;
  nodeId: string;
  onClose: () => void;
}) {
  const rf = useReactFlow();
  const diagram = useDocument(useShallow((s) => s.diagram));
  const node = useDocument((s) => s.diagram.nodes.find((n) => n.id === nodeId));
  const updateNode = useDocument((s) => s.updateNode);
  const removeNode = useDocument((s) => s.removeNode);
  const addNode = useDocument((s) => s.addNode);
  const setEditingNodeId = useDocument((s) => s.setEditingNodeId);

  const colorStyles = useMemo(
    () => creationMenuColors(diagram),
    [diagram.palette, diagram.customStyles],
  );

  const effectiveShape = useMemo(() => nodeEffectiveShape(diagram, node), [diagram, node]);

  const setColor = useCallback(
    (id: string) => {
      updateNode(nodeId, { styleId: id });
    },
    [nodeId, updateNode],
  );

  const setShape = useCallback(
    (sh: NodeShape) => {
      updateNode(nodeId, { shape: sh });
    },
    [nodeId, updateNode],
  );

  const clearFlowSelection = useCallback(() => {
    for (const n of rf.getNodes()) rf.updateNode(n.id, { selected: false });
    for (const e of rf.getEdges()) rf.updateEdge(e.id, { selected: false });
  }, [rf]);

  const getRecord = useCallback(() => {
    return useDocument.getState().diagram.nodes.find((n) => n.id === nodeId);
  }, [nodeId]);

  const copyPayload = useCallback(async () => {
    const rec = getRecord();
    if (!rec) return;
    await writeClipboardText(serializeNodeForClip(rec));
  }, [getRecord]);

  const handleEditCaption = useCallback(() => {
    setEditingNodeId(nodeId);
    onClose();
  }, [nodeId, setEditingNodeId, onClose]);

  const handleCopy = useCallback(async () => {
    try {
      await copyPayload();
    } catch (err) {
      console.warn("Copy failed", err);
    }
    onClose();
  }, [copyPayload, onClose]);

  const handleCut = useCallback(async () => {
    try {
      await copyPayload();
      removeNode(nodeId);
    } catch (err) {
      console.warn("Cut failed", err);
    }
    onClose();
  }, [copyPayload, removeNode, nodeId, onClose]);

  const handleDuplicate = useCallback(() => {
    const src = getRecord();
    if (!src) {
      onClose();
      return;
    }
    const newId = addNode(
      {
        text: src.text,
        x: src.x + 40,
        y: src.y + 40,
        w: src.w,
        h: src.h,
        styleId: src.styleId,
        shape: src.shape,
      },
      { focusLabel: false },
    );
    clearFlowSelection();
    rf.updateNode(newId, { selected: true });
    onClose();
  }, [getRecord, addNode, clearFlowSelection, rf, onClose]);

  const handleDelete = useCallback(() => {
    removeNode(nodeId);
    onClose();
  }, [removeNode, nodeId, onClose]);

  const handleSelectAll = useCallback(() => {
    for (const n of rf.getNodes()) rf.updateNode(n.id, { selected: true });
    for (const e of rf.getEdges()) rf.updateEdge(e.id, { selected: true });
    onClose();
  }, [rf, onClose]);

  const handleSelectConnected = useCallback(() => {
    const d = useDocument.getState().diagram;
    const ids = connectedNodeIds(d, nodeId);
    clearFlowSelection();
    for (const id of ids) {
      rf.updateNode(id, { selected: true });
    }
    for (const e of d.edges) {
      if (ids.has(e.from) && ids.has(e.to)) {
        rf.updateEdge(e.id, { selected: true });
      }
    }
    onClose();
  }, [rf, nodeId, clearFlowSelection, onClose]);

  const handleSelectSameType = useCallback(() => {
    const d = useDocument.getState().diagram;
    const src = d.nodes.find((n) => n.id === nodeId);
    if (!src) {
      onClose();
      return;
    }
    clearFlowSelection();
    for (const n of d.nodes) {
      if (n.styleId === src.styleId && shapeEqual(n.shape, src.shape)) {
        rf.updateNode(n.id, { selected: true });
      }
    }
    const typeIds = new Set(
      d.nodes
        .filter((n) => n.styleId === src.styleId && shapeEqual(n.shape, src.shape))
        .map((n) => n.id),
    );
    for (const e of d.edges) {
      if (typeIds.has(e.from) && typeIds.has(e.to)) {
        rf.updateEdge(e.id, { selected: true });
      }
    }
    onClose();
  }, [rf, nodeId, clearFlowSelection, onClose]);

  return (
    <div
      className={CTX_MENU}
      role="menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={EDGE_SECTION}>Color</div>
      <div className="grid grid-cols-6 gap-1 px-2 pb-2">
        {colorStyles.map((s) => (
          <button
            key={s.id}
            type="button"
            title={s.id}
            className={cn(
              "h-7 rounded-md border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              node?.styleId === s.id && "ring-2 ring-primary",
            )}
            style={{
              background: resolvedNodeBodyFillRgba(s, s.id),
              borderColor: resolvedNodeBodyStrokeRgba(s),
            }}
            onClick={() => setColor(s.id)}
          />
        ))}
      </div>
      <div className={EDGE_SECTION}>Shape</div>
      <div className={NODE_SHAPE_TOGGLE_ROW}>
        {creationMenuShapes().map((sh) => (
          <button
            key={sh}
            type="button"
            className={cn(
              EDGE_TOGGLE,
              "flex items-center justify-center py-1.5",
              effectiveShape === sh && "border-primary bg-accent",
            )}
            aria-label={creationShapeToggleLabel(sh)}
            aria-pressed={effectiveShape === sh}
            onClick={() => setShape(sh)}
          >
            <CreationShapeToggleInner shape={sh} />
          </button>
        ))}
      </div>
      <div className={CTX_SEP} role="separator" />
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleEditCaption}>
        <span className={CTX_ICON} aria-hidden>
          <IconEditCaption />
        </span>
        Edit Caption
      </button>
      <div className={CTX_SEP} role="separator" />
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleCut}>
        <span className={CTX_ICON} aria-hidden>
          <IconCut />
        </span>
        Cut
      </button>
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleCopy}>
        <span className={CTX_ICON} aria-hidden>
          <IconCopy />
        </span>
        Copy
      </button>
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleDuplicate}>
        <span className={CTX_ICON} aria-hidden>
          <IconDuplicate />
        </span>
        Duplicate
      </button>
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleDelete}>
        <span className={CTX_ICON} aria-hidden>
          <IconTrash />
        </span>
        Delete
      </button>
      <div className={CTX_SEP} role="separator" />
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleSelectAll}>
        <span className={CTX_ICON} aria-hidden>
          <IconSelectAllNode />
        </span>
        Select All
      </button>
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleSelectConnected}>
        <span className={CTX_ICON} aria-hidden>
          <IconSelectConnected />
        </span>
        Select Connected Objects
      </button>
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleSelectSameType}>
        <span className={CTX_ICON} aria-hidden>
          <IconSelectSameType />
        </span>
        Select Elements of Same Type
      </button>
    </div>
  );
}

const NodeContextMenu = memo(NodeContextMenuInner);

function EdgeContextMenuInner({
  x,
  y,
  edgeId,
  onClose,
}: {
  x: number;
  y: number;
  edgeId: string;
  onClose: () => void;
}) {
  const removeEdge = useDocument((s) => s.removeEdge);
  const updateEdge = useDocument((s) => s.updateEdge);
  const edge = useDocument((s) => s.diagram.edges.find((e) => e.id === edgeId));

  const handleDelete = useCallback(() => {
    removeEdge(edgeId);
    onClose();
  }, [removeEdge, edgeId, onClose]);

  const setRouting = useCallback(
    (routing: EdgeRouting) => {
      updateEdge(edgeId, { routing, relationshipPreset: undefined });
    },
    [updateEdge, edgeId],
  );

  const setDash = useCallback(
    (dash: EdgeDash) => {
      updateEdge(edgeId, { dash, relationshipPreset: undefined });
    },
    [updateEdge, edgeId],
  );

  const setWeight = useCallback(
    (strokeWidth: number) => {
      updateEdge(edgeId, { strokeWidth, relationshipPreset: undefined });
    },
    [updateEdge, edgeId],
  );

  const setHead = useCallback(
    (head: EdgeHead) => {
      updateEdge(edgeId, { head, relationshipPreset: undefined });
    },
    [updateEdge, edgeId],
  );

  const setTail = useCallback(
    (tail: EdgeHead) => {
      updateEdge(edgeId, { tail, relationshipPreset: undefined });
    },
    [updateEdge, edgeId],
  );

  if (!edge) return null;

  const sw = edge.strokeWidth ?? 1;
  const weightKey: "thin" | "medium" | "bold" = sw <= 1.15 ? "thin" : sw >= 2.2 ? "bold" : "medium";

  return (
    <div
      className={EDGE_CTX_MENU}
      role="menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <EdgeMarkerDropdown
        role="start"
        value={edge.tail ?? "none"}
        onChange={setTail}
        label="Start marker"
      />
      <EdgeMarkerDropdown role="end" value={edge.head} onChange={setHead} label="End marker" />
      <div className={CTX_SEP} role="separator" />
      <div className={EDGE_SECTION}>Path</div>
      <div className={EDGE_TOGGLE_ROW}>
        {(["straight", "orthogonal", "curved"] as const).map((r) => (
          <button
            key={r}
            type="button"
            className={cn(EDGE_TOGGLE, edge.routing === r && "border-primary bg-accent")}
            onClick={() => setRouting(r)}
          >
            {r === "straight" ? "Straight" : r === "orthogonal" ? "Right angle" : "Curved"}
          </button>
        ))}
      </div>
      <div className={EDGE_SECTION}>Line pattern</div>
      <div className={EDGE_TOGGLE_ROW}>
        {(["solid", "dashed", "dotted"] as const).map((d) => (
          <button
            key={d}
            type="button"
            className={cn(EDGE_TOGGLE, edge.dash === d && "border-primary bg-accent")}
            onClick={() => setDash(d)}
          >
            {d === "solid" ? "Solid" : d === "dashed" ? "Dashed" : "Dotted"}
          </button>
        ))}
      </div>
      <div className={EDGE_SECTION}>Weight</div>
      <div className={EDGE_TOGGLE_ROW}>
        <button
          type="button"
          className={cn(EDGE_TOGGLE, weightKey === "thin" && "border-primary bg-accent")}
          onClick={() => setWeight(1)}
        >
          Thin
        </button>
        <button
          type="button"
          className={cn(EDGE_TOGGLE, weightKey === "medium" && "border-primary bg-accent")}
          onClick={() => setWeight(1.5)}
        >
          Medium
        </button>
        <button
          type="button"
          className={cn(EDGE_TOGGLE, weightKey === "bold" && "border-primary bg-accent")}
          onClick={() => setWeight(2.5)}
        >
          Bold
        </button>
      </div>
      <div className={CTX_SEP} role="separator" />
      <button type="button" className={CTX_ITEM} role="menuitem" onClick={handleDelete}>
        <span className={CTX_ICON} aria-hidden>
          <IconTrash />
        </span>
        Delete
      </button>
    </div>
  );
}

const EdgeContextMenu = memo(EdgeContextMenuInner);

function IconAddNewElement() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="2.25"
        y="2.25"
        width="11.5"
        height="11.5"
        rx="1.75"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function IconPaste() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect
        x="4.5"
        y="2.5"
        width="7"
        height="5"
        rx="0.75"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <rect x="2.5" y="5.5" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function IconSelectAll() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M2.5 4.5V2.5H4.5M11.5 2.5H13.5V4.5M13.5 11.5V13.5H11.5M4.5 13.5H2.5V11.5"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconZoomIn() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6.75" cy="6.75" r="4" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 10l3.25 3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path
        d="M6.75 5v3.5M5 6.75h3.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconZoomOut() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6.75" cy="6.75" r="4" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 10l3.25 3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <path d="M5 6.75h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconZoom100() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6.75" cy="6.75" r="4" stroke="currentColor" strokeWidth="1.25" />
      <path d="M10 10l3.25 3.25" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <text
        x="6.75"
        y="8.35"
        textAnchor="middle"
        fontSize="5.5"
        fill="currentColor"
        fontWeight="600"
        fontFamily="system-ui, sans-serif"
      >
        1
      </text>
    </svg>
  );
}

function IconEditCaption() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="4" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6.5 8.5h3M6.5 10h2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconCut() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="5.25" cy="5.25" r="2" stroke="currentColor" strokeWidth="1.15" />
      <circle cx="10.75" cy="10.75" r="2" stroke="currentColor" strokeWidth="1.15" />
      <path
        d="M6.5 6.5l7 7M9.5 9.5l-7-7"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.15" />
      <path
        d="M4.5 11V4.5a1 1 0 011-1H11"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconDuplicate() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="4.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path
        d="M3.5 10.5V4.5a1 1 0 011-1h6"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M10 3.5h2.5a1 1 0 011 1V7"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M3.5 4.5h9M6 4.5V3.5h4V4.5"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M5 4.5v8a1 1 0 001 1h4a1 1 0 001-1v-8"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path d="M7 7v4M9 7v4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function IconSelectAllNode() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="4" y="4" width="8" height="8" rx="0.75" stroke="currentColor" strokeWidth="1.15" />
      <path
        d="M2.5 5V2.5H5M11 2.5h2.5V5M11 11h2.5v2.5H11M5 13.5H2.5V11"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconSelectConnected() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="6" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <rect x="9.5" y="6" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1.1" />
      <path d="M6.5 8h3" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

function IconSelectSameType() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="3" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="3" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
      <rect x="3" y="9" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
      <rect x="9" y="9" width="4" height="4" rx="0.5" stroke="currentColor" strokeWidth="1" />
      <path
        d="M2 2.5h1.5V4M14 2.5h-1.5V4M14 13.5h-1.5V12M2 13.5h1.5V12"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
