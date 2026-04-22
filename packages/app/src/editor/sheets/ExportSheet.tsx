import { renderSVG } from "@agentsdraw/core";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { isTauri } from "../../platform/isTauri.js";
import { useDocument } from "../state/useDocument.js";

export function ExportSheet() {
  const diagram = useDocument(useShallow((s) => s.diagram));
  const setShow = useDocument((s) => s.setShowExportSheet);
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
      setShow(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modalBackdrop">
      <div className="sheet exportSheet" role="dialog" aria-label="Export">
        <div className="exportFormats" role="tablist" aria-label="Format">
          <button
            type="button"
            className={`formatCard ${format === "pdf" ? "selected" : ""}`}
            role="tab"
            aria-selected={format === "pdf"}
            onClick={() => setFormat("pdf")}
          >
            PDF
          </button>
          <button
            type="button"
            className={`formatCard ${format === "png" ? "selected" : ""}`}
            role="tab"
            aria-selected={format === "png"}
            onClick={() => setFormat("png")}
          >
            Image
          </button>
        </div>
        <p className="exportBlurb">{blurb}</p>
        <label className="checkRow">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show Grid
        </label>
        <div className="sheetFooter">
          <button type="button" className="btnSecondary" onClick={() => setShow(false)} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btnPrimary" onClick={() => void onExport()} disabled={busy}>
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
