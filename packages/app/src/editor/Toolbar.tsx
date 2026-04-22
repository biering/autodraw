import { useReactFlow } from "@xyflow/react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { defaultStyleId } from "@agentsdraw/core";
import { MAX_VIEW_ZOOM, redoDocument, undoDocument, useDocument } from "./state/useDocument.js";

const ZOOM_PRESETS = [50, 75, 100, 125, 150] as const;

export function Toolbar() {
  const selection = useDocument(useShallow((s) => s.selection));
  const editorMode = useDocument((s) => s.editorMode);
  const setEditorMode = useDocument((s) => s.setEditorMode);
  const zoom = useDocument((s) => s.zoom);
  const setZoom = useDocument((s) => s.setZoom);
  const diagram = useDocument(useShallow((s) => s.diagram));
  const addNode = useDocument((s) => s.addNode);
  const setShowExport = useDocument((s) => s.setShowExportSheet);
  const rf = useReactFlow();

  const hasSelection = selection.nodeIds.length > 0;
  const zoomPct = Math.round(zoom * 100);
  const zoomSelectValue = String(zoomPct);
  const hasCustomZoom = !(ZOOM_PRESETS as readonly number[]).includes(zoomPct);

  useHotkeys("mod+z", (e) => {
    e.preventDefault();
    undoDocument();
  });
  useHotkeys("mod+shift+z", (e) => {
    e.preventDefault();
    redoDocument();
  });

  return (
    <div className="toolbar">
      <div className="toolbarCluster">
        <button
          type="button"
          className="tbBtn"
          onClick={() => window.dispatchEvent(new CustomEvent("agentsdraw:open-add-element"))}
        >
          <span className="tbIcon">+</span>
          <span className="tbLabel">Add Element</span>
        </button>
        <div className="tbSeg" role="group" aria-label="Set type">
          <button
            type="button"
            className={`tbSegBtn ${editorMode === "node" ? "active" : ""}`}
            onClick={() => setEditorMode("node")}
            title="Node"
          >
            <span className="tbIconSm">▭</span>
          </button>
          <button
            type="button"
            className={`tbSegBtn ${editorMode === "edge" ? "active" : ""}`}
            onClick={() => setEditorMode("edge")}
            title="Connector"
          >
            <span className="tbIconSm">↗</span>
          </button>
        </div>
        <button type="button" className="tbBtn" disabled={!hasSelection}>
          <span className="tbIcon">Aa</span>
          <span className="tbLabel">Rename</span>
        </button>
      </div>
      <div className="toolbarCluster right">
        <button
          type="button"
          className="tbBtn"
          onClick={() => {
            const sid = defaultStyleId(diagram.palette);
            addNode({
              text: "",
              x: 320,
              y: 240,
              w: 160,
              h: 72,
              styleId: sid,
            });
          }}
        >
          <span className="tbIcon">▦</span>
          <span className="tbLabel">Palette</span>
        </button>
        <label className="tbZoom">
          <span className="tbLabel">Zoom</span>
          <select
            value={zoomSelectValue}
            onChange={(e) => {
              const next = Math.min(MAX_VIEW_ZOOM, Number(e.target.value) / 100);
              setZoom(next);
              void rf.zoomTo(next, { duration: 160 });
            }}
          >
            {ZOOM_PRESETS.map((z) => (
              <option key={z} value={z}>
                {z}%
              </option>
            ))}
            {hasCustomZoom ? (
              <option key="current" value={zoomPct}>
                {zoomPct}%
              </option>
            ) : null}
          </select>
        </label>
        <button type="button" className="tbBtn primary" onClick={() => setShowExport(true)}>
          <span className="tbIcon">⇧</span>
          <span className="tbLabel">Export</span>
        </button>
      </div>
    </div>
  );
}
