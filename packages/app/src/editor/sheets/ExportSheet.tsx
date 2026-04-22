import { renderSVG } from "@agentsdraw/core";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { isTauri } from "../../platform/isTauri.js";
import { useDocument } from "../state/useDocument.js";

export function ExportSheet() {
  const open = useDocument((s) => s.showExportSheet);
  const setOpen = useDocument((s) => s.setShowExportSheet);
  const diagram = useDocument(useShallow((s) => s.diagram));
  const [format, setFormat] = useState<"pdf" | "png">("pdf");
  const [showGrid, setShowGrid] = useState(diagram.canvas.showGrid);
  const [busy, setBusy] = useState(false);

  const blurb = useMemo(() => {
    return format === "pdf"
      ? "Create a vector PDF document that can be viewed or printed with a PDF application or a web browser."
      : "Export a PNG image suitable for slides, docs, or the web.";
  }, [format]);

  const onExport = async () => {
    if (!isTauri()) {
      console.warn(
        "[agentsdraw] PDF/PNG export uses the Rust backend. From the repo root run `pnpm dev:tauri` (install Rust from https://rustup.rs/ if `cargo` is missing)."
      );
      return;
    }
    setBusy(true);
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const { invoke } = await import("@tauri-apps/api/core");
      const svg = renderSVG(diagram, { showGrid });
      const ext = format === "pdf" ? "pdf" : "png";
      const path = await save({
        filters: [{ name: format === "pdf" ? "PDF" : "PNG", extensions: [ext] }],
        defaultPath: `diagram.${ext}`,
      });
      if (typeof path !== "string") return;
      if (format === "pdf") {
        await invoke("export_diagram_pdf", { svg, path });
      } else {
        await invoke("export_diagram_png", { svg, path, scale: 2 });
      }
      setOpen(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md sm:max-w-md" aria-describedby="export-desc">
        <DialogHeader>
          <DialogTitle>Export diagram</DialogTitle>
          <DialogDescription id="export-desc">{blurb}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2" role="tablist" aria-label="Format">
          <Button
            type="button"
            variant={format === "pdf" ? "default" : "outline"}
            className="flex-1"
            role="tab"
            aria-selected={format === "pdf"}
            onClick={() => setFormat("pdf")}
          >
            PDF
          </Button>
          <Button
            type="button"
            variant={format === "png" ? "default" : "outline"}
            className="flex-1"
            role="tab"
            aria-selected={format === "png"}
            onClick={() => setFormat("png")}
          >
            Image
          </Button>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="export-grid"
            checked={showGrid}
            onCheckedChange={(v) => setShowGrid(v === true)}
          />
          <Label htmlFor="export-grid" className="cursor-pointer font-normal text-muted-foreground">
            Show grid in export
          </Label>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void onExport()} disabled={busy}>
            {busy ? "Exporting…" : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
