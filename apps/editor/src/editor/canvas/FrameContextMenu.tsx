"use client";

import {
  defaultStyleId,
  FRAME_COLOR_OPTIONS,
  type FrameColor,
  frameColorSwatchHex,
} from "@autodraw/core";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { DropdownMenuItem, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { useDocument } from "../state/useDocument";
import { CanvasContextMenuShell } from "./CanvasContextMenuShell";
import { type ColorChoice, ColorChoiceSubmenu } from "./ContextMenuChoices";
import { nextChildRelativePlacement } from "./flowAdapter";

type FrameContextMenuProps = {
  cx: number;
  cy: number;
  frameId: string;
  onClose: () => void;
};

export function FrameContextMenu({ cx, cy, frameId, onClose }: FrameContextMenuProps) {
  const addNode = useDocument((s) => s.addNode);
  const updateFrame = useDocument((s) => s.updateFrame);
  const removeElementById = useDocument((s) => s.removeElementById);
  const setEditingFrameId = useDocument((s) => s.setEditingFrameId);
  const palette = useDocument((s) => s.diagram.palette);

  const frame = useDocument(useShallow((s) => s.diagram.frames.find((f) => f.id === frameId)));
  const currentColor = frame?.color;
  const activeColorId: FrameColor = currentColor ?? "gray";

  const handleAddNode = useCallback(() => {
    const d = useDocument.getState().diagram;
    const pos = nextChildRelativePlacement(d, frameId);
    addNode(
      {
        text: "Node",
        x: pos.x,
        y: pos.y,
        w: 140,
        h: 64,
        styleId: defaultStyleId(palette),
        shape: "roundedRect",
        parentId: frameId,
      },
      { focusLabel: true },
    );
    onClose();
  }, [addNode, frameId, onClose, palette]);

  const handleRename = useCallback(() => {
    setEditingFrameId(frameId);
    onClose();
  }, [frameId, onClose, setEditingFrameId]);

  const handleRemove = useCallback(() => {
    removeElementById(frameId);
    onClose();
  }, [frameId, onClose, removeElementById]);

  const handleColorSelect = useCallback(
    (id: string) => {
      // "gray" is the canonical default; strip the field on write so the schema stays canonical.
      const next = id as FrameColor;
      updateFrame(frameId, next === "gray" ? { color: undefined } : { color: next });
    },
    [frameId, updateFrame],
  );

  const colorOptions = useMemo<ColorChoice[]>(
    () =>
      FRAME_COLOR_OPTIONS.map((c) => ({
        id: c,
        label: c.charAt(0).toUpperCase() + c.slice(1),
        fill: frameColorSwatchHex(c),
      })),
    [],
  );

  return (
    <CanvasContextMenuShell cx={cx} cy={cy} onClose={onClose} className="min-w-[12rem]">
      <DropdownMenuItem onSelect={handleAddNode}>
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        Add node to area
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleRename}>
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        Rename
      </DropdownMenuItem>
      <ColorChoiceSubmenu
        triggerLabel="Colour"
        options={colorOptions}
        activeId={activeColorId}
        onSelect={handleColorSelect}
      />
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleRemove}>
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Remove Group
      </DropdownMenuItem>
    </CanvasContextMenuShell>
  );
}
