import { parseDiagram, serializeDiagram } from "@agentsdraw/core";
import { useDocument } from "../editor/state/useDocument.js";
import { isTauri } from "./isTauri.js";

function warnDesktopOnly(action: string): void {
  console.warn(
    `[agentsdraw] ${action} requires the Tauri desktop app. From the repo root run \`pnpm dev:tauri\` (needs Rust/Cargo on PATH). Use \`pnpm dev\` for Vite-only UI in the browser.`,
  );
}

async function pickAdrawPath(title: string): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const path = await open({
    title,
    multiple: false,
    filters: [{ name: "Agentsdraw diagram", extensions: ["adraw"] }],
  });
  return typeof path === "string" ? path : null;
}

async function loadDiagramFromAdrawPath(path: string): Promise<void> {
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const text = await readTextFile(path);
  const doc = parseDiagram(JSON.parse(text) as unknown);
  useDocument.getState().setDiagram(doc, { filePath: path, dirty: false });
}

export async function openDocumentInteractive(): Promise<void> {
  if (!isTauri()) {
    warnDesktopOnly("Open");
    return;
  }
  const path = await pickAdrawPath("Open diagram");
  if (!path) return;
  await loadDiagramFromAdrawPath(path);
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

/** File ▸ New: blank universal diagram, no path on disk yet. */
export async function newDocumentInteractive(): Promise<void> {
  useDocument.getState().newDocument("universal");
}

export async function openDocumentFromPath(path: string): Promise<void> {
  if (!isTauri()) {
    warnDesktopOnly("Open from path");
    return;
  }
  await loadDiagramFromAdrawPath(path);
}
