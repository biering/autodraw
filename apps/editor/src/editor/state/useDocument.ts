import {
  type DiagramV1,
  defaultStyleId,
  type EdgeHead,
  type EdgeRecord,
  emptyDiagram,
  type FrameRecord,
  type ImageRecord,
  type NodeRecord,
  normalizeDiagramName,
  parseDiagram,
  type TextLabelRecord,
} from "@autodraw/core";
import { temporal } from "zundo";
import { create } from "zustand";
import { normalizeDiagramConnectionHandle, withPaddedFrames } from "../canvas/flowAdapter";

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
  showExportSheet: boolean;
  pendingEdgeSource: string | null;
  editingNodeId: string | null;
  /** Frame id whose title is being edited inline (React Flow frame node). */
  editingFrameId: string | null;
  /** Bottom inspector: new edge flow (pick start/end markers to create the edge). */
  relationshipDraft: RelationshipDraft | null;
  setDiagram: (d: DiagramV1, opts?: { filePath?: string | null; dirty?: boolean }) => void;
  setDiagramName: (name: string) => void;
  setFilePath: (p: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  setSelection: (nodeIds: string[], edgeIds?: string[]) => void;
  setZoom: (z: number) => void;
  setShowExportSheet: (v: boolean) => void;
  setCanvasTheme: (t: CanvasTheme) => void;
  setPendingEdgeSource: (id: string | null) => void;
  setEditingNodeId: (id: string | null) => void;
  setEditingFrameId: (id: string | null) => void;
  setRelationshipDraft: (d: RelationshipDraft | null) => void;
  commitRelationshipDraft: (markers: { head: EdgeHead; tail: EdgeHead }) => void;
  newDocument: () => void;
  loadStylesFrom: (source: DiagramV1) => void;
  addNode: (n: Omit<NodeRecord, "id"> & { id?: string }, opts?: { focusLabel?: boolean }) => string;
  updateNode: (id: string, patch: Partial<NodeRecord>) => void;
  removeNode: (id: string) => void;
  /** Removes a diagram node, frame, image, or text label by React Flow id. */
  removeElementById: (id: string) => void;
  addTextLabel: (t: Omit<TextLabelRecord, "id"> & { id?: string }) => string;
  updateTextLabel: (id: string, patch: Partial<TextLabelRecord>) => void;
  addFrame: (f: Omit<FrameRecord, "id"> & { id?: string }) => string;
  updateFrame: (id: string, patch: Partial<FrameRecord>) => void;
  addImage: (i: Omit<ImageRecord, "id"> & { id?: string }) => string;
  updateImage: (id: string, patch: Partial<ImageRecord>) => void;
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
  | "setShowExportSheet"
  | "setCanvasTheme"
  | "setPendingEdgeSource"
  | "setEditingNodeId"
  | "setEditingFrameId"
  | "setRelationshipDraft"
  | "commitRelationshipDraft"
  | "newDocument"
  | "loadStylesFrom"
  | "addNode"
  | "updateNode"
  | "removeNode"
  | "removeElementById"
  | "addTextLabel"
  | "updateTextLabel"
  | "addFrame"
  | "updateFrame"
  | "addImage"
  | "updateImage"
  | "addEdge"
  | "updateEdge"
  | "removeEdge"
> => ({
  diagram: emptyDiagram(),
  filePath: null,
  dirty: false,
  canvasTheme: readStoredCanvasTheme(),
  selection: { nodeIds: [], edgeIds: [] },
  zoom: 1,
  showExportSheet: false,
  pendingEdgeSource: null,
  editingNodeId: null,
  editingFrameId: null,
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
          editingFrameId: null,
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
      setZoom: (z) => set({ zoom: Math.min(MAX_VIEW_ZOOM, z) }),
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
      setEditingFrameId: (id) => set({ editingFrameId: id }),
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
      newDocument: () =>
        set({
          ...initial(),
          diagram: emptyDiagram(),
          dirty: false,
          filePath: null,
        }),
      loadStylesFrom: (source) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
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
          ...(n.link !== undefined ? { link: n.link } : {}),
          ...(n.locked !== undefined ? { locked: n.locked } : {}),
          ...(n.parentId !== undefined ? { parentId: n.parentId } : {}),
        };
        const focusLabel = opts?.focusLabel !== false;
        set((s) => ({
          diagram: withPaddedFrames({ ...s.diagram, nodes: [...s.diagram.nodes, node] }),
          dirty: true,
          ...(focusLabel ? { editingNodeId: id } : {}),
        }));
        return id;
      },
      updateNode: (id, patch) =>
        set((s) => ({
          diagram: withPaddedFrames({
            ...s.diagram,
            nodes: s.diagram.nodes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          }),
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
      removeElementById: (id) =>
        set((s) => {
          if (s.diagram.nodes.some((n) => n.id === id)) {
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
          }
          if (s.diagram.edges.some((e) => e.id === id)) {
            return {
              diagram: { ...s.diagram, edges: s.diagram.edges.filter((x) => x.id !== id) },
              dirty: true,
              selection: {
                nodeIds: s.selection.nodeIds,
                edgeIds: s.selection.edgeIds.filter((x) => x !== id),
              },
            };
          }
          if (s.diagram.frames.some((f) => f.id === id)) {
            // Detach children: promote their relative coords to absolute and clear parentId so the
            // visual position stays stable when the frame is removed.
            const parent = s.diagram.frames.find((f) => f.id === id);
            const px = parent?.x ?? 0;
            const py = parent?.y ?? 0;
            return {
              diagram: {
                ...s.diagram,
                frames: s.diagram.frames.filter((f) => f.id !== id),
                nodes: s.diagram.nodes.map((n) => {
                  if (n.parentId !== id) return n;
                  const { parentId: _drop, ...rest } = n;
                  return { ...rest, x: n.x + px, y: n.y + py };
                }),
              },
              dirty: true,
              selection: {
                nodeIds: s.selection.nodeIds.filter((x) => x !== id),
                edgeIds: s.selection.edgeIds,
              },
            };
          }
          if (s.diagram.images.some((im) => im.id === id)) {
            return {
              diagram: { ...s.diagram, images: s.diagram.images.filter((im) => im.id !== id) },
              dirty: true,
              selection: {
                nodeIds: s.selection.nodeIds.filter((x) => x !== id),
                edgeIds: s.selection.edgeIds,
              },
            };
          }
          if (s.diagram.textLabels.some((t) => t.id === id)) {
            return {
              diagram: {
                ...s.diagram,
                textLabels: s.diagram.textLabels.filter((t) => t.id !== id),
              },
              dirty: true,
              selection: {
                nodeIds: s.selection.nodeIds.filter((x) => x !== id),
                edgeIds: s.selection.edgeIds,
              },
            };
          }
          return s;
        }),
      addTextLabel: (t) => {
        const id = t.id ?? crypto.randomUUID();
        const rec: TextLabelRecord = { id, x: t.x, y: t.y, text: t.text };
        set((s) => ({
          diagram: { ...s.diagram, textLabels: [...s.diagram.textLabels, rec] },
          dirty: true,
        }));
        return id;
      },
      updateTextLabel: (id, patch) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
            textLabels: s.diagram.textLabels.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
          dirty: true,
        })),
      addFrame: (f) => {
        const id = f.id ?? crypto.randomUUID();
        const rec: FrameRecord = {
          id,
          x: f.x,
          y: f.y,
          w: f.w,
          h: f.h,
          ...(f.name !== undefined ? { name: f.name } : {}),
          ...(f.color !== undefined ? { color: f.color } : {}),
        };
        set((s) => ({
          diagram: { ...s.diagram, frames: [...s.diagram.frames, rec] },
          dirty: true,
        }));
        return id;
      },
      updateFrame: (id, patch) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
            frames: s.diagram.frames.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
          dirty: true,
        })),
      addImage: (i) => {
        const id = i.id ?? crypto.randomUUID();
        const rec: ImageRecord = {
          id,
          src: i.src,
          x: i.x,
          y: i.y,
          w: i.w,
          h: i.h,
          ...(i.alt !== undefined ? { alt: i.alt } : {}),
        };
        set((s) => ({
          diagram: { ...s.diagram, images: [...s.diagram.images, rec] },
          dirty: true,
        }));
        return id;
      },
      updateImage: (id, patch) =>
        set((s) => ({
          diagram: {
            ...s.diagram,
            images: s.diagram.images.map((x) => (x.id === id ? { ...x, ...patch } : x)),
          },
          dirty: true,
        })),
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
          ...(e.relationshipPreset !== undefined
            ? { relationshipPreset: e.relationshipPreset }
            : {}),
          ...(e.link !== undefined ? { link: e.link } : {}),
          ...(e.locked !== undefined ? { locked: e.locked } : {}),
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
