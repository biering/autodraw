import { isTauri } from "./isTauri";

/**
 * Read plain text from the system clipboard. In Tauri we use the clipboard plugin because
 * `navigator.clipboard.readText()` is unreliable in the embedded WebView.
 */
export async function readClipboardText(): Promise<string> {
  if (isTauri()) {
    const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
    return (await readText()) ?? "";
  }
  if (typeof navigator !== "undefined" && typeof navigator.clipboard?.readText === "function") {
    return await navigator.clipboard.readText();
  }
  throw new Error("Clipboard read is not available in this environment");
}

/** Write plain text; uses the clipboard plugin in Tauri for parity with {@link readClipboardText}. */
export async function writeClipboardText(text: string): Promise<void> {
  if (isTauri()) {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
    return;
  }
  if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
    await navigator.clipboard.writeText(text);
    return;
  }
  throw new Error("Clipboard write is not available in this environment");
}
