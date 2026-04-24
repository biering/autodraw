import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { ActivationGate } from "./ActivationGate.js";
import { finalizeLicenseWindowSuccess } from "./licenseWindowOrchestration.js";
import { useLicense } from "./useLicense.js";

/** Survives React StrictMode remounts (ref resets; module state does not). */
let licenseWindowFinalizeStarted = false;

export function LicenseWindowRoot() {
  const status = useLicense((s) => s.status);
  const bootstrap = useLicense((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    let unlistenFn: (() => void) | undefined;
    void getCurrentWindow()
      .onCloseRequested((event) => {
        if (useLicense.getState().status !== "licensed") {
          event.preventDefault();
        }
      })
      .then((fn) => {
        unlistenFn = fn;
      });
    return () => {
      unlistenFn?.();
    };
  }, []);

  useEffect(() => {
    if (status !== "licensed" || licenseWindowFinalizeStarted) return;
    licenseWindowFinalizeStarted = true;
    void finalizeLicenseWindowSuccess().catch((err) => {
      licenseWindowFinalizeStarted = false;
      console.error("finalizeLicenseWindowSuccess", err);
    });
  }, [status]);

  return <ActivationGate fillWindow />;
}
