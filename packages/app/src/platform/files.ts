import { emptyDiagram, parseDiagram, serializeDiagram } from "@agentsdraw/core";
import { useDocument } from "../editor/state/useDocument.js";
import { isTauri } from "./isTauri.js";

function warnDesktopOnly(action: string): void {
  console.warn(
    `[agentsdraw] ${action} requires the Tauri desktop app. From the repo root run \`pnpm dev:tauri\` (needs Rust/Cargo on PATH). Use \`pnpm dev\` for Vite-only UI in the browser.`
  );
}

export async function openDocumentInteractive(): Promise<void> {
  if (!isTauri()) {
    warnDesktopOnly("Open");
    return;
  }
  const { open } = await import("@tauri-apps/plugin-dialog");
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const path = await open({
    multiple: false,
    filters: [{ name: "Agentsdraw", extensions: ["adraw"] }],
  });
  if (typeof path !== "string") return;
  const text = await readTextFile(path);
  const doc = parseDiagram(JSON.parse(text) as unknown);
  useDocument.getState().setDiagram(doc, { filePath: path, dirty: false });
  useDocument.getState().setShowNewDocSheet(false);
}

export async function saveDocumentInteractive(): Promise<void> {
  if (!isTauri()) {
    warnDesktopOnly("Save");
    return;
  }
  const { save } = await import("@tauri-apps/plugin-dialog");
  const { writeTextFile } = await import("@tauri-apps/plugin-fs");
  const st = useDocument.getState();
  const path =
    st.filePath ??
    (await save({
      filters: [{ name: "Agentsdraw", extensions: ["adraw"] }],
      defaultPath: "Untitled.adraw",
    }));
  if (typeof path !== "string") return;
  await writeTextFile(path, serializeDiagram(st.diagram));
  st.setFilePath(path);
  st.markClean();
}

export async function newDocumentInteractive(): Promise<void> {
  useDocument.getState().setDiagram(emptyDiagram("universal"), { filePath: null, dirty: false });
  useDocument.getState().setShowNewDocSheet(true);
}

export async function openDocumentFromPath(path: string): Promise<void> {
  if (!isTauri()) {
    warnDesktopOnly("Open from path");
    return;
  }
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const text = await readTextFile(path);
  const doc = parseDiagram(JSON.parse(text) as unknown);
  useDocument.getState().setDiagram(doc, { filePath: path, dirty: false });
  useDocument.getState().setShowNewDocSheet(false);
}
