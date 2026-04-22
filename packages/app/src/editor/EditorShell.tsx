import { serializeDiagram } from "@agentsdraw/core";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { isTauri } from "../platform/isTauri.js";
import {
  newDocumentInteractive,
  openDocumentFromPath,
  openDocumentInteractive,
  saveDocumentInteractive,
} from "../platform/files.js";
import { CliSkillHelp } from "./CliSkillHelp.js";
import { DiagramCanvas } from "./canvas/DiagramCanvas.js";
import { AddElementPopover } from "./popovers/AddElementPopover.js";
import { AddRelationshipPopover } from "./popovers/AddRelationshipPopover.js";
import { ExportSheet } from "./sheets/ExportSheet.js";
import { NewDocumentSheet } from "./sheets/NewDocumentSheet.js";
import { Toolbar } from "./Toolbar.js";
import { ZoomDock } from "./ZoomDock.js";
import { redoDocument, undoDocument, useDocument } from "./state/useDocument.js";

function isTypingInField(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function EditorShell() {
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const setShowExport = useDocument((s) => s.setShowExportSheet);
  const filePath = useDocument((s) => s.filePath);
  const dirty = useDocument((s) => s.dirty);
  const diagram = useDocument(useShallow((s) => s.diagram));
  const markClean = useDocument((s) => s.markClean);
  const removeNode = useDocument((s) => s.removeNode);
  const removeEdge = useDocument((s) => s.removeEdge);

  const autosaveTimer = useRef<number | undefined>(undefined);

  useHotkeys("mod+o", (e) => {
    e.preventDefault();
    void openDocumentInteractive();
  });
  useHotkeys("mod+s", (e) => {
    e.preventDefault();
    void saveDocumentInteractive();
  });
  useHotkeys("mod+n", (e) => {
    e.preventDefault();
    void newDocumentInteractive();
  });
  useHotkeys(
    "mod+shift+e",
    (e) => {
      if (isTypingInField()) return;
      e.preventDefault();
      setShowExport(true);
    },
    [setShowExport]
  );

  useHotkeys(
    ["backspace", "delete"],
    (e) => {
      if (isTypingInField()) return;
      const { selection } = useDocument.getState();
      const nodeIds = [...selection.nodeIds];
      const edgeIds = [...selection.edgeIds];
      if (nodeIds.length === 0 && edgeIds.length === 0) return;
      e.preventDefault();
      for (const id of edgeIds) {
        removeEdge(id);
      }
      for (const id of nodeIds) {
        removeNode(id);
      }
    },
    [removeNode, removeEdge]
  );

  useEffect(() => {
    if (!isTauri() || !filePath || !dirty) return;
    window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void import("@tauri-apps/plugin-fs").then(({ writeTextFile }) =>
        writeTextFile(filePath, serializeDiagram(diagram)).then(() => markClean())
      );
    }, 900);
    return () => window.clearTimeout(autosaveTimer.current);
  }, [diagram, dirty, filePath, markClean]);

  useEffect(() => {
    if (!isTauri()) return;
    let unUndo: (() => void) | undefined;
    let unRedo: (() => void) | undefined;
    let unExport: (() => void) | undefined;
    let unFileNew: (() => void) | undefined;
    let unFileOpen: (() => void) | undefined;
    let unFileSave: (() => void) | undefined;
    let unOpenPath: (() => void) | undefined;
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unUndo = await listen("doc-undo", () => undoDocument());
      unRedo = await listen("doc-redo", () => redoDocument());
      unExport = await listen("open-export", () => setShowExport(true));
      unFileNew = await listen("file-new", () => void newDocumentInteractive());
      unFileOpen = await listen("file-open", () => void openDocumentInteractive());
      unFileSave = await listen("file-save", () => void saveDocumentInteractive());
      unOpenPath = await listen("open-file-path", (ev) => {
        const p = typeof ev.payload === "string" ? ev.payload : String(ev.payload);
        void openDocumentFromPath(p);
      });
    })();
    return () => {
      unUndo?.();
      unRedo?.();
      unExport?.();
      unFileNew?.();
      unFileOpen?.();
      unFileSave?.();
      unOpenPath?.();
    };
  }, [setShowExport]);

  return (
    <ReactFlowProvider>
      <div className="editorRoot">
        <div className="canvasWrap" data-canvas-theme={canvasTheme}>
          <DiagramCanvas />
        </div>
        <Toolbar />
        <CliSkillHelp />
        <ZoomDock />
        <NewDocumentSheet />
        <ExportSheet />
        <AddElementPopover />
        <AddRelationshipPopover />
      </div>
    </ReactFlowProvider>
  );
}
