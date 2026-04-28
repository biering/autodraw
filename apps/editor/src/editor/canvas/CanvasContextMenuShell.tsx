"use client";

import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";

type CanvasContextMenuShellProps = {
  /** Viewport-space coordinates (px from the canvas top-left). */
  cx: number;
  cy: number;
  onClose: () => void;
  /** Container width override (defaults to a comfortable 16rem max for action menus). */
  className?: string;
  /** Forwarded to Radix `<DropdownMenuContent>`. Defaults: align="start", sideOffset=4. */
  align?: "start" | "end" | "center";
  sideOffset?: number;
  children: ReactNode;
};

/**
 * Controlled-open shadcn `DropdownMenu` anchored at an arbitrary canvas point. We render an
 * invisible 0×0 fixed-position trigger at `(cx, cy)` so Radix's collision-aware positioner can
 * place the popper relative to that point — same trick as the FrameContextMenu, factored so the
 * node / edge / image / textLabel context menus share the same visual chrome and a11y behavior.
 *
 * Closing — by selecting an item, pressing Escape, or clicking outside — fires `onClose` via
 * Radix's `onOpenChange(false)`. Items inside should use shadcn `DropdownMenuItem`,
 * `DropdownMenuLabel`, `DropdownMenuSeparator`, etc.
 */
export function CanvasContextMenuShell({
  cx,
  cy,
  onClose,
  className,
  align = "start",
  sideOffset = 4,
  children,
}: CanvasContextMenuShellProps) {
  return (
    <DropdownMenu
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DropdownMenuTrigger asChild>
        <span
          className="fixed z-[200] block h-0 w-0 overflow-hidden"
          style={{ left: cx, top: cy }}
          aria-hidden
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        sideOffset={sideOffset}
        className={className ?? "min-w-[12rem]"}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
