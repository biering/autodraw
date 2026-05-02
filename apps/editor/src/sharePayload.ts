import { type DiagramV1, parseDiagram, serializeDiagram } from "@autodraw/core";
import { gunzipSync, gzipSync, strFromU8, strToU8 } from "fflate";

/** Base64url (no padding) encoding of bytes. */
function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  const b64 =
    typeof globalThis.btoa === "function"
      ? globalThis.btoa(bin)
      : Buffer.from(bin, "binary").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const bin =
    typeof globalThis.atob === "function"
      ? globalThis.atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Encode a v1 diagram for use in `?d=` share URLs (`/v`, `/app`).
 * Uses gzip-compressed JSON + base64url to keep URLs shorter than raw JSON.
 */
export function encodeDiagramSharePayload(diagram: DiagramV1): string {
  const json = serializeDiagram(diagram);
  const compressed = gzipSync(strToU8(json), { level: 9 });
  return bytesToBase64Url(compressed);
}

/**
 * Decode payload from `d` query param: gzip(JSON) base64url, or fallback to plain UTF-8 JSON base64url.
 */
export function decodeDiagramSharePayload(d: string): DiagramV1 {
  const raw = base64UrlToBytes(d.trim());
  let text: string;
  try {
    text = strFromU8(gunzipSync(raw));
  } catch {
    text = new TextDecoder().decode(raw);
  }
  return parseDiagram(JSON.parse(text) as unknown);
}
