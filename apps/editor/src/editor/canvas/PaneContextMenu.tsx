"use client";

import {
  BoxSelect,
  ClipboardPaste,
  Frame,
  Plus,
  ScanLine,
  Type,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { memo, useCallback } from "react";
import { DropdownMenuItem, DropdownMenuSeparator } from "../../components/ui/dropdown-menu";
import { useDocument } from "../state/useDocument";
import { CanvasContextMenuShell } from "./CanvasContextMenuShell";

type PaneContextMenuProps = {
  cx: number;
  cy: number;
  /** Flow-space coordinates of the right-click point — used by "Add" actions and Paste. */
  fx: number;
  fy: number;
  onAddElement: (flow: { x: number; y: number }) => void;
  onPasteHere: (flow: { x: number; y: number }) => void;
  onSelectAll: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomTo100: () => void;
  onClose: () => void;
};

function PaneContextMenuInner({
  cx,
  cy,
  fx,
  fy,
  onAddElement,
  onPasteHere,
  onSelectAll,
  onZoomIn,
  onZoomOut,
  onZoomTo100,
  onClose,
}: PaneContextMenuProps) {
  const addTextLabel = useDocument((s) => s.addTextLabel);
  const addFrame = useDocument((s) => s.addFrame);

  const handleAddTextLabel = useCallback(() => {
    addTextLabel({ text: "Label", x: Math.round(fx), y: Math.round(fy) });
    onClose();
  }, [addTextLabel, fx, fy, onClose]);

  const handleAddFrame = useCallback(() => {
    // Avoid `window.prompt` (SES-hardened extensions sometimes throw `null`); rename via dbl-click.
    addFrame({ x: Math.round(fx - 160), y: Math.round(fy - 100), w: 320, h: 200 });
    onClose();
  }, [addFrame, fx, fy, onClose]);

  return (
    <CanvasContextMenuShell cx={cx} cy={cy} onClose={onClose} className="min-w-[14rem]">
      <DropdownMenuItem
        onSelect={() => {
          onAddElement({ x: fx, y: fy });
          onClose();
        }}
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        Add New Element…
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleAddTextLabel}>
        <Type className="h-4 w-4 shrink-0" aria-hidden />
        Add text label
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleAddFrame}>
        <Frame className="h-4 w-4 shrink-0" aria-hidden />
        Add frame
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          onPasteHere({ x: fx, y: fy });
          onClose();
        }}
      >
        <ClipboardPaste className="h-4 w-4 shrink-0" aria-hidden />
        Paste Here
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          onSelectAll();
          onClose();
        }}
      >
        <BoxSelect className="h-4 w-4 shrink-0" aria-hidden />
        Select All
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onSelect={() => {
          onZoomIn();
          onClose();
        }}
      >
        <ZoomIn className="h-4 w-4 shrink-0" aria-hidden />
        Zoom In
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          onZoomOut();
          onClose();
        }}
      >
        <ZoomOut className="h-4 w-4 shrink-0" aria-hidden />
        Zoom Out
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={() => {
          onZoomTo100();
          onClose();
        }}
      >
        <ScanLine className="h-4 w-4 shrink-0" aria-hidden />
        Zoom to 100%
      </DropdownMenuItem>
    </CanvasContextMenuShell>
  );
}

export const PaneContextMenu = memo(PaneContextMenuInner);
