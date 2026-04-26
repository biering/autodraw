/** Polar customer-portal API (public, no auth). */

const DEFAULT_POLAR_API = "https://api.polar.sh";

export function polarApiBase(): string {
  const raw = import.meta.env.VITE_POLAR_API_BASE;
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw.trim().replace(/\/$/, "");
  }
  return DEFAULT_POLAR_API;
}

export type PolarErrorCode =
  | "resource_not_found"
  | "not_permitted"
  | "validation_error"
  | "unknown";

export class PolarClientError extends Error {
  constructor(
    message: string,
    public readonly code: PolarErrorCode,
    public readonly status: number,
  ) {
    super(message);
    this.name = "PolarClientError";
  }
}

async function readJsonBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function parsePolarError(res: Response, body: unknown): PolarClientError {
  if (!body || typeof body !== "object") {
    return new PolarClientError(`Polar request failed (${res.status})`, "unknown", res.status);
  }
  const rec = body as Record<string, unknown>;
  const err = typeof rec.error === "string" ? rec.error : "";
  const detail = typeof rec.detail === "string" ? rec.detail : "";
  const msg = detail || err || `Polar request failed (${res.status})`;

  if (err === "ResourceNotFound" || res.status === 404) {
    return new PolarClientError(msg, "resource_not_found", res.status);
  }
  if (err === "NotPermitted" || res.status === 403) {
    return new PolarClientError(msg, "not_permitted", res.status);
  }
  if (res.status === 422) {
    return new PolarClientError(msg, "validation_error", res.status);
  }
  return new PolarClientError(msg, "unknown", res.status);
}

export async function polarValidate(params: {
  key: string;
  organizationId: string;
  activationId?: string | null;
}): Promise<{ status: string }> {
  const key = params.key.trim();
  const body: Record<string, unknown> = {
    key,
    organization_id: params.organizationId,
  };
  if (params.activationId != null && params.activationId !== "") {
    body.activation_id = params.activationId;
  }

  const res = await fetch(`${polarApiBase()}/v1/customer-portal/license-keys/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const json = await readJsonBody(res);
  if (!res.ok) {
    throw parsePolarError(res, json);
  }
  if (!json || typeof json !== "object") {
    throw new PolarClientError("Invalid validate response", "unknown", res.status);
  }
  const status = (json as Record<string, unknown>).status;
  if (typeof status !== "string") {
    throw new PolarClientError("Missing status in validate response", "unknown", res.status);
  }
  return { status };
}

/**
 * Reserve an activation (when the product uses activations), then validate.
 * If activations are not enabled, Polar returns 403 NotPermitted — we fall back to validate-only.
 */
export async function activateLicenseFlow(
  key: string,
  organizationId: string,
): Promise<{ activationId: string | null; status: string }> {
  const trimmed = key.trim();

  const activateRes = await fetch(`${polarApiBase()}/v1/customer-portal/license-keys/activate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      key: trimmed,
      organization_id: organizationId,
      label: "Autodraw",
    }),
  });

  if (activateRes.ok) {
    const json = await readJsonBody(activateRes);
    if (!json || typeof json !== "object") {
      throw new PolarClientError("Invalid activate response", "unknown", activateRes.status);
    }
    const id = (json as Record<string, unknown>).id;
    const activationId = typeof id === "string" ? id : null;
    if (!activationId) {
      throw new PolarClientError(
        "Missing activation id in activate response",
        "unknown",
        activateRes.status,
      );
    }
    const { status } = await polarValidate({
      key: trimmed,
      organizationId,
      activationId,
    });
    return { activationId, status };
  }

  if (activateRes.status === 403) {
    const { status } = await polarValidate({
      key: trimmed,
      organizationId,
      activationId: null,
    });
    return { activationId: null, status };
  }

  const errBody = await readJsonBody(activateRes);
  throw parsePolarError(activateRes, errBody);
}

export function isGrantedStatus(status: string): boolean {
  return status === "granted";
}
