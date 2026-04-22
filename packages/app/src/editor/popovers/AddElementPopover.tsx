import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { paletteStyles } from "@agentsdraw/core";
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

  if (!open) return null;

  return (
    <div
      className="modalBackdrop"
      role="presentation"
      onMouseDown={() => {
        setOpen(false);
        setPos(null);
      }}
    >
      <div
        className="popoverCenter"
        role="dialog"
        aria-label="Add New Element"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="popoverHeader">
          <div className="popoverTitle">Add New Element</div>
          <button type="button" className="popoverHelp" aria-label="Help">
            ?
          </button>
        </div>
        <div className="swatchGrid">
          {styles.map((s) => (
            <button
              key={s.id}
              type="button"
              className="swatch"
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
                border: `2px solid rgba(${Math.round(s.strokeRed * 255)},${Math.round(s.strokeGreen * 255)},${Math.round(s.strokeBlue * 255)},${s.strokeAlpha})`,
              }}
            >
              <span className="swatchAa">Aa</span>
            </button>
          ))}
        </div>
        <div className="popoverFooter">
          <button type="button" className="btnGhost">
            Customize
          </button>
          <button type="button" className="btnGhost">
            + New
          </button>
        </div>
      </div>
    </div>
  );
}
