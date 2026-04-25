import { useReactFlow } from "@xyflow/react";
import { Minus, Plus, Square } from "lucide-react";
import { useCallback, useMemo } from "react";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { useDocument } from "./state/useDocument";

/** Bottom-left floating zoom control (must render under ReactFlowProvider). */
export function ZoomDock() {
  const rf = useReactFlow();
  const setZoom = useDocument((s) => s.setZoom);
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const isDarkCanvas = canvasTheme === "dark";

  const dockShellClass = useMemo(
    () =>
      cn(
        "fixed bottom-[max(16px,env(safe-area-inset-bottom,0px))] left-[max(16px,env(safe-area-inset-left,0px))] z-[75] flex flex-col overflow-hidden rounded-xl",
        isDarkCanvas
          ? "border border-white/[0.14] bg-[rgba(255,255,255,0.08)]"
          : "border border-black/[0.12] bg-[rgba(0,0,0,0.02)]",
      ),
    [isDarkCanvas],
  );

  const zoomBtnClass = useMemo(
    () =>
      cn(
        "h-11 w-11 rounded-none border-0 border-b bg-transparent shadow-none last:border-b-0 [&_svg]:shrink-0",
        isDarkCanvas
          ? "border-b border-white/[0.12] text-white hover:bg-white/12 hover:text-white"
          : "border-b border-black/15 text-black hover:bg-black/10 hover:text-black",
      ),
    [isDarkCanvas],
  );

  const syncZoomFromViewport = useCallback(() => {
    setZoom(rf.getZoom());
  }, [rf, setZoom]);

  const handleZoomIn = useCallback(() => {
    void rf.zoomIn({ duration: 180 });
    window.setTimeout(syncZoomFromViewport, 200);
  }, [rf, syncZoomFromViewport]);

  const handleZoomOut = useCallback(() => {
    void rf.zoomOut({ duration: 180 });
    window.setTimeout(syncZoomFromViewport, 200);
  }, [rf, syncZoomFromViewport]);

  const handleZoom100 = useCallback(() => {
    void rf.zoomTo(1, { duration: 180 });
    window.setTimeout(syncZoomFromViewport, 200);
  }, [rf, syncZoomFromViewport]);

  return (
    <div className={dockShellClass} role="toolbar" aria-label="Zoom">
      <Button
        type="button"
        variant="ghost"
        className={zoomBtnClass}
        title="Zoom in"
        aria-label="Zoom in"
        onClick={handleZoomIn}
      >
        <Plus className="h-5 w-5 text-inherit" strokeWidth={2} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={zoomBtnClass}
        title="Zoom out"
        aria-label="Zoom out"
        onClick={handleZoomOut}
      >
        <Minus className="h-5 w-5 text-inherit" strokeWidth={2} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className={zoomBtnClass}
        title="Zoom to 100%"
        aria-label="Zoom to 100%"
        onClick={handleZoom100}
      >
        <Square className="h-[17px] w-[17px] text-inherit" strokeWidth={2} aria-hidden />
      </Button>
    </div>
  );
}
