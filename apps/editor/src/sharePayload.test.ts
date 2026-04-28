import { describe, expect, it } from "vitest";
import { defaultStyleId, type DiagramV1, emptyDiagram } from "@autodraw/core";
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

  it("encode → decode deep-equals a rich diagram (frames, images, textLabels, links, locked)", () => {
    const d: DiagramV1 = {
      version: 1,
      name: "Share rich",
      palette: "universal",
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
          shape: "diamond",
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
          routing: "orthogonal",
          dash: "dotted",
          head: "lineArrow",
          tail: "diamond",
          label: "self & loop",
          strokeWidth: 2,
          relationshipPreset: 1,
          link: "https://example.com/share-e",
        },
      ],
      customStyles: [
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
          shape: "rectangle",
        },
      ],
      textLabels: [{ id: "t-1", x: 0, y: 100, text: "Note" }],
      frames: [
        { id: "f-titled", name: "Edge case", x: 0, y: 0, w: 300, h: 180, color: "pink" },
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
    const back = decodeDiagramSharePayload(encodeDiagramSharePayload(d));
    expect(back).toEqual(d);
  });
});
