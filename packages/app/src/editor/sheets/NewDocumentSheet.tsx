import type { PalettePreset } from "@agentsdraw/core";
import { parseDiagram } from "@agentsdraw/core";
import { useRef, useState } from "react";
import { isTauri } from "../../platform/isTauri.js";
import { useDocument } from "../state/useDocument.js";

type StartMode = "blank" | "load" | "preset";

export function NewDocumentSheet() {
  const newDocument = useDocument((s) => s.newDocument);
  const loadPaletteFrom = useDocument((s) => s.loadPaletteFrom);
  const setShow = useDocument((s) => s.setShowNewDocSheet);
  const [startMode, setStartMode] = useState<StartMode>("blank");
  const [preset, setPreset] = useState<Exclude<PalettePreset, "empty">>("universal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCreate = () => {
    if (startMode === "preset") {
      newDocument(preset);
      setShow(false);
      return;
    }
    if (startMode === "blank") {
      newDocument("empty");
      setShow(false);
      return;
    }
    // load handled async
  };

  const applyLoadedPalette = (raw: string) => {
    const doc = parseDiagram(JSON.parse(raw));
    newDocument("empty");
    loadPaletteFrom(doc);
    setShow(false);
  };

  const onLoadPalette = async () => {
    setStartMode("load");
    if (!isTauri()) {
      fileInputRef.current?.click();
      return;
    }
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await open({ multiple: false, filters: [{ name: "Diagram", extensions: ["adraw"] }] });
    if (typeof path !== "string") {
      setStartMode("blank");
      return;
    }
    const raw = await readTextFile(path);
    applyLoadedPalette(raw);
  };

  return (
    <div className="modalBackdrop">
      <input
        ref={fileInputRef}
        type="file"
        accept=".adraw,application/json"
        className="srOnly"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) {
            setStartMode("blank");
            return;
          }
          void f.text().then(applyLoadedPalette).catch(() => setStartMode("blank"));
        }}
      />
      <div className="sheet" role="dialog" aria-label="New Document">
        <div className="sheetSectionTitle">New Document</div>
        <div className="cardRow">
          <button
            type="button"
            className={`bigCard ${startMode === "blank" ? "selected" : ""}`}
            onClick={() => setStartMode("blank")}
          >
            <div className="bigCardIcon">✨</div>
            <div className="bigCardLabel">Empty Palette</div>
          </button>
          <button type="button" className={`bigCard ${startMode === "load" ? "selected" : ""}`} onClick={() => void onLoadPalette()}>
            <div className="bigCardIcon">⤵</div>
            <div className="bigCardLabel">Load Palette From Existing Document</div>
          </button>
        </div>

        <div className="sheetSectionTitle">Start With Palette Preset</div>
        <div className="cardRow small">
          <button
            type="button"
            className={`presetCard ${startMode === "preset" && preset === "universal" ? "selected" : ""}`}
            onClick={() => {
              setStartMode("preset");
              setPreset("universal");
            }}
          >
            <div className="thumb universalThumb" />
            <div className="presetLabel">Universal</div>
          </button>
          <button
            type="button"
            className={`presetCard ${startMode === "preset" && preset === "grayscale" ? "selected" : ""}`}
            onClick={() => {
              setStartMode("preset");
              setPreset("grayscale");
            }}
          >
            <div className="thumb grayThumb" />
            <div className="presetLabel">Grayscale</div>
          </button>
          <button
            type="button"
            className={`presetCard ${startMode === "preset" && preset === "flowchart" ? "selected" : ""}`}
            onClick={() => {
              setStartMode("preset");
              setPreset("flowchart");
            }}
          >
            <div className="thumb flowThumb" />
            <div className="presetLabel">Flowchart</div>
          </button>
        </div>

        <div className="sheetFooter">
          <button type="button" className="btnSecondary" onClick={() => setShow(false)}>
            Cancel
          </button>
          <button type="button" className="btnPrimary" onClick={onCreate} disabled={startMode === "load"}>
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
