import { EditorShellLicensed } from "@autodraw/editor";
import { useEffect, useRef } from "react";
import { ActivationGate } from "../licensing/ActivationGate.js";
import { MainAwaitLicense } from "../licensing/MainAwaitLicense.js";
import { useLicense, type LicenseState } from "../licensing/useLicense.js";
import { isTauri } from "../platform/isTauri.js";

export function EditorShell() {
  const licenseStatus = useLicense((s: LicenseState) => s.status);
  const bootstrapLicense = useLicense((s: LicenseState) => s.bootstrap);
  const licenseBootRef = useRef(false);

  useEffect(() => {
    if (licenseBootRef.current) return;
    licenseBootRef.current = true;
    void bootstrapLicense();
  }, [bootstrapLicense]);

  if (licenseStatus !== "licensed") {
    return isTauri() ? <MainAwaitLicense /> : <ActivationGate />;
  }

  return <EditorShellLicensed />;
}
