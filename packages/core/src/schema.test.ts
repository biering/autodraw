import { describe, expect, it } from "vitest";
import { emptyDiagram, parseDiagram, serializeDiagram } from "./schema.js";
import { renderSVG } from "./renderer.js";

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
