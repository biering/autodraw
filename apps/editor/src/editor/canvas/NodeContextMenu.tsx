"use client";

import {
  type DiagramV1,
  type NodeRecord,
  type NodeShape,
  resolvedNodeBodyFillRgba,
  resolvedNodeBodyStrokeRgba,
  styleById,
} from "@autodraw/core";
import { useReactFlow } from "@xyflow/react";
import {
  BoxSelect,
  Copy,
  CopyPlus,
  FolderOutput,
  Layers,
  Link2,
  Lock,
  LockOpen,
  Network,
  Pencil,
  Scissors,
  Trash2,
} from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { DropdownMenuItem, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { writeClipboardText } from "../../platform/clipboard";
import { creationMenuColors, creationMenuShapes } from "../creationMenuCatalog";
import { serializeNodeForClip } from "../nodeClipboard";
import { useDocument } from "../state/useDocument";
import { CanvasContextMenuShell } from "./CanvasContextMenuShell";
import { type ColorChoice, ColorChoiceSubmenu, ShapeChoiceSubmenu } from "./ContextMenuChoices";

type NodeContextMenuProps = {
  cx: number;
  cy: number;
  nodeId: string;
  onClose: () => void;
};

function nodeEffectiveShape(diagram: DiagramV1, node: NodeRecord | undefined): NodeShape {
  if (!node) return "roundedRect";
  return node.shape ?? styleById(diagram, node.styleId)?.shape ?? "roundedRect";
}

function shapeEqual(a: NodeRecord["shape"], b: NodeRecord["shape"]): boolean {
  return (a ?? null) === (b ?? null);
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

function NodeContextMenuInner({ cx, cy, nodeId, onClose }: NodeContextMenuProps) {
  const rf = useReactFlow();
  const diagram = useDocument(useShallow((s) => s.diagram));
  const node = useDocument((s) => s.diagram.nodes.find((n) => n.id === nodeId));
  const updateNode = useDocument((s) => s.updateNode);
  const removeNode = useDocument((s) => s.removeNode);
  const addNode = useDocument((s) => s.addNode);
  const setEditingNodeId = useDocument((s) => s.setEditingNodeId);

  const colorOptions = useMemo<ColorChoice[]>(
    () =>
      creationMenuColors(diagram).map((s) => ({
        id: s.id,
        // Style ids are short tokens like "yellow"/"gray"; keep the token as the human label
        // (capitalised) so the menu reads naturally without invented mappings.
        label: s.id.charAt(0).toUpperCase() + s.id.slice(1),
        fill: resolvedNodeBodyFillRgba(s, s.id),
        stroke: resolvedNodeBodyStrokeRgba(s),
      })),
    [diagram],
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

  const handleEditLink = useCallback(() => {
    const rec = getRecord();
    if (!rec) return;
    const cur = rec.link ?? "";
    // SES-hardened browser extensions can throw `null` from window.prompt; guard with try/catch
    // and treat null returns as cancellation.
    let url: string | null = null;
    try {
      url = window.prompt("Element link URL (https://…). Leave empty to clear.", cur);
    } catch {
      onClose();
      return;
    }
    if (url === null) return;
    const t = url.trim();
    if (t === "") {
      updateNode(nodeId, { link: undefined });
    } else {
      try {
        new URL(t);
        updateNode(nodeId, { link: t });
      } catch {
        try {
          window.alert("Invalid URL");
        } catch {
          /* ignore */
        }
        return;
      }
    }
    onClose();
  }, [getRecord, nodeId, updateNode, onClose]);

  const handleToggleLock = useCallback(() => {
    const rec = getRecord();
    if (!rec) return;
    updateNode(nodeId, { locked: rec.locked === true ? undefined : true });
    onClose();
  }, [getRecord, nodeId, updateNode, onClose]);

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

  const handleRemoveFromGroup = useCallback(() => {
    const rec = getRecord();
    if (!rec?.parentId) return;
    const frame = diagram.frames.find((f) => f.id === rec.parentId);
    const px = frame?.x ?? 0;
    const py = frame?.y ?? 0;
    updateNode(nodeId, {
      parentId: undefined,
      x: Math.round(rec.x + px),
      y: Math.round(rec.y + py),
    });
    onClose();
  }, [diagram.frames, getRecord, nodeId, onClose, updateNode]);

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

  const isLocked = node?.locked === true;
  const inGroup = node?.parentId != null;

  return (
    <CanvasContextMenuShell cx={cx} cy={cy} onClose={onClose} className="min-w-[14rem]">
      <ColorChoiceSubmenu
        triggerLabel="Color"
        options={colorOptions}
        activeId={node?.styleId ?? ""}
        onSelect={setColor}
      />
      <ShapeChoiceSubmenu
        triggerLabel="Shape"
        shapes={creationMenuShapes()}
        activeShape={effectiveShape}
        onSelect={setShape}
      />
      <DropdownMenuSeparator />
      {inGroup ? (
        <DropdownMenuItem onSelect={handleRemoveFromGroup}>
          <FolderOutput className="h-4 w-4 shrink-0" aria-hidden />
          Remove from group
        </DropdownMenuItem>
      ) : null}
      <DropdownMenuItem onSelect={handleEditCaption}>
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        Edit Caption
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleEditLink}>
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        Edit link…
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleToggleLock}>
        {isLocked ? (
          <LockOpen className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {isLocked ? "Unlock" : "Lock"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={handleCut}>
        <Scissors className="h-4 w-4 shrink-0" aria-hidden />
        Cut
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleCopy}>
        <Copy className="h-4 w-4 shrink-0" aria-hidden />
        Copy
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleDuplicate}>
        <CopyPlus className="h-4 w-4 shrink-0" aria-hidden />
        Duplicate
      </DropdownMenuItem>
      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleDelete}>
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Delete
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={handleSelectAll}>
        <BoxSelect className="h-4 w-4 shrink-0" aria-hidden />
        Select All
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleSelectConnected}>
        <Network className="h-4 w-4 shrink-0" aria-hidden />
        Select Connected Objects
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleSelectSameType}>
        <Layers className="h-4 w-4 shrink-0" aria-hidden />
        Select Elements of Same Type
      </DropdownMenuItem>
    </CanvasContextMenuShell>
  );
}

export const NodeContextMenu = memo(NodeContextMenuInner);
