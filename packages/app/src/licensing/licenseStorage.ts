export const LICENSE_STORAGE_KEY = "agentsdraw:license:v1";

export type StoredLicenseV1 = {
  version: 1;
  key: string;
  /** Present when the Polar product uses device activations; otherwise `null`. */
  activationId: string | null;
};

function getLocalStorage(): Storage | null {
  try {
    if (
      typeof window !== "undefined" &&
      window.localStorage &&
      typeof window.localStorage.getItem === "function" &&
      typeof window.localStorage.removeItem === "function"
    ) {
      return window.localStorage;
    }
  } catch {
    /* private mode */
  }
  const g = globalThis as { localStorage?: Storage };
  try {
    if (
      g.localStorage &&
      typeof g.localStorage.getItem === "function" &&
      typeof g.localStorage.removeItem === "function"
    ) {
      return g.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function readStoredLicense(): StoredLicenseV1 | null {
  const ls = getLocalStorage();
  if (!ls) return null;
  let raw: string | null;
  try {
    raw = ls.getItem(LICENSE_STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw == null || raw.trim() === "") return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!isRecord(parsed)) return null;
  if (parsed.version !== 1) return null;
  if (typeof parsed.key !== "string" || parsed.key.trim() === "") return null;
  const activationId =
    parsed.activationId === null || parsed.activationId === undefined
      ? null
      : typeof parsed.activationId === "string"
        ? parsed.activationId
        : null;
  return {
    version: 1,
    key: parsed.key.trim(),
    activationId,
  };
}

export function writeStoredLicense(data: StoredLicenseV1): void {
  const ls = getLocalStorage();
  if (!ls || typeof ls.setItem !== "function") {
    return;
  }
  try {
    ls.setItem(
      LICENSE_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        key: data.key.trim(),
        activationId: data.activationId,
      }),
    );
  } catch {
    /* quota / private mode */
  }
}

export function clearStoredLicense(): void {
  const ls = getLocalStorage();
  if (!ls || typeof ls.removeItem !== "function") {
    return;
  }
  try {
    ls.removeItem(LICENSE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
