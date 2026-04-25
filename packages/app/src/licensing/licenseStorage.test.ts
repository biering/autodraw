import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearMemoryLocalStorage, installMemoryLocalStorage } from "../test/memoryLocalStorage.js";
import {
  LICENSE_STORAGE_KEY,
  clearStoredLicense,
  readStoredLicense,
  writeStoredLicense,
} from "./licenseStorage.js";

describe("licenseStorage", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
  });

  afterEach(() => {
    clearMemoryLocalStorage();
    vi.unstubAllGlobals();
  });

  it("round-trips key and activationId", () => {
    writeStoredLicense({
      version: 1,
      key: "  polar-key-123  ",
      activationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    const back = readStoredLicense();
    expect(back).toEqual({
      version: 1,
      key: "polar-key-123",
      activationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
  });

  it("returns null for activationId omitted (legacy)", () => {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({ version: 1, key: "k-only" }));
    expect(readStoredLicense()).toEqual({
      version: 1,
      key: "k-only",
      activationId: null,
    });
  });

  it("returns null for malformed JSON", () => {
    localStorage.setItem(LICENSE_STORAGE_KEY, "{not json");
    expect(readStoredLicense()).toBeNull();
  });

  it("returns null for wrong version", () => {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify({ version: 2, key: "x" }));
    expect(readStoredLicense()).toBeNull();
  });

  it("clearStoredLicense removes key", () => {
    writeStoredLicense({ version: 1, key: "k", activationId: null });
    clearStoredLicense();
    expect(readStoredLicense()).toBeNull();
  });

  it("migrates legacy storage key", () => {
    localStorage.setItem(
      "agentsdraw:license:v1",
      JSON.stringify({ version: 1, key: "legacy-key", activationId: null }),
    );
    const back = readStoredLicense();
    expect(back).toEqual({ version: 1, key: "legacy-key", activationId: null });
    expect(localStorage.getItem("autodraw:license:v1")).toContain("legacy-key");
    expect(localStorage.getItem("agentsdraw:license:v1")).toBeNull();
  });
});
