import { describe, expect, it } from "vitest";
import { emptyDiagram, parseDiagram, serializeDiagram, type DiagramV1 } from "./schema.js";
import { renderSVG } from "./renderer.js";

/** Import (parse) then export (serialize) — the `.adraw` wire round-trip. */
function wireRoundtrip(json: string): string {
  return serializeDiagram(parseDiagram(JSON.parse(json) as unknown));
}

describe("edge connection ports", () => {
  it("round-trips optional sourceHandle and targetHandle on edges", () => {
    const d = emptyDiagram("universal");
    d.nodes.push({
      id: "n1",
      text: "A",
      x: 0,
      y: 0,
      w: 100,
      h: 50,
      styleId: "red",
      shape: "roundedRect",
    });
    d.nodes.push({
      id: "n2",
      text: "B",
      x: 200,
      y: 0,
      w: 100,
      h: 50,
      styleId: "red",
      shape: "roundedRect",
    });
    d.edges.push({
      id: "e1",
      from: "n1",
      to: "n2",
      sourceHandle: "src-bottom",
      targetHandle: "tgt-top",
      routing: "orthogonal",
      dash: "solid",
      head: "lineArrow",
      tail: "none",
      label: "",
      strokeWidth: 2,
      relationshipPreset: 0,
    });
    const json = serializeDiagram(d);
    const back = parseDiagram(JSON.parse(json));
    expect(back.edges[0]?.sourceHandle).toBe("src-bottom");
    expect(back.edges[0]?.targetHandle).toBe("tgt-top");
  });
});

describe("diagram name", () => {
  it("defaults missing name to Diagram when parsing legacy JSON", () => {
    const raw = {
      version: 1,
      palette: "universal",
      canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
      nodes: [],
      edges: [],
    };
    const d = parseDiagram(raw);
    expect(d.name).toBe("Diagram");
  });

  it("round-trips name in serialized files", () => {
    const d = emptyDiagram("universal");
    d.name = "My flow";
    const back = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
    expect(back.name).toBe("My flow");
  });
});

describe("diagram import / export (wire format)", () => {
  it("is idempotent for a minimal diagram (defaults applied once, then stable)", () => {
    const minimal = {
      version: 1,
      palette: "flowchart" as const,
      nodes: [],
      edges: [],
    };
    const canonical = serializeDiagram(parseDiagram(minimal));
    const again = wireRoundtrip(canonical);
    expect(again).toBe(canonical);
    expect((JSON.parse(canonical) as { name: string }).name).toBe("Diagram");
    expect((JSON.parse(canonical) as { customStyles: unknown[] }).customStyles).toEqual([]);
  });

  it("is idempotent for a full diagram with nodes, edges, handles, preset, and customStyles", () => {
    const d: DiagramV1 = {
      version: 1,
      name: "Export test",
      palette: "universal",
      canvas: { showGrid: false, gridSpacing: 20, zoom: 1.25 },
      nodes: [
        {
          id: "n-a",
          text: "Tab\there",
          x: 10,
          y: 20,
          w: 120,
          h: 60,
          styleId: "yellow",
          shape: "hexagon",
        },
        {
          id: "n-b",
          text: "B",
          x: 300,
          y: 40,
          w: 100,
          h: 50,
          styleId: "red",
        },
      ],
      edges: [
        {
          id: "e-1",
          from: "n-a",
          to: "n-b",
          sourceHandle: "src-right",
          targetHandle: "tgt-left",
          routing: "curved",
          dash: "dotted",
          head: "diamond",
          tail: "circle",
          label: "rel",
          strokeWidth: 2,
          relationshipPreset: 3,
        },
      ],
      customStyles: [
        {
          id: "custom-1",
          fillRed: 10,
          fillGreen: 20,
          fillBlue: 30,
          fillAlpha: 255,
          strokeRed: 0,
          strokeGreen: 0,
          strokeBlue: 0,
          strokeAlpha: 255,
          shape: "rectangle",
        },
      ],
    };
    const first = serializeDiagram(parseDiagram(d));
    const second = wireRoundtrip(first);
    expect(second).toBe(first);
    const third = wireRoundtrip(second);
    expect(third).toBe(second);
  });

  it("is idempotent after legacy edge head migration (serialize output stable)", () => {
    const legacy = {
      version: 1,
      palette: "universal",
      name: "Legacy",
      canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
      nodes: [
        {
          id: "n1",
          text: "n",
          x: 0,
          y: 0,
          w: 50,
          h: 50,
          styleId: "red",
        },
      ],
      edges: [
        {
          id: "e1",
          from: "n1",
          to: "n1",
          routing: "straight" as const,
          dash: "solid" as const,
          head: "arrowOpen",
          tail: "arrowFilled",
          label: "",
        },
      ],
    };
    const migratedOnce = serializeDiagram(parseDiagram(legacy));
    expect(migratedOnce).toContain('"head": "lineArrow"');
    expect(migratedOnce).toContain('"tail": "triangleArrow"');
    const migratedTwice = wireRoundtrip(migratedOnce);
    expect(migratedTwice).toBe(migratedOnce);
  });

  it("matches exactly: parse → serialize bytes equal re-import of same file", () => {
    const d = emptyDiagram("grayscale");
    d.name = "Bytes";
    d.nodes.push({
      id: "n1",
      text: "x",
      x: 1,
      y: 2,
      w: 3,
      h: 4,
      styleId: "red",
      shape: "oval",
    });
    const fileBytes = serializeDiagram(d);
    const reimport = parseDiagram(JSON.parse(fileBytes) as unknown);
    expect(serializeDiagram(reimport)).toBe(fileBytes);
  });
});

describe("diagram round-trip", () => {
  it("parses fixture and renders SVG", () => {
    const d = emptyDiagram("universal");
    d.nodes.push({
      id: "n1",
      text: "A & node",
      x: 100,
      y: 100,
      w: 140,
      h: 64,
      styleId: "red",
      shape: "roundedRect",
    });
    const json = serializeDiagram(d);
    const back = parseDiagram(JSON.parse(json));
    expect(back.nodes).toHaveLength(1);
    const svg = renderSVG(back, { showGrid: true });
    expect(svg).toContain("<svg");
    expect(svg).toContain("A &amp; node");
  });
});
