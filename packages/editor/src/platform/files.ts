import { parseDiagram, serializeDiagram } from "@autodraw/core";
import { useDocument } from "../editor/state/useDocument";
import { isTauri } from "./isTauri";

function fileTitleFromPath(path: string): string {
  const i = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  return i >= 0 ? path.slice(i + 1) : path;
}

function isBundlerDev(): boolean {
  try {
    return Boolean(
      typeof import.meta !== "undefined" &&
        // Vite injects `import.meta.env.DEV`
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (import.meta as any).env?.DEV,
    );
  } catch {
    return false;
  }
}

function editorIndexUrlWithSearch(search: string): string {
  const suffix = search.length > 0 ? `?${search}` : "";
  if (isBundlerDev()) {
    return `http://localhost:1420/index.html${suffix}`;
  }
  return `index.html${suffix}`;
}

function newDocWindowLabel(): string {
  return `doc-${crypto.randomUUID()}`;
}

/** Opens the editor in a new Tauri webview window (one document per window). */
export async function spawnEditorWebviewWindow(opts: {
  openPath?: string;
  newDiagram?: boolean;
  title?: string;
}): Promise<void> {
  const params = new URLSearchParams();
  if (opts.openPath) params.set("openPath", opts.openPath);
  if (opts.newDiagram) params.set("new", "1");
  const qs = params.toString();
  if (!qs) return;
  const url = editorIndexUrlWithSearch(qs);
  const label = newDocWindowLabel();
  const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
  const webview = new WebviewWindow(label, {
    url,
    title: opts.title ?? "Untitled Diagram",
    width: 1280,
    height: 820,
    center: true,
    resizable: true,
    decorations: true,
    hiddenTitle: true,
    titleBarStyle: "overlay",
    focus: true,
    visible: true,
  });
  await new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error("Timed out creating editor window")), 15_000);
    webview.once("tauri://created", () => {
      window.clearTimeout(t);
      resolve();
    });
    webview.once("tauri://error", (e) => {
      window.clearTimeout(t);
      reject(e);
    });
  });
}

function warnDesktopOnly(action: string): void {
  console.warn(
    `[autodraw] ${action} requires the Tauri desktop app. From the repo root run \`pnpm dev:tauri\` (needs Rust/Cargo on PATH). Use \`pnpm dev\` for Vite-only UI in the browser.`,
  );
}

async function pickAdrawPath(title: string): Promise<string | null> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const path = await open({
    title,
    multiple: false,
    filters: [{ name: "Autodraw diagram", extensions: ["adraw"] }],
  });
  return typeof path === "string" ? path : null;
}

async function loadDiagramFromAdrawPath(path: string): Promise<void> {
  const { readTextFile } = await import("@tauri-apps/plugin-fs");
  const text = await readTextFile(path);
  const doc = parseDiagram(JSON.parse(text) as unknown);
  useDocument.getState().setDiagram(doc, { filePath: path, dirty: false });
}

/** @returns true when a file was chosen (new editor window) or loaded in this webview. */
export async function openDocumentInteractive(): Promise<boolean> {
  if (!isTauri()) {
    warnDesktopOnly("Open");
    return false;
  }
  const path = await pickAdrawPath("Open diagram");
  if (!path) return false;
  await spawnEditorWebviewWindow({ openPath: path, title: fileTitleFromPath(path) });
  return true;
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
      filters: [{ name: "Autodraw", extensions: ["adraw"] }],
      defaultPath: "Untitled.adraw",
    }));
  if (typeof path !== "string") return;
  await writeTextFile(path, serializeDiagram(st.diagram));
  st.setFilePath(path);
  st.markClean();
}

/** File ▸ New: blank universal diagram in a new window (desktop); in-browser dev uses the current tab. */
export async function newDocumentInteractive(): Promise<void> {
  if (!isTauri()) {
    useDocument.getState().newDocument("universal");
    return;
  }
  await spawnEditorWebviewWindow({ newDiagram: true });
}

export async function openDocumentFromPath(path: string): Promise<void> {
  if (!isTauri()) {
    warnDesktopOnly("Open from path");
    return;
  }
  await loadDiagramFromAdrawPath(path);
}
