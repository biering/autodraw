import { serializeDiagram } from "@autodraw/core";
import { ReactFlowProvider } from "@xyflow/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { Toaster } from "../components/ui/sonner";
import {
  newDocumentInteractive,
  openDocumentFromPath,
  openDocumentInteractive,
  saveDocumentInteractive,
} from "../platform/files";
import { isTauri } from "../platform/isTauri";
import { decodeDiagramSharePayload } from "../sharePayload";
import { DiagramCanvas } from "./canvas/DiagramCanvas";
import { isTypingInField } from "./isTypingInField";
import { OnboardingButton } from "./onboarding/OnboardingButton";
import { OnboardingDialog } from "./onboarding/OnboardingDialog";
import { useFirstRunOnboarding } from "./onboarding/useOnboarding";
import { AddElementPopover } from "./popovers/AddElementPopover";
import { ExportSheet } from "./sheets/ExportSheet";
import { redoDocument, undoDocument, useDocument } from "./state/useDocument";
import { Toolbar } from "./Toolbar";
import { ZoomDock } from "./ZoomDock";

/** Full editor UI + document bootstrap; only mounted after Polar license is valid. */
export function EditorShellLicensed() {
  useFirstRunOnboarding();
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const setShowExport = useDocument((s) => s.setShowExportSheet);
  const filePath = useDocument((s) => s.filePath);
  const dirty = useDocument((s) => s.dirty);
  const diagram = useDocument(useShallow((s) => s.diagram));
  const markClean = useDocument((s) => s.markClean);
  const removeElementById = useDocument((s) => s.removeElementById);
  const removeEdge = useDocument((s) => s.removeEdge);

  const autosaveTimer = useRef<number | undefined>(undefined);
  const urlBootstrapDone = useRef(false);
  const urlShareBootstrapDone = useRef(false);

  /** Web: load diagram from `?d=` (gzip+base64url share payload), same encoding as `/v`. */
  useLayoutEffect(() => {
    if (isTauri() || urlShareBootstrapDone.current) return;
    const params = new URLSearchParams(window.location.search);
    const d = params.get("d")?.trim();
    if (!d) return;
    urlShareBootstrapDone.current = true;
    try {
      const doc = decodeDiagramSharePayload(d);
      useDocument.getState().setDiagram(doc, { filePath: null, dirty: true });
      const url = new URL(window.location.href);
      url.searchParams.delete("d");
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    } catch {
      console.warn("[autodraw] Invalid ?d= share payload");
    }
  }, []);

  /** Load diagram from `?openPath=` / blank from `?new=1` when this webview was spawned as a document window. */
  useLayoutEffect(() => {
    if (!isTauri() || urlBootstrapDone.current) return;
    const params = new URLSearchParams(window.location.search);
    const openPath = params.get("openPath");
    const wantNew = params.get("new") === "1";
    if (!openPath && !wantNew) return;
    urlBootstrapDone.current = true;
    void (async () => {
      try {
        if (openPath) {
          await openDocumentFromPath(openPath);
        } else if (wantNew) {
          useDocument.getState().newDocument();
        }
      } finally {
        const url = new URL(window.location.href);
        url.searchParams.delete("openPath");
        url.searchParams.delete("new");
        const next = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState(null, "", next);
      }
    })();
  }, []);

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
    [setShowExport],
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
        removeElementById(id);
      }
    },
    [removeElementById, removeEdge],
  );

  useEffect(() => {
    if (!isTauri() || !filePath || !dirty) return;
    window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void import("@tauri-apps/plugin-fs").then(({ writeTextFile }) =>
        writeTextFile(filePath, serializeDiagram(diagram)).then(() => markClean()),
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
    let unViewReload: (() => void) | undefined;
    void (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      unUndo = await listen("doc-undo", () => undoDocument());
      unRedo = await listen("doc-redo", () => redoDocument());
      unExport = await listen("open-export", () => setShowExport(true));
      unFileNew = await listen("file-new", () => void newDocumentInteractive());
      unFileOpen = await listen("file-open", () => void openDocumentInteractive());
      unFileSave = await listen("file-save", () => void saveDocumentInteractive());
      unViewReload = await listen("view-reload", () => {
        window.location.reload();
      });
    })();
    return () => {
      unUndo?.();
      unRedo?.();
      unExport?.();
      unFileNew?.();
      unFileOpen?.();
      unFileSave?.();
      unViewReload?.();
    };
  }, [setShowExport]);

  return (
    <ReactFlowProvider>
      <div className="relative flex h-full min-h-0 w-full flex-col">
        <div
          className="min-h-0 flex-1 bg-[var(--canvas)] transition-colors duration-200 data-[canvas-theme=dark]:bg-[#131316] data-[canvas-theme=dark]:[color-scheme:dark]"
          data-canvas-theme={canvasTheme}
        >
          <DiagramCanvas />
        </div>
        <Toolbar />
        <OnboardingButton />
        <OnboardingDialog />
        <ZoomDock />
        <ExportSheet />
        <AddElementPopover />
        <Toaster position="bottom-right" closeButton />
      </div>
    </ReactFlowProvider>
  );
}
