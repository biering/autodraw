import { create } from "zustand";
import { isTauri } from "../platform/isTauri.js";
import {
  clearStoredLicense,
  readStoredLicense,
  writeStoredLicense,
  type StoredLicenseV1,
} from "./licenseStorage.js";
import {
  PolarClientError,
  activateLicenseFlow,
  isGrantedStatus,
  polarValidate,
} from "./polarClient.js";
import { getPolarPublicConfig } from "./polarEnv.js";

export type LicenseUiStatus = "validating" | "licensed" | "unlicensed";

/** Cross-webview sync (main window listens; license window emits). */
export type LicenseSyncPayload = { kind: "dev_bypass" } | { kind: "stored"; data: StoredLicenseV1 };

export type LicenseState = {
  status: LicenseUiStatus;
  /** User-facing error (activation failure, invalid key, missing config). */
  error: string | null;
  /** True when `VITE_POLAR_*` required vars are missing. */
  configMissing: boolean;
  bootstrap: () => Promise<void>;
  activate: (rawKey: string) => Promise<void>;
  openCheckout: () => Promise<void>;
  openPortal: () => Promise<void>;
  clearError: () => void;
  /** Vite dev only: skip Polar and open the editor for this session (no persistence). */
  devBypassLicense: () => void;
  /** Apply license state from the dedicated license webview (Tauri multi-window). */
  applyLicenseSync: (payload: LicenseSyncPayload) => void;
};

const initial: Pick<LicenseState, "status" | "error" | "configMissing"> = {
  status: "validating",
  error: null,
  configMissing: false,
};

/** Test helper: reset store to validating state without persisting. */
export function resetLicenseStoreForTests(): void {
  useLicense.setState({ ...initial });
}

export const useLicense = create<LicenseState>((set) => ({
  ...initial,
  clearError: () => set({ error: null }),

  bootstrap: async () => {
    set({ status: "validating", error: null, configMissing: false });
    const cfg = getPolarPublicConfig();
    if (!cfg) {
      set({
        status: "unlicensed",
        configMissing: true,
        error:
          "Polar is not configured. Set VITE_POLAR_ORG_ID and VITE_POLAR_CHECKOUT_URL in your environment.",
      });
      return;
    }

    const stored = readStoredLicense();
    if (!stored) {
      set({ status: "unlicensed", error: null, configMissing: false });
      return;
    }

    try {
      const { status } = await polarValidate({
        key: stored.key,
        organizationId: cfg.organizationId,
        activationId: stored.activationId,
      });
      if (isGrantedStatus(status)) {
        set({ status: "licensed", error: null, configMissing: false });
        return;
      }
      clearStoredLicense();
      set({
        status: "unlicensed",
        error: `License is no longer valid (${status}). Please activate again or buy a new license.`,
        configMissing: false,
      });
    } catch (e) {
      if (e instanceof PolarClientError && e.code === "resource_not_found") {
        clearStoredLicense();
        set({
          status: "unlicensed",
          error: "Stored license was not found. Enter your key again or buy a license.",
          configMissing: false,
        });
        return;
      }
      if (e instanceof PolarClientError) {
        clearStoredLicense();
        set({
          status: "unlicensed",
          error: e.message,
          configMissing: false,
        });
        return;
      }
      // Network / unknown transport error: grace — allow app use; will re-validate next launch
      set({ status: "licensed", error: null, configMissing: false });
    }
  },

  activate: async (rawKey: string) => {
    const key = rawKey.trim();
    set({ error: null });
    const cfg = getPolarPublicConfig();
    if (!cfg) {
      set({
        status: "unlicensed",
        configMissing: true,
        error: "Polar is not configured. Set VITE_POLAR_ORG_ID and VITE_POLAR_CHECKOUT_URL.",
      });
      return;
    }
    if (!key) {
      set({ error: "Paste your license key first." });
      return;
    }

    try {
      const { activationId, status } = await activateLicenseFlow(key, cfg.organizationId);
      if (!isGrantedStatus(status)) {
        set({
          status: "unlicensed",
          error: `Activation failed: license status is "${status}".`,
        });
        return;
      }
      writeStoredLicense({ version: 1, key, activationId });
      set({ status: "licensed", error: null, configMissing: false });
    } catch (e) {
      const msg =
        e instanceof PolarClientError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Activation failed.";
      set({ status: "unlicensed", error: msg, configMissing: false });
    }
  },

  openCheckout: async () => {
    const cfg = getPolarPublicConfig();
    if (!cfg?.checkoutUrl) {
      set({
        configMissing: true,
        error: "Missing VITE_POLAR_CHECKOUT_URL.",
      });
      return;
    }
    try {
      if (isTauri()) {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(cfg.checkoutUrl);
      } else {
        window.open(cfg.checkoutUrl, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Could not open checkout URL.",
      });
    }
  },

  openPortal: async () => {
    const cfg = getPolarPublicConfig();
    const url = cfg?.portalUrl;
    if (!url) {
      set({ error: "Set VITE_POLAR_PORTAL_URL to enable the customer portal link." });
      return;
    }
    try {
      if (isTauri()) {
        const { open } = await import("@tauri-apps/plugin-shell");
        await open(url);
      } else {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Could not open portal URL.",
      });
    }
  },

  devBypassLicense: () => {
    if (!import.meta.env.DEV) return;
    set({ status: "licensed", error: null, configMissing: false });
  },

  applyLicenseSync: (payload) => {
    if (payload.kind === "dev_bypass") {
      if (!import.meta.env.DEV) return;
      set({ status: "licensed", error: null, configMissing: false });
      return;
    }
    writeStoredLicense(payload.data);
    set({ status: "licensed", error: null, configMissing: false });
  },
}));
