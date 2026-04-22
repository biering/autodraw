import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { paletteStyles } from "@agentsdraw/core";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocument } from "../state/useDocument.js";

/** Centered palette picker; opened via window event from toolbar or canvas context menu.
 *  Event detail may carry { x, y } flow-coordinates for placement. */
export function AddElementPopover() {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
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
    window.addEventListener("agentsdraw:open-add-element", onOpen as EventListener);
    return () =>
      window.removeEventListener("agentsdraw:open-add-element", onOpen as EventListener);
  }, []);

  const styles = useMemo(() => paletteStyles(diagram.palette), [diagram.palette]);

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
          <DialogDescription>Pick a style from the current palette.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-[50vh] grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2 overflow-y-auto pr-1">
          {styles.map((s) => (
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
                  shape: s.shape,
                });
                setOpen(false);
                setPos(null);
              }}
              style={{
                background: `rgba(${Math.round(s.fillRed * 255)},${Math.round(s.fillGreen * 255)},${Math.round(s.fillBlue * 255)},${s.fillAlpha})`,
                borderColor: `rgba(${Math.round(s.strokeRed * 255)},${Math.round(s.strokeGreen * 255)},${Math.round(s.strokeBlue * 255)},${s.strokeAlpha})`,
              }}
            >
              <span className="pointer-events-none text-xs font-semibold text-neutral-900 drop-shadow-sm">
                Aa
              </span>
            </Button>
          ))}
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="ghost" disabled title="Coming soon">
            Customize
          </Button>
          <Button type="button" variant="ghost" disabled title="Coming soon">
            + New
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
