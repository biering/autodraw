import {
  Background,
  ConnectionMode,
  ReactFlow,
  applyNodeChanges,
  useReactFlow,
  type Connection,
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
import { useShallow } from "zustand/react/shallow";
import { applyRelationshipPreset } from "@agentsdraw/core";
import type { DiagramV1, NodeRecord } from "@agentsdraw/core";
import type { FinalConnectionState } from "@xyflow/system";
import {
  applyNodePositionChanges,
  type DiagramFlowEdge,
  toFlowEdges,
  toFlowNodes,
} from "./flowAdapter.js";
import { DiagramConnectionLine } from "./DiagramConnectionLine.js";
import { DiagramEdge } from "./edges/DiagramEdge.js";
import { DiagramNode } from "./nodes/DiagramNode.js";
import { NEW_REL_POPOVER_H, NEW_REL_POPOVER_W, NewRelationshipPicker, type NewRelationshipDraft } from "./NewRelationshipPicker.js";
import { MAX_VIEW_ZOOM, useDocument } from "../state/useDocument.js";

const nodeTypes = { diagram: DiagramNode } as unknown as NodeTypes;
const edgeTypes = { diagram: DiagramEdge } as unknown as EdgeTypes;

/** Stable references for `<ReactFlow />` — new object/array literals each render force internal churn ([docs](https://reactflow.dev/learn/advanced-use/performance)). */
const SNAP_GRID: [number, number] = [16, 16];
const PRO_OPTIONS = { hideAttribution: true } as const;

const isDiagramValidConnection: IsValidConnection<DiagramFlowEdge> = (edge) =>
  Boolean(edge.source && edge.target && edge.source !== edge.target);

const PANE_MENU_W = 248;
const PANE_MENU_H = 300;
const NODE_MENU_W = 280;
const NODE_MENU_H = 440;

const NODE_CLIP_MARKER = "agentsdraw-node-clip-v1";

type CanvasMenu =
  | { kind: "pane"; cx: number; cy: number; fx: number; fy: number }
  | { kind: "node"; cx: number; cy: number; nodeId: string };

function serializeNodeForClip(n: NodeRecord): string {
  return JSON.stringify({
    $type: NODE_CLIP_MARKER,
    text: n.text,
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    styleId: n.styleId,
    shape: n.shape,
  });
}

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
  const addEdge = useDocument((s) => s.addEdge);
  const removeNode = useDocument((s) => s.removeNode);
  const removeEdge = useDocument((s) => s.removeEdge);
  const rf = useReactFlow();

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [menu, setMenu] = useState<CanvasMenu | null>(null);
  const [newEdgeDraft, setNewEdgeDraft] = useState<NewRelationshipDraft | null>(null);
  const pointerDuringConnect = useRef({ x: 0, y: 0 });
  const connectListenersRef = useRef<{ move: (e: PointerEvent) => void; up: () => void } | null>(null);
  /** True after `onConnect` runs so `onConnectEnd` does not open the picker twice. */
  const connectHandledRef = useRef(false);

  // Controlled selection: merge Zustand `selection` into props so `<ReactFlow />` stays in sync with
  // the [Adding Interactivity](https://reactflow.dev/learn/concepts/adding-interactivity) pattern
  // (apply*Changes + controlled elements). `onSelectionChange` mirrors RF → store; `setSelection` skips no-ops.
  const nodeSelSet = useMemo(() => new Set(selection.nodeIds), [selection.nodeIds]);
  const edgeSelSet = useMemo(() => new Set(selection.edgeIds), [selection.edgeIds]);

  const nodes = useMemo(
    () => toFlowNodes(diagram).map((n) => ({ ...n, selected: nodeSelSet.has(n.id) })),
    [diagram, nodeSelSet]
  );
  const edges = useMemo(
    () => toFlowEdges(diagram).map((e) => ({ ...e, selected: edgeSelSet.has(e.id) })),
    [diagram, edgeSelSet]
  );

  const dotGridColor = canvasTheme === "dark" ? "#4b4b52" : "#d9d9d9";

  const diagramRef = useRef(diagram);
  diagramRef.current = diagram;
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  const onNodesChange: OnNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const nextNodes = applyNodeChanges(changes, nodesRef.current);
      if (changes.some((c) => c.type === "position")) {
        setDiagram(applyNodePositionChanges(diagramRef.current, nextNodes), { dirty: true });
      }
      for (const c of changes) {
        if (c.type === "remove") removeNode(c.id);
      }
    },
    [setDiagram, removeNode]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      for (const c of changes) {
        if (c.type === "remove") removeEdge(c.id);
      }
    },
    [removeEdge]
  );

  const onSelectionChange = useCallback<OnSelectionChangeFunc>(
    ({ nodes: ns, edges: es }) => {
      setSelection(
        ns.map((n) => n.id),
        es.map((e) => e.id)
      );
    },
    [setSelection]
  );

  const closeRelationshipDraft = useCallback(() => setNewEdgeDraft(null), []);

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
    (source: string, target: string) => {
      if (!source || !target || source === target) return;
      const p = pointerDuringConnect.current;
      const { cx, cy } = clampMenu(p.x, p.y, NEW_REL_POPOVER_W, NEW_REL_POPOVER_H);
      setNewEdgeDraft({ source, target, cx, cy });
    },
    [clampMenu]
  );

  const onConnect: OnConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      connectHandledRef.current = true;
      openRelationshipDraft(c.source, c.target);
    },
    [openRelationshipDraft]
  );

  const clearConnectPointerListeners = useCallback(() => {
    const cur = connectListenersRef.current;
    if (cur) {
      window.removeEventListener("pointermove", cur.move, true);
      window.removeEventListener("pointerup", cur.up, true);
      window.removeEventListener("pointercancel", cur.up, true);
      connectListenersRef.current = null;
    }
  }, []);

  const onConnectStart = useCallback(() => {
    connectHandledRef.current = false;
    setNewEdgeDraft(null);
    clearConnectPointerListeners();
    const move = (e: PointerEvent) => {
      pointerDuringConnect.current = { x: e.clientX, y: e.clientY };
    };
    const up = () => {
      window.setTimeout(() => clearConnectPointerListeners(), 0);
    };
    connectListenersRef.current = { move, up };
    window.addEventListener("pointermove", move, { capture: true });
    window.addEventListener("pointerup", up, { capture: true });
    window.addEventListener("pointercancel", up, { capture: true });
  }, [clearConnectPointerListeners]);

  const onConnectEnd = useCallback(
    (_event: MouseEvent | TouchEvent, state: FinalConnectionState) => {
      clearConnectPointerListeners();
      if (connectHandledRef.current) {
        connectHandledRef.current = false;
        return;
      }
      if (state.isValid !== true || !state.fromHandle) return;
      if (state.fromHandle.type !== "source") return;
      const targetId = state.toHandle?.nodeId ?? state.toNode?.id;
      const sourceId = state.fromHandle.nodeId;
      if (!targetId || !sourceId || sourceId === targetId) return;
      openRelationshipDraft(sourceId, targetId);
    },
    [clearConnectPointerListeners, openRelationshipDraft]
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  const dismissOverlays = useCallback(() => {
    setMenu(null);
    setNewEdgeDraft(null);
  }, []);

  const newEdgeDraftRef = useRef<NewRelationshipDraft | null>(null);
  newEdgeDraftRef.current = newEdgeDraft;

  const handleRelationshipPick = useCallback(
    (presetIndex: number) => {
      const draft = newEdgeDraftRef.current;
      if (!draft?.source || !draft?.target) return;
      const st = applyRelationshipPreset(presetIndex);
      addEdge({
        from: draft.source,
        to: draft.target,
        routing: st.routing,
        dash: st.dash,
        head: st.head,
        tail: st.tail,
        label: "",
        strokeWidth: st.strokeWidth,
        relationshipPreset: st.relationshipPreset,
      });
      setNewEdgeDraft(null);
    },
    [addEdge]
  );

  const onPaneContextMenu = useCallback(
    (e: ReactMouseEvent<Element> | globalThis.MouseEvent) => {
      e.preventDefault();
      const flow = rf.screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const { cx, cy } = clampMenu(e.clientX, e.clientY, PANE_MENU_W, PANE_MENU_H);
      setMenu({ kind: "pane", cx, cy, fx: flow.x, fy: flow.y });
    },
    [rf, clampMenu]
  );

  const onNodeContextMenu = useCallback(
    (e: ReactMouseEvent<Element>, node: Node) => {
      e.preventDefault();
      e.stopPropagation();
      const { cx, cy } = clampMenu(e.clientX, e.clientY, NODE_MENU_W, NODE_MENU_H);
      setMenu({ kind: "node", cx, cy, nodeId: node.id });
    },
    [clampMenu]
  );

  const syncZoomFromViewport = useCallback(() => {
    setZoom(rf.getZoom());
  }, [rf, setZoom]);

  const onMoveEnd = useCallback(
    (_e: globalThis.MouseEvent | globalThis.TouchEvent | null, viewport: Viewport) => {
      setZoom(viewport.zoom);
    },
    [setZoom]
  );

  const onFlowInit = useCallback((instance: { fitView: (o?: object) => Promise<boolean>; getZoom: () => number }) => {
    void instance.fitView({ padding: 0.12, duration: 0, maxZoom: MAX_VIEW_ZOOM });
    setZoom(instance.getZoom());
    window.setTimeout(() => setZoom(instance.getZoom()), 160);
  }, [setZoom]);

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

  useEffect(() => {
    if (!menu && !newEdgeDraft) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissOverlays();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, newEdgeDraft, dismissOverlays]);

  return (
    <div ref={wrapRef} style={{ width: "100%", height: "100%", position: "relative" }}>
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
        onPaneClick={dismissOverlays}
        onMoveStart={dismissOverlays}
        onMoveEnd={onMoveEnd}
        onInit={onFlowInit}
        maxZoom={MAX_VIEW_ZOOM}
        proOptions={PRO_OPTIONS}
      >
        <Background gap={16} size={1.5} color={dotGridColor} />
      </ReactFlow>
      {newEdgeDraft ? (
        <NewRelationshipPicker
          draft={newEdgeDraft}
          onPick={handleRelationshipPick}
          onClose={closeRelationshipDraft}
        />
      ) : null}
      {menu ? (
        <div
          className="paneCtxBackdrop"
          role="presentation"
          onMouseDown={dismissOverlays}
          onContextMenu={(e) => {
            e.preventDefault();
            closeMenu();
          }}
        >
          {menu.kind === "pane" ? (
            <div
              className="paneCtxMenu"
              role="menu"
              style={{ left: menu.cx, top: menu.cy }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="paneCtxItem"
                role="menuitem"
                onClick={() => {
                  window.dispatchEvent(
                    new CustomEvent("agentsdraw:open-add-element", {
                      detail: { x: menu.fx, y: menu.fy },
                    })
                  );
                  closeMenu();
                }}
              >
                <span className="paneCtxIcon" aria-hidden>
                  <IconAddNewElement />
                </span>
                Add New Element…
              </button>
              <div className="paneCtxSep" role="separator" />
              <button type="button" className="paneCtxItem" role="menuitem" disabled>
                <span className="paneCtxIcon" aria-hidden>
                  <IconPaste />
                </span>
                Paste Here
              </button>
              <div className="paneCtxSep" role="separator" />
              <button type="button" className="paneCtxItem" role="menuitem" onClick={handleSelectAll}>
                <span className="paneCtxIcon" aria-hidden>
                  <IconSelectAll />
                </span>
                Select All
              </button>
              <div className="paneCtxSep" role="separator" />
              <button type="button" className="paneCtxItem" role="menuitem" onClick={handleZoomIn}>
                <span className="paneCtxIcon" aria-hidden>
                  <IconZoomIn />
                </span>
                Zoom In
              </button>
              <button type="button" className="paneCtxItem" role="menuitem" onClick={handleZoomOut}>
                <span className="paneCtxIcon" aria-hidden>
                  <IconZoomOut />
                </span>
                Zoom Out
              </button>
              <button type="button" className="paneCtxItem" role="menuitem" onClick={handleZoomTo100}>
                <span className="paneCtxIcon" aria-hidden>
                  <IconZoom100 />
                </span>
                Zoom to 100%
              </button>
            </div>
          ) : (
            <NodeContextMenu x={menu.cx} y={menu.cy} nodeId={menu.nodeId} onClose={closeMenu} />
          )}
        </div>
      ) : null}
    </div>
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
  const removeNode = useDocument((s) => s.removeNode);
  const addNode = useDocument((s) => s.addNode);
  const setEditingNodeId = useDocument((s) => s.setEditingNodeId);

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
    await navigator.clipboard.writeText(serializeNodeForClip(rec));
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
      { focusLabel: false }
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
      d.nodes.filter((n) => n.styleId === src.styleId && shapeEqual(n.shape, src.shape)).map((n) => n.id)
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
      className="paneCtxMenu"
      role="menu"
      style={{ left: x, top: y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button type="button" className="paneCtxItem" role="menuitem" disabled title="Coming soon">
        <span className="paneCtxIcon" aria-hidden>
          <IconSetType />
        </span>
        Set Type…
      </button>
      <button type="button" className="paneCtxItem" role="menuitem" disabled title="Coming soon">
        <span className="paneCtxIcon" aria-hidden>
          <IconRevealPalette />
        </span>
        Reveal Type in Palette…
      </button>
      <div className="paneCtxSep" role="separator" />
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleEditCaption}>
        <span className="paneCtxIcon" aria-hidden>
          <IconEditCaption />
        </span>
        Edit Caption
      </button>
      <div className="paneCtxSep" role="separator" />
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleCut}>
        <span className="paneCtxIcon" aria-hidden>
          <IconCut />
        </span>
        Cut
      </button>
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleCopy}>
        <span className="paneCtxIcon" aria-hidden>
          <IconCopy />
        </span>
        Copy
      </button>
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleDuplicate}>
        <span className="paneCtxIcon" aria-hidden>
          <IconDuplicate />
        </span>
        Duplicate
      </button>
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleDelete}>
        <span className="paneCtxIcon" aria-hidden>
          <IconTrash />
        </span>
        Delete
      </button>
      <div className="paneCtxSep" role="separator" />
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleSelectAll}>
        <span className="paneCtxIcon" aria-hidden>
          <IconSelectAllNode />
        </span>
        Select All
      </button>
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleSelectConnected}>
        <span className="paneCtxIcon" aria-hidden>
          <IconSelectConnected />
        </span>
        Select Connected Objects
      </button>
      <button type="button" className="paneCtxItem" role="menuitem" onClick={handleSelectSameType}>
        <span className="paneCtxIcon" aria-hidden>
          <IconSelectSameType />
        </span>
        Select Elements of Same Type
      </button>
    </div>
  );
}

