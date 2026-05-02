import { defaultStyleId, emptyDiagram, parseDiagram } from "@autodraw/core";
import { describe, expect, it } from "vitest";
import { decodeDiagramSharePayload, encodeDiagramSharePayload } from "./sharePayload";

describe("sharePayload", () => {
  it("round-trips gzip payload", () => {
    const d = emptyDiagram();
    d.name = "Round trip";
    d.nodes.push({
      id: "n1",
      text: "Hi",
      x: 100,
      y: 100,
      w: 120,
      h: 60,
      styleId: defaultStyleId(d),
    });
    const enc = encodeDiagramSharePayload(d);
    const back = decodeDiagramSharePayload(enc);
    expect(back.name).toBe("Round trip");
    expect(back.nodes).toHaveLength(1);
    expect(back.nodes[0]!.text).toBe("Hi");
  });

  it("decodes uncompressed UTF-8 JSON base64url (fallback)", () => {
    const d = emptyDiagram();
    d.name = "Plain";
    const json = JSON.stringify(d);
    const b64 = Buffer.from(json, "utf8")
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const back = decodeDiagramSharePayload(b64);
    expect(back.name).toBe("Plain");
    expect(back).toEqual(parseDiagram(JSON.parse(json) as unknown));
  });

  it("encode → decode deep-equals a rich diagram (frames, images, textLabels, links, locked)", () => {
    const base = emptyDiagram();
    const d = {
      ...base,
      version: 1 as const,
      name: "Share rich",
      canvas: { showGrid: false, gridSpacing: 18, zoom: 1.5 },
      nodes: [
        {
          id: "n-1",
          text: "α",
          x: 1.25,
          y: 2.5,
          w: 110,
          h: 44,
          styleId: "red",
          shape: "diamond" as const,
          link: "https://example.com/share-n",
          locked: true,
        },
      ],
      edges: [
        {
          id: "e-1",
          from: "n-1",
          to: "n-1",
          sourceHandle: "src-top",
          targetHandle: "tgt-bottom",
          routing: "orthogonal" as const,
          dash: "dotted" as const,
          head: "lineArrow" as const,
          tail: "diamond" as const,
          label: "self & loop",
          strokeWidth: 2,
          relationshipPreset: 1,
          link: "https://example.com/share-e",
        },
      ],
      customStyles: [
        ...(base.customStyles ?? []),
        {
          id: "red",
          fillRed: 0.9,
          fillGreen: 0.1,
          fillBlue: 0.1,
          fillAlpha: 1,
          strokeRed: 0.5,
          strokeGreen: 0.1,
          strokeBlue: 0.1,
          strokeAlpha: 1,
          shape: "rectangle" as const,
        },
        {
          id: "share-style",
          fillRed: 200,
          fillGreen: 220,
          fillBlue: 255,
          fillAlpha: 255,
          strokeRed: 50,
          strokeGreen: 80,
          strokeBlue: 120,
          strokeAlpha: 255,
          shape: "rectangle" as const,
        },
      ],
      textLabels: [{ id: "t-1", x: 0, y: 100, text: "Note" }],
      frames: [
        { id: "f-titled", name: "Edge case", x: 0, y: 0, w: 300, h: 180, color: "pink" as const },
        { id: "f-untitled", x: 320, y: 0, w: 240, h: 180 },
      ],
      images: [
        {
          id: "i-1",
          src: "https://example.com/share.png",
          x: 0,
          y: 200,
          w: 64,
          h: 64,
          alt: "Pic",
        },
      ],
    };
    const normalized = parseDiagram(JSON.parse(JSON.stringify(d)) as unknown);
    const back = decodeDiagramSharePayload(encodeDiagramSharePayload(normalized));
    expect(back).toEqual(normalized);
  });
});
