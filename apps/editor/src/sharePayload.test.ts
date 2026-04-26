import { describe, expect, it } from "vitest";
import { defaultStyleId, emptyDiagram } from "@autodraw/core";
import { decodeDiagramSharePayload, encodeDiagramSharePayload } from "./sharePayload";

describe("sharePayload", () => {
  it("round-trips gzip payload", () => {
    const d = emptyDiagram("universal");
    d.name = "Round trip";
    d.nodes.push({
      id: "n1",
      text: "Hi",
      x: 100,
      y: 100,
      w: 120,
      h: 60,
      styleId: defaultStyleId(d.palette),
    });
    const enc = encodeDiagramSharePayload(d);
    const back = decodeDiagramSharePayload(enc);
    expect(back.name).toBe("Round trip");
    expect(back.nodes).toHaveLength(1);
    expect(back.nodes[0]!.text).toBe("Hi");
  });

  it("decodes uncompressed UTF-8 JSON base64url (fallback)", () => {
    const d = emptyDiagram("grayscale");
    d.name = "Plain";
    const json = JSON.stringify(d);
    const b64 = Buffer.from(json, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const back = decodeDiagramSharePayload(b64);
    expect(back.palette).toBe("grayscale");
    expect(back.name).toBe("Plain");
  });
});
