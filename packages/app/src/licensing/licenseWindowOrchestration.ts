import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { readStoredLicense } from "./licenseStorage.js";
import type { LicenseSyncPayload } from "./useLicense.js";

export const LICENSE_SYNC_EVENT = "autodraw-license-sync";

/** Build payload for main after this webview is licensed (read storage after activate). */
export function buildLicenseSyncPayload(): LicenseSyncPayload {
  const stored = readStoredLicense();
  if (stored) return { kind: "stored", data: stored };
  if (import.meta.env.DEV) return { kind: "dev_bypass" };
  throw new Error("No stored license to sync; activate again.");
}

export async function finalizeLicenseWindowSuccess(): Promise<void> {
  const payload = buildLicenseSyncPayload();
  // Defer so the main webview can finish loading and attach its `listen` handler (separate JS context).
  await new Promise<void>((r) => setTimeout(r, 50));
  await emit(LICENSE_SYNC_EVENT, payload);
  const main = await WebviewWindow.getByLabel("main");
  if (main) {
    await main.show();
    await main.setFocus();
  }
  const current = WebviewWindow.getCurrent();
  await current.close();
}
