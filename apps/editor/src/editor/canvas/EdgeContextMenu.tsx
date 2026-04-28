"use client";

import type { EdgeDash, EdgeRouting } from "@autodraw/core";
import { Link2, Lock, LockOpen, Trash2 } from "lucide-react";
import { memo, useCallback } from "react";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../components/ui/dropdown-menu";
import { cn } from "../../lib/utils";
import { useDocument } from "../state/useDocument";
import { CanvasContextMenuShell } from "./CanvasContextMenuShell";
import { EdgeMarkerSubMenu } from "./NewRelationshipPicker";

type EdgeContextMenuProps = {
  cx: number;
  cy: number;
  edgeId: string;
  onClose: () => void;
};

const TOGGLE_ROW = "grid grid-cols-3 gap-1 px-2 pb-2";

const TOGGLE =
  "rounded-md border border-border bg-background px-1.5 py-1.5 text-center text-[11px] font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function EdgeContextMenuInner({ cx, cy, edgeId, onClose }: EdgeContextMenuProps) {
  const removeEdge = useDocument((s) => s.removeEdge);
  const updateEdge = useDocument((s) => s.updateEdge);
  const edge = useDocument((s) => s.diagram.edges.find((e) => e.id === edgeId));

  const handleDelete = useCallback(() => {
    removeEdge(edgeId);
    onClose();
  }, [removeEdge, edgeId, onClose]);

  const handleEditLink = useCallback(() => {
    const curEdge = useDocument.getState().diagram.edges.find((e) => e.id === edgeId);
    if (!curEdge) return;
    const cur = curEdge.link ?? "";
    let url: string | null = null;
    try {
      url = window.prompt("Edge link URL (https://…). Leave empty to clear.", cur);
    } catch {
      onClose();
      return;
    }
    if (url === null) return;
    const t = url.trim();
    if (t === "") {
      updateEdge(edgeId, { link: undefined });
    } else {
      try {
        new URL(t);
        updateEdge(edgeId, { link: t });
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
  }, [edgeId, updateEdge, onClose]);

  const handleToggleLock = useCallback(() => {
    const curEdge = useDocument.getState().diagram.edges.find((e) => e.id === edgeId);
    if (!curEdge) return;
    updateEdge(edgeId, { locked: curEdge.locked === true ? undefined : true });
    onClose();
  }, [edgeId, updateEdge, onClose]);

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

  if (!edge) return null;

  const sw = edge.strokeWidth ?? 1;
  const weightKey: "thin" | "medium" | "bold" = sw <= 1.15 ? "thin" : sw >= 2.2 ? "bold" : "medium";
  const locked = edge.locked === true;

  return (
    <CanvasContextMenuShell cx={cx} cy={cy} onClose={onClose} className="min-w-[18rem]">
      <DropdownMenuItem onSelect={handleEditLink}>
        <Link2 className="h-4 w-4 shrink-0" aria-hidden />
        Edit link…
      </DropdownMenuItem>
      <DropdownMenuItem onSelect={handleToggleLock}>
        {locked ? (
          <LockOpen className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
        )}
        {locked ? "Unlock" : "Lock"}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <EdgeMarkerSubMenu
        role="start"
        value={edge.tail ?? "none"}
        onChange={(next) => updateEdge(edgeId, { tail: next, relationshipPreset: undefined })}
        label="Start marker"
        disabled={locked}
      />
      <EdgeMarkerSubMenu
        role="end"
        value={edge.head}
        onChange={(next) => updateEdge(edgeId, { head: next, relationshipPreset: undefined })}
        label="End marker"
        disabled={locked}
      />
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Path
      </DropdownMenuLabel>
      <div className={TOGGLE_ROW} onPointerDown={(e) => e.stopPropagation()}>
        {(["straight", "orthogonal", "curved"] as const).map((r) => (
          <button
            key={r}
            type="button"
            disabled={locked}
            className={cn(
              TOGGLE,
              edge.routing === r && "border-primary bg-accent",
              locked && "opacity-40",
            )}
            onClick={() => setRouting(r)}
          >
            {r === "straight" ? "Straight" : r === "orthogonal" ? "Right angle" : "Curved"}
          </button>
        ))}
      </div>
      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Line pattern
      </DropdownMenuLabel>
      <div className={TOGGLE_ROW} onPointerDown={(e) => e.stopPropagation()}>
        {(["solid", "dashed", "dotted"] as const).map((d) => (
          <button
            key={d}
            type="button"
            disabled={locked}
            className={cn(
              TOGGLE,
              edge.dash === d && "border-primary bg-accent",
              locked && "opacity-40",
            )}
            onClick={() => setDash(d)}
          >
            {d === "solid" ? "Solid" : d === "dashed" ? "Dashed" : "Dotted"}
          </button>
        ))}
      </div>
      <DropdownMenuLabel className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        Weight
      </DropdownMenuLabel>
      <div className={TOGGLE_ROW} onPointerDown={(e) => e.stopPropagation()}>
        <button
          type="button"
          disabled={locked}
          className={cn(
            TOGGLE,
            weightKey === "thin" && "border-primary bg-accent",
            locked && "opacity-40",
          )}
          onClick={() => setWeight(1)}
        >
          Thin
        </button>
        <button
          type="button"
          disabled={locked}
          className={cn(
            TOGGLE,
            weightKey === "medium" && "border-primary bg-accent",
            locked && "opacity-40",
          )}
          onClick={() => setWeight(1.5)}
        >
          Medium
        </button>
        <button
          type="button"
          disabled={locked}
          className={cn(
            TOGGLE,
            weightKey === "bold" && "border-primary bg-accent",
            locked && "opacity-40",
          )}
          onClick={() => setWeight(2.5)}
        >
          Bold
        </button>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={handleDelete}>
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        Delete
      </DropdownMenuItem>
    </CanvasContextMenuShell>
  );
}

export const EdgeContextMenu = memo(EdgeContextMenuInner);
