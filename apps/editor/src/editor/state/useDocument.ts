import {
  defaultStyleId,
  emptyDiagram,
  normalizeDiagramName,
  parseDiagram,
  type DiagramV1,
  type EdgeHead,
  type EdgeRecord,
  type NodeRecord,
  type PalettePreset,
} from "@autodraw/core";
import { temporal } from "zundo";
import { create } from "zustand";
import { normalizeDiagramConnectionHandle } from "../canvas/flowAdapter";

/** Upper bound for canvas zoom (toolbar + React Flow viewport). */
export const MAX_VIEW_ZOOM = 1.5;

const CANVAS_THEME_STORAGE_KEY = "autodraw:canvasTheme";
const LEGACY_CANVAS_THEME_STORAGE_KEY = "agentsdraw:canvasTheme";

export type CanvasTheme = "light" | "dark";

function readStoredCanvasTheme(): CanvasTheme {
  if (typeof window === "undefined") return "light";
  try {
    const ls = window.localStorage;
    if (ls == null || typeof ls.getItem !== "function") return "light";
    let raw = ls.getItem(CANVAS_THEME_STORAGE_KEY);
    if (raw !== "dark" && raw !== "light") {
      const legacy = ls.getItem(LEGACY_CANVAS_THEME_STORAGE_KEY);
      if (legacy === "dark" || legacy === "light") {
        raw = legacy;
        try {
          ls.setItem(CANVAS_THEME_STORAGE_KEY, legacy);
          ls.removeItem(LEGACY_CANVAS_THEME_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }
    return raw === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

/** Transient UI: user is picking a relationship preset after drawing a link between two nodes. */
export type RelationshipDraft = {
  source: string;
  target: string;
  /** React Flow source handle id (`src` | `src-top` | `src-bottom`). */
  sourceHandle?: string | null;
  /** React Flow target handle id (`tgt` | `tgt-top` | `tgt-bottom`). */
  targetHandle?: string | null;
};

export type AppState = {
  diagram: DiagramV1;
  filePath: string | null;
  dirty: boolean;
  canvasTheme: CanvasTheme;
  selection: { nodeIds: string[]; edgeIds: string[] };
  zoom: number;
  /** In-app welcome sheet (open vs new); not used on cold start — use File ▸ Open Diagram. */
  showWelcomeGate: boolean;
  showExportSheet: boolean;
  pendingEdgeSource: string | null;
  editingNodeId: string | null;
  /** Bottom inspector: new edge flow (pick start/end markers to create the edge). */
  relationshipDraft: RelationshipDraft | null;
  setDiagram: (d: DiagramV1, opts?: { filePath?: string | null; dirty?: boolean }) => void;
  setDiagramName: (name: string) => void;
  setFilePath: (p: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setSelection: (nodeIds: string[], edgeIds?: string[]) => void;
  setZoom: (z: number) => void;
  setShowWelcomeGate: (v: boolean) => void;
  setShowExportSheet: (v: boolean) => void;
  setCanvasTheme: (t: CanvasTheme) => void;
  setPendingEdgeSource: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  setRelationshipDraft: (d: RelationshipDraft | null) => void;
  commitRelationshipDraft: (markers: { head: EdgeHead; tail: EdgeHead }) => void;
  newDocument: (palette: PalettePreset) => void;
  loadPaletteFrom: (source: DiagramV1) => void;
  addNode: (n: Omit<NodeRecord, "id"> & { id?: string }, opts?: { focusLabel?: boolean }) => string;
  updateNode: (id: string, patch: Partial<NodeRecord>) => void;
  removeNode: (id: string) => void;
  addEdge: (
    e: Pick<EdgeRecord, "from" | "to"> &
      Partial<Omit<EdgeRecord, "id" | "from" | "to">> & { id?: string },
  ) => string;
  updateEdge: (id: string, patch: Partial<EdgeRecord>) => void;
  removeEdge: (id: string) => void;
};

const initial = (): Omit<
  AppState,
  | "setDiagram"
  | "setDiagramName"
  | "setFilePath"
  | "markDirty"
  | "markClean"
  | "setSelection"
  | "setZoom"
  | "setShowWelcomeGate"
  | "setShowExportSheet"
  | "setCanvasTheme"
  | "setPendingEdgeSource"
  | "setEditingNodeId"
  | "setRelationshipDraft"
  | "commitRelationshipDraft"
  | "newDocument"
  | "loadPaletteFrom"
  | "addNode"
  | "updateNode"
  | "removeNode"
  | "addEdge"
  | "updateEdge"
  | "removeEdge"
> => ({
  diagram: emptyDiagram("universal"),
  filePath: null,
  dirty: false,
  canvasTheme: readStoredCanvasTheme(),
  selection: { nodeIds: [], edgeIds: [] },
  zoom: 1,
  showWelcomeGate: false,
  showExportSheet: false,
  pendingEdgeSource: null,
  editingNodeId: null,
  relationshipDraft: null,
});

export const useDocument = create<AppState>()(
  temporal(
    (set, get) => ({
      ...initial(),
      setDiagram: (d, opts) => {
        const nextPath = opts?.filePath ?? get().filePath;
        set({
          diagram: d,
          filePath: nextPath,
          dirty: opts?.dirty ?? false,
          ...(typeof nextPath === "string" && nextPath.length > 0
            ? { showWelcomeGate: false }
            : {}),
        });
      },
      setDiagramName: (raw) =>
        set((s) => {
          const name = normalizeDiagramName(raw);
          if (name === s.diagram.name) return s;
          return {
            diagram: { ...s.diagram, name },
            dirty: true,
          };
        }),
      setFilePath: (p) =>
        set({
          filePath: p,
          ...(p != null && p !== "" ? { showWelcomeGate: false } : {}),
        }),
      markDirty: () => set({ dirty: true }),
      markClean: () => set({ dirty: false }),
      setSelection: (nodeIds, edgeIds = []) => {
        const prev = get().selection;
        const sameNodes =
          prev.nodeIds.length === nodeIds.length &&
          prev.nodeIds.every((id, i) => id === nodeIds[i]);
        const sameEdges =
          prev.edgeIds.length === edgeIds.length &&
          prev.edgeIds.every((id, i) => id === edgeIds[i]);
        if (sameNodes && sameEdges) return;
        set({
          selection: {
            nodeIds: sameNodes ? prev.nodeIds : nodeIds,
            edgeIds: sameEdges ? prev.edgeIds : edgeIds,
          },
        });
      },
      setZoom: (z) => set({ zoom: Math.min(MAX_VIEW_ZOOM, z) }),
      setShowWelcomeGate: (v) => set({ showWelcomeGate: v }),
      setShowExportSheet: (v) => set({ showExportSheet: v }),
      setCanvasTheme: (canvasTheme) => {
        if (typeof window !== "undefined") {
          try {
            const ls = window.localStorage;
            if (ls != null && typeof ls.setItem === "function") {
              ls.setItem(CANVAS_THEME_STORAGE_KEY, canvasTheme);
              try {
                ls.removeItem(LEGACY_CANVAS_THEME_STORAGE_KEY);
              } catch {
                /* ignore */
              }
            }
          } catch {
            /* ignore quota / private mode */
          }
        }
        set({ canvasTheme });
      },
      setPendingEdgeSource: (id) => set({ pendingEdgeSource: id }),
      setEditingNodeId: (id) => set({ editingNodeId: id }),
      setRelationshipDraft: (d) => set({ relationshipDraft: d }),
      commitRelationshipDraft: ({ head, tail }) => {
        const d = get().relationshipDraft;
        if (!d?.source || !d?.target) return;
        get().addEdge({
          from: d.source,
          to: d.target,
          label: "",
          head,
          tail,
          sourceHandle: d.sourceHandle ?? undefined,
          targetHandle: d.targetHandle ?? undefined,
        });
        set({ relationshipDraft: null });
      },
      newDocument: (palette) =>
        set({
          ...initial(),
          diagram: emptyDiagram(palette),
          showWelcomeGate: false,
          dirty: false,
          filePath: null,
        }),
      loadPaletteFrom: (source) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
            palette: source.palette,
            customStyles: source.customStyles ?? [],
          },
          dirty: true,
        })),
      addNode: (n, opts) => {
        const id = n.id ?? crypto.randomUUID();
        const node: NodeRecord = {
          id,
          text: n.text,
          x: n.x,
          y: n.y,
          w: n.w,
          h: n.h,
          styleId: n.styleId,
          shape: n.shape,
        };
        const focusLabel = opts?.focusLabel !== false;
        set((s) => ({
          diagram: { ...s.diagram, nodes: [...s.diagram.nodes, node] },
          dirty: true,
          ...(focusLabel ? { editingNodeId: id } : {}),
        }));
        return id;
      },
      updateNode: (id, patch) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
            nodes: s.diagram.nodes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
          dirty: true,
        })),
      removeNode: (id) =>
        set((s) => {
          const rd = s.relationshipDraft;
          const dropDraft =
            rd && (rd.source === id || rd.target === id) ? { relationshipDraft: null } : {};
          return {
            diagram: {
              ...s.diagram,
              nodes: s.diagram.nodes.filter((x) => x.id !== id),
              edges: s.diagram.edges.filter((e) => e.from !== id && e.to !== id),
            },
            dirty: true,
            selection: {
              nodeIds: s.selection.nodeIds.filter((x) => x !== id),
              edgeIds: s.selection.edgeIds,
            },
            editingNodeId: s.editingNodeId === id ? null : s.editingNodeId,
            ...dropDraft,
          };
        }),
      addEdge: (e) => {
        const id = e.id ?? crypto.randomUUID();
        const edge: EdgeRecord = {
          id,
          from: e.from,
          to: e.to,
          routing: e.routing ?? "orthogonal",
          dash: e.dash ?? "solid",
          head: e.head ?? "lineArrow",
          tail: e.tail ?? "none",
          label: e.label ?? "",
          strokeWidth: e.strokeWidth ?? 1,
        };
        const sh = normalizeDiagramConnectionHandle(e.sourceHandle, "source");
        if (sh != null) edge.sourceHandle = sh;
        const th = normalizeDiagramConnectionHandle(e.targetHandle, "target");
        if (th != null) edge.targetHandle = th;
        set((s) => ({
          diagram: { ...s.diagram, edges: [...s.diagram.edges, edge] },
          dirty: true,
        }));
        return id;
      },
      updateEdge: (id, patch) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
            edges: s.diagram.edges.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
          dirty: true,
        })),
      removeEdge: (id) =>
        set((s) => ({
          diagram: { ...s.diagram, edges: s.diagram.edges.filter((x) => x.id !== id) },
          dirty: true,
          selection: {
            nodeIds: s.selection.nodeIds,
            edgeIds: s.selection.edgeIds.filter((x) => x !== id),
          },
        })),
    }),
    {
      limit: 200,
      partialize: (s) => ({ diagram: s.diagram }),
    },
  ),
);

export function undoDocument(): void {
  useDocument.temporal.getState().undo();
}

export function redoDocument(): void {
  useDocument.temporal.getState().redo();
}

export { defaultStyleId, parseDiagram, emptyDiagram };
