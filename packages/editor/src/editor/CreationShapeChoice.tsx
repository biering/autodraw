import type { NodeShape } from "@autodraw/core";
import { cn } from "../lib/utils";

/** Human label for shapes shown in creation / node context menus. */
export function creationShapeToggleLabel(shape: NodeShape): string {
  if (shape === "roundedRect") return "Rounded";
  if (shape === "rectangle") return "Rectangle";
  return shape;
}

/**
 * Small stroke-only preview for rounded-rectangle vs sharp rectangle (Tailwind-only).
 * Use inside a parent with `text-foreground` or `text-muted-foreground` so `border-current` picks up contrast.
 */
export function CreationShapeGlyph({ shape, className }: { shape: NodeShape; className?: string }) {
  const box = "box-border h-[14px] w-[28px] shrink-0 border-2 border-current bg-transparent";
  if (shape === "rectangle") {
    return <div className={cn(box, "rounded-none", className)} aria-hidden />;
  }
  return <div className={cn(box, "rounded-md", className)} aria-hidden />;
}

/** Shape glyph only; callers set `aria-label` via {@link creationShapeToggleLabel}. */
export function CreationShapeToggleInner({ shape }: { shape: NodeShape }) {
  return (
    <span className="inline-flex items-center justify-center text-muted-foreground">
      <CreationShapeGlyph shape={shape} />
    </span>
  );
}
