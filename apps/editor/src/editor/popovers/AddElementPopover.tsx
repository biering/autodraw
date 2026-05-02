import {
  type NodeShape,
  resolvedNodeBodyFillRgba,
  resolvedNodeBodyStrokeRgba,
} from "@autodraw/core";
import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { cn } from "../../lib/utils";
import { CreationShapeToggleInner, creationShapeToggleLabel } from "../CreationShapeChoice";
import { creationMenuColors, creationMenuShapes } from "../creationMenuCatalog";
import { useDocument } from "../state/useDocument";

/** Centered color/shape picker; opened via window event from toolbar or canvas context menu.
 *  Event detail may carry { x, y } flow-coordinates for placement. */
export function AddElementPopover() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [shape, setShape] = useState<NodeShape>("roundedRect");
  const diagram = useDocument(useShallow((s) => s.diagram));
  const addNode = useDocument((s) => s.addNode);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent).detail;
      if (
        detail &&
        typeof detail === "object" &&
        typeof (detail as { x?: unknown }).x === "number" &&
        typeof (detail as { y?: unknown }).y === "number"
      ) {
        setPos({ x: (detail as { x: number }).x, y: (detail as { x: number; y: number }).y });
      } else {
        setPos(null);
      }
      setOpen(true);
    };
    window.addEventListener("autodraw:open-add-element", onOpen as EventListener);
    return () => window.removeEventListener("autodraw:open-add-element", onOpen as EventListener);
  }, []);

  const colors = useMemo(() => creationMenuColors(diagram), [diagram.customStyles]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) setPos(null);
      }}
    >
      <DialogContent className="max-w-lg sm:max-w-lg" hideClose>
        <DialogHeader>
          <DialogTitle>Add new element</DialogTitle>
          <DialogDescription>Pick a color and shape for the new node.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Color
            </div>
            <div className="grid max-h-[40vh] grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2 overflow-y-auto pr-1">
              {colors.map((s) => (
                <Button
                  key={s.id}
                  type="button"
                  variant="outline"
                  className="relative h-16 w-full overflow-hidden p-0"
                  title={s.id}
                  onClick={() => {
                    const w = 160;
                    const h = 72;
                    addNode({
                      text: "",
                      x: pos ? Math.round(pos.x - w / 2) : 300,
                      y: pos ? Math.round(pos.y - h / 2) : 220,
                      w,
                      h,
                      styleId: s.id,
                      shape,
                    });
                    // Close after mount so the label input is not immediately unfocused by the dialog's restoreFocus.
                    window.requestAnimationFrame(() => {
                      setOpen(false);
                      setPos(null);
                    });
                  }}
                  style={{
                    background: resolvedNodeBodyFillRgba(s, s.id),
                    borderColor: resolvedNodeBodyStrokeRgba(s),
                  }}
                >
                  <span className="pointer-events-none text-xs font-semibold text-neutral-900 drop-shadow-sm">
                    Aa
                  </span>
                </Button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Shape
            </div>
            <div className="grid grid-cols-2 gap-2">
              {creationMenuShapes().map((sh) => (
                <Button
                  key={sh}
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex h-11 items-center justify-center",
                    shape === sh && "border-primary bg-accent",
                  )}
                  aria-label={creationShapeToggleLabel(sh)}
                  aria-pressed={shape === sh}
                  onClick={() => setShape(sh)}
                >
                  <CreationShapeToggleInner shape={sh} />
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
