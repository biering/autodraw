import { describe, expect, it } from "vitest";
import { emptyDiagram, parseDiagram, serializeDiagram } from "./schema.js";
import { renderSVG } from "./renderer.js";

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
      head: "arrowOpen",
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