const NodeContextMenu = memo(NodeContextMenuInner);

function IconAddNewElement() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.25" y="2.25" width="11.5" height="11.5" rx="1.75" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function IconPaste() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="4.5" y="2.5" width="7" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.2" />
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
      <path d="M6.75 5v3.5M5 6.75h3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
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
      <text x="6.75" y="8.35" textAnchor="middle" fontSize="5.5" fill="currentColor" fontWeight="600" fontFamily="system-ui, sans-serif">
        1
      </text>
    </svg>
  );
}

function IconSetType() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="3" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.25" />
    </svg>
  );
}

function IconRevealPalette() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2.5" y="2.5" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" />
      <rect x="8.5" y="2.5" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" />
      <rect x="2.5" y="8.5" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" />
      <rect x="8.5" y="8.5" width="5" height="5" rx="0.75" stroke="currentColor" strokeWidth="1.1" />
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
      <path d="M6.5 6.5l7 7M9.5 9.5l-7-7" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

function IconCopy() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="5" y="5" width="8" height="9" rx="1" stroke="currentColor" strokeWidth="1.15" />
      <path d="M4.5 11V4.5a1 1 0 011-1H11" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

function IconDuplicate() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="4.5" y="5.5" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.1" />
      <path d="M3.5 10.5V4.5a1 1 0 011-1h6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M10 3.5h2.5a1 1 0 011 1V7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 4.5h9M6 4.5V3.5h4V4.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
      <path d="M5 4.5v8a1 1 0 001 1h4a1 1 0 001-1v-8" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" />
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
