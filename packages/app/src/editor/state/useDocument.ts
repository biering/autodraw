import {
  applyRelationshipPreset,
  defaultStyleId,
  emptyDiagram,
  parseDiagram,
  type DiagramV1,
  type EdgeRecord,
  type NodeRecord,
  type PalettePreset,
} from "@agentsdraw/core";
import { temporal } from "zundo";
import { create } from "zustand";

/** Upper bound for canvas zoom (toolbar + React Flow viewport). */
export const MAX_VIEW_ZOOM = 1.5;

export type EditorMode = "node" | "edge";

export type AppState = {
  diagram: DiagramV1;
  filePath: string | null;
  dirty: boolean;
  selection: { nodeIds: string[]; edgeIds: string[] };
  editorMode: EditorMode;
  zoom: number;
  showNewDocSheet: boolean;
  showExportSheet: boolean;
  pendingEdgeSource: string | null;
  pendingRelationshipPreset: number | null;
  editingNodeId: string | null;
  setDiagram: (d: DiagramV1, opts?: { filePath?: string | null; dirty?: boolean }) => void;
  setFilePath: (p: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setSelection: (nodeIds: string[], edgeIds?: string[]) => void;
  setEditorMode: (m: EditorMode) => void;
  setZoom: (z: number) => void;
  setShowNewDocSheet: (v: boolean) => void;
  setShowExportSheet: (v: boolean) => void;
  setPendingEdgeSource: (id: string | null) => void;
  setPendingRelationshipPreset: (n: number | null) => void;
  setEditingNodeId: (id: string | null) => void;
  newDocument: (palette: PalettePreset) => void;
  loadPaletteFrom: (source: DiagramV1) => void;
  addNode: (
    n: Omit<NodeRecord, "id"> & { id?: string },
    opts?: { focusLabel?: boolean }
  ) => string;
  updateNode: (id: string, patch: Partial<NodeRecord>) => void;
  removeNode: (id: string) => void;
  addEdge: (e: Omit<EdgeRecord, "id"> & { id?: string }) => string;
  updateEdge: (id: string, patch: Partial<EdgeRecord>) => void;
  removeEdge: (id: string) => void;
};

const initial = (): Omit<
  AppState,
  | "setDiagram"
  | "setFilePath"
  | "markDirty"
  | "markClean"
  | "setSelection"
  | "setEditorMode"
  | "setZoom"
  | "setShowNewDocSheet"
  | "setShowExportSheet"
  | "setPendingEdgeSource"
  | "setPendingRelationshipPreset"
  | "setEditingNodeId"
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
  selection: { nodeIds: [], edgeIds: [] },
  editorMode: "node",
  zoom: 1,
  showNewDocSheet: true,
  showExportSheet: false,
  pendingEdgeSource: null,
  pendingRelationshipPreset: null,
  editingNodeId: null,
});

export const useDocument = create<AppState>()(
  temporal(
    (set, get) => ({
        ...initial(),
        setDiagram: (d, opts) =>
          set({
            diagram: d,
            filePath: opts?.filePath ?? get().filePath,
            dirty: opts?.dirty ?? false,
          }),
        setFilePath: (p) => set({ filePath: p }),
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
        setEditorMode: (m) => set({ editorMode: m }),
        setZoom: (z) => set({ zoom: Math.min(MAX_VIEW_ZOOM, z) }),
        setShowNewDocSheet: (v) => set({ showNewDocSheet: v }),
        setShowExportSheet: (v) => set({ showExportSheet: v }),
        setPendingEdgeSource: (id) => set({ pendingEdgeSource: id }),
        setPendingRelationshipPreset: (n) => set({ pendingRelationshipPreset: n }),
        setEditingNodeId: (id) => set({ editingNodeId: id }),
        newDocument: (palette) =>
          set({
            ...initial(),
            diagram: emptyDiagram(palette),
            showNewDocSheet: false,
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
          set((s) => ({
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
          })),
        addEdge: (e) => {
          const id = e.id ?? crypto.randomUUID();
          const preset = e.relationshipPreset ?? 1;
          const style = applyRelationshipPreset(preset);
          const edge: EdgeRecord = {
            id,
            from: e.from,
            to: e.to,
            routing: style.routing,
            dash: style.dash,
            head: style.head,
            tail: style.tail,
            label: e.label ?? "",
            strokeWidth: style.strokeWidth,
            relationshipPreset: style.relationshipPreset,
          };
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
            selection: { nodeIds: s.selection.nodeIds, edgeIds: s.selection.edgeIds.filter((x) => x !== id) },
          })),
      }),
    {
      limit: 200,
      partialize: (s) => ({ diagram: s.diagram }),
    }
  )
);

export function undoDocument(): void {
  useDocument.temporal.getState().undo();
}

export function redoDocument(): void {
  useDocument.temporal.getState().redo();
}

export { defaultStyleId, parseDiagram, emptyDiagram };
