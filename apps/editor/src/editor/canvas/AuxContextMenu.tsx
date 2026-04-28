"use client";

import { Trash2 } from "lucide-react";
import { memo, useCallback } from "react";
import { DropdownMenuItem } from "../../components/ui/dropdown-menu";
import { useDocument } from "../state/useDocument";
import { CanvasContextMenuShell } from "./CanvasContextMenuShell";

type AuxContextMenuProps = {
  cx: number;
  cy: number;
  /** ID of the image or text-label record this menu acts on. */
  elementId: string;
  onClose: () => void;
};

/**
 * Compact "delete-only" menu shared by image and text-label nodes (frames have their own
 * richer `FrameContextMenu`). Lives on the same shadcn `DropdownMenu` shell as the other
 * context menus so all three look and feel identical.
 */
function AuxContextMenuInner({ cx, cy, elementId, onClose }: AuxContextMenuProps) {
  const removeElementById = useDocument((s) => s.removeElementById);
  const handleDelete = useCallback(() => {
    removeElementById(elementId);
    onClose();
  }, [removeElementById, elementId, onClose]);

  return (
    <CanvasContextMenuShell cx={cx} cy={cy} onClose={onClose} className="min-w-[12rem]">
      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleDelete}>
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Delete
      </DropdownMenuItem>
    </CanvasContextMenuShell>
  );
}

export const AuxContextMenu = memo(AuxContextMenuInner);
