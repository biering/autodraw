import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { emptyDiagram, parseDiagram, renderSVG, serializeDiagram } from "@autodraw/core";
import { describe, expect, it } from "vitest";

describe("cli fixture roundtrip", () => {
  it("writes and parses a diagram fixture", () => {
    const dir = mkdtempSync(join(tmpdir(), "autodraw-"));
    try {
      const doc = emptyDiagram();
      doc.nodes.push({
        id: "n1",
        text: "Hello",
        x: 10,
        y: 10,
        w: 120,
        h: 60,
        styleId: "yellow",
      });
      const p = join(dir, "t.adraw");
      writeFileSync(p, serializeDiagram(doc), "utf8");
      const back = parseDiagram(JSON.parse(readFileSync(p, "utf8")) as unknown);
      expect(back.nodes).toHaveLength(1);
      const svg = renderSVG(back, { showGrid: false });
      expect(svg).toContain("<svg");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
