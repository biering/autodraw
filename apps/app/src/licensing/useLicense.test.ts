import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./polarEnv.js", () => ({
  getPolarPublicConfig: vi.fn(),
}));

import * as polarEnv from "./polarEnv.js";
import { clearMemoryLocalStorage, installMemoryLocalStorage } from "../test/memoryLocalStorage.js";
import { readStoredLicense, writeStoredLicense } from "./licenseStorage.js";
import { resetLicenseStoreForTests, useLicense } from "./useLicense.js";

const defaultCfg = {
  organizationId: "11111111-1111-4111-8111-111111111111",
  checkoutUrl: "https://example.com/buy",
  portalUrl: null as string | null,
  priceLabel: null as string | null,
  productId: null as string | null,
};

function jsonResponse(ok: boolean, status: number, body: unknown) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  }) as unknown as ReturnType<typeof fetch>;
}

describe("useLicense", () => {
  beforeEach(() => {
    installMemoryLocalStorage();
    vi.mocked(polarEnv.getPolarPublicConfig).mockReturnValue(defaultCfg);
    resetLicenseStoreForTests();
  });

  afterEach(() => {
    clearMemoryLocalStorage();
    vi.unstubAllGlobals();
  });

  it("bootstrap → unlicensed when no storage", async () => {
    await useLicense.getState().bootstrap();
    expect(useLicense.getState().status).toBe("unlicensed");
    expect(useLicense.getState().configMissing).toBe(false);
  });

  it("bootstrap → configMissing when polar env is absent", async () => {
    vi.mocked(polarEnv.getPolarPublicConfig).mockReturnValue(null);
    await useLicense.getState().bootstrap();
    expect(useLicense.getState().status).toBe("unlicensed");
    expect(useLicense.getState().configMissing).toBe(true);
    expect(useLicense.getState().error).toContain("Polar is not configured");
  });

  it("bootstrap → licensed when validate returns granted", async () => {
    writeStoredLicense({ version: 1, key: "my-key", activationId: null });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          jsonResponse(true, 200, { status: "granted", id: "lic-id", display_key: "****" }),
        ),
    );
    await useLicense.getState().bootstrap();
    expect(useLicense.getState().status).toBe("licensed");
  });

  it("bootstrap clears storage when validate returns 404", async () => {
    writeStoredLicense({ version: 1, key: "gone", activationId: null });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          jsonResponse(false, 404, { error: "ResourceNotFound", detail: "not found" }),
        ),
    );
    await useLicense.getState().bootstrap();
    expect(useLicense.getState().status).toBe("unlicensed");
    expect(readStoredLicense()).toBeNull();
  });

  it("bootstrap keeps licensed on network error when storage exists (grace)", async () => {
    writeStoredLicense({
      version: 1,
      key: "k",
      activationId: "22222222-2222-4222-8222-222222222222",
    });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await useLicense.getState().bootstrap();
    expect(useLicense.getState().status).toBe("licensed");
    expect(readStoredLicense()).not.toBeNull();
  });

  it("bootstrap clears storage when status is not granted", async () => {
    writeStoredLicense({ version: 1, key: "k", activationId: null });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => jsonResponse(true, 200, { status: "revoked" })),
    );
    await useLicense.getState().bootstrap();
    expect(useLicense.getState().status).toBe("unlicensed");
    expect(readStoredLicense()).toBeNull();
  });

  it("activate persists license on activation + validate success", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse(true, 200, {
          id: "33333333-3333-4333-8333-333333333333",
          license_key: { status: "granted" },
        }),
      )
      .mockImplementationOnce(() => jsonResponse(true, 200, { status: "granted" }));
    vi.stubGlobal("fetch", fetchMock);

    await useLicense.getState().activate("secret-key");
    expect(useLicense.getState().status).toBe("licensed");
    const stored = readStoredLicense();
    expect(stored?.key).toBe("secret-key");
    expect(stored?.activationId).toBe("33333333-3333-4333-8333-333333333333");
  });

  it("activate falls back to validate-only when activate returns 403", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(() =>
        jsonResponse(false, 403, {
          error: "NotPermitted",
          detail: "Use validate instead",
        }),
      )
      .mockImplementationOnce(() => jsonResponse(true, 200, { status: "granted" }));
    vi.stubGlobal("fetch", fetchMock);

    await useLicense.getState().activate("no-activation-product");
    expect(useLicense.getState().status).toBe("licensed");
    expect(readStoredLicense()?.activationId).toBeNull();
  });

  it("applyLicenseSync persists stored payload and sets licensed", () => {
    const data = {
      version: 1 as const,
      key: "sync-key",
      activationId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    };
    useLicense.getState().applyLicenseSync({ kind: "stored", data });
    expect(useLicense.getState().status).toBe("licensed");
    expect(readStoredLicense()?.key).toBe("sync-key");
  });

  it("activate leaves storage untouched on activate 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(() =>
          jsonResponse(false, 404, { error: "ResourceNotFound", detail: "bad key" }),
        ),
    );
    await useLicense.getState().activate("bad");
    expect(useLicense.getState().status).toBe("unlicensed");
    expect(useLicense.getState().error).toContain("bad key");
    expect(readStoredLicense()).toBeNull();
  });
});
