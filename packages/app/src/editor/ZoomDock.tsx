import { useReactFlow } from "@xyflow/react";
import { Minus, Plus, Square } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useDocument } from "./state/useDocument.js";

/** Bottom-left floating zoom control (must render under ReactFlowProvider). */
export function ZoomDock() {
  const rf = useReactFlow();
  const setZoom = useDocument((s) => s.setZoom);

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
    <div className="zoomDock" role="toolbar" aria-label="Zoom">
      <Button
        type="button"
        variant="ghost"
        className="zoomDockBtn h-11 w-11 rounded-none border-0 bg-transparent text-[#1d1d1f] shadow-none hover:bg-[#f2f2f7]"
        title="Zoom in"
        aria-label="Zoom in"
        onClick={handleZoomIn}
      >
        <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="zoomDockBtn h-11 w-11 rounded-none border-0 bg-transparent text-[#1d1d1f] shadow-none hover:bg-[#f2f2f7]"
        title="Zoom out"
        aria-label="Zoom out"
        onClick={handleZoomOut}
      >
        <Minus className="h-5 w-5" strokeWidth={2} aria-hidden />
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="zoomDockBtn h-11 w-11 rounded-none border-0 bg-transparent text-[#1d1d1f] shadow-none hover:bg-[#f2f2f7]"
        title="Zoom to 100%"
        aria-label="Zoom to 100%"
        onClick={handleZoom100}
      >
        <Square className="h-[17px] w-[17px]" strokeWidth={2} aria-hidden />
      </Button>
    </div>
  );
}
