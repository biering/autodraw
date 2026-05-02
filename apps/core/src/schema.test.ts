import { describe, expect, it } from "vitest";
import { renderSVG } from "./renderer.js";
import { type DiagramV1, emptyDiagram, parseDiagram, serializeDiagram } from "./schema.js";

/** Import (parse) then export (serialize) — the `.adraw` wire round-trip. */
function wireRoundtrip(json: string): string {
  return serializeDiagram(parseDiagram(JSON.parse(json) as unknown));
}

describe("edge connection ports", () => {
  it("round-trips optional sourceHandle and targetHandle on edges", () => {
    const d = emptyDiagram();
    d.nodes.push({
      id: "n1",
      text: "A",
      x: 0,
      y: 0,
      w: 100,
      h: 50,
      styleId: "yellow",
      shape: "roundedRect",
    });
    d.nodes.push({
      id: "n2",
      text: "B",
      x: 200,
      y: 0,
      w: 100,
      h: 50,
      styleId: "orange",
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
  it("defaults missing name to Diagram when parsing minimal JSON", () => {
    const raw = {
      version: 1,
      canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
      nodes: [],
      edges: [],
    };
    const d = parseDiagram(raw);
    expect(d.name).toBe("Diagram");
  });

  it("round-trips name in serialized files", () => {
    const d = emptyDiagram();
    d.name = "My flow";
    const back = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
    expect(back.name).toBe("My flow");
  });
});

describe("diagram import / export (wire format)", () => {
  it("is idempotent for a minimal diagram (wire format stable)", () => {
    const minimal = {
      version: 1,
      canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
      nodes: [],
      edges: [],
    };
    const canonical = serializeDiagram(parseDiagram(minimal));
    const again = wireRoundtrip(canonical);
    expect(again).toBe(canonical);
    expect((JSON.parse(canonical) as { name: string }).name).toBe("Diagram");
    const parsed = JSON.parse(canonical) as { customStyles?: { id: string }[] };
    expect(parsed.customStyles ?? []).toEqual([]);
  });

  it("is idempotent for a full diagram with nodes, edges, handles, preset, and customStyles", () => {
    const base = emptyDiagram();
    const d = {
      version: 1 as const,
      name: "Export test",
      canvas: { showGrid: false, gridSpacing: 20, zoom: 1.25 },
      textLabels: [],
      frames: [],
      images: [],
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
        ...(base.customStyles ?? []),
        {
          id: "red",
          fillRed: 1,
          fillGreen: 0,
          fillBlue: 0,
          fillAlpha: 1,
          strokeRed: 0.5,
          strokeGreen: 0,
          strokeBlue: 0,
          strokeAlpha: 1,
          shape: "roundedRect",
        },
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
      customStyles: [
        {
          id: "red",
          fillRed: 1,
          fillGreen: 0,
          fillBlue: 0,
          fillAlpha: 1,
          strokeRed: 0.5,
          strokeGreen: 0,
          strokeBlue: 0,
          strokeAlpha: 1,
          shape: "roundedRect",
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
    const d = emptyDiagram();
    d.name = "Bytes";
    d.nodes.push({
      id: "n1",
      text: "x",
      x: 1,
      y: 2,
      w: 3,
      h: 4,
      styleId: "yellow",
      shape: "oval",
    });
    const fileBytes = serializeDiagram(d);
    const reimport = parseDiagram(JSON.parse(fileBytes) as unknown);
    expect(serializeDiagram(reimport)).toBe(fileBytes);
  });
});

describe("text labels, frames, images, link, locked", () => {
  it("round-trips optional diagram arrays and node link", () => {
    const raw = {
      version: 1,
      name: "Rich",
      canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
      nodes: [
        {
          id: "n1",
          text: "A",
          x: 0,
          y: 0,
          w: 80,
          h: 40,
          styleId: "red",
          link: "https://example.com/doc",
          locked: true,
        },
      ],
      edges: [],
      textLabels: [{ id: "t1", x: 10, y: 200, text: "Legend text" }],
      frames: [{ id: "f1", name: "VPC", x: 0, y: 100, w: 400, h: 80 }],
      images: [
        {
          id: "i1",
          src: "https://example.com/logo.png",
          x: 300,
          y: 10,
          w: 64,
          h: 64,
          alt: "Logo",
        },
      ],
      customStyles: [
        {
          id: "red",
          fillRed: 1,
          fillGreen: 0,
          fillBlue: 0,
          fillAlpha: 1,
          strokeRed: 0.5,
          strokeGreen: 0,
          strokeBlue: 0,
          strokeAlpha: 1,
          shape: "roundedRect",
        },
      ],
    };
    const d = parseDiagram(raw);
    expect(d.textLabels).toHaveLength(1);
    expect(d.frames[0]?.name).toBe("VPC");
    expect(d.images[0]?.src).toBe("https://example.com/logo.png");
    expect(d.nodes[0]?.link).toBe("https://example.com/doc");
    expect(d.nodes[0]?.locked).toBe(true);
    const again = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
    expect(again).toEqual(d);
  });

  it("renders text labels and frames in SVG export", () => {
    const d = emptyDiagram();
    d.textLabels.push({ id: "tl", x: 5, y: 8, text: "Note A & B" });
    d.frames.push({ id: "fr", name: "Zone", x: 0, y: 40, w: 200, h: 100 });
    const svg = renderSVG(d, { showGrid: false });
    expect(svg).toContain("Note A &amp; B");
    expect(svg).toContain("Zone");
  });
});

describe("diagram round-trip", () => {
  it("parses fixture and renders SVG", () => {
    const d = emptyDiagram();
    d.nodes.push({
      id: "n1",
      text: "A & node",
      x: 100,
      y: 100,
      w: 140,
      h: 64,
      styleId: "yellow",
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

/**
 * Export → import equivalence for the full feature set we expose in the editor.
 * Asserts deep value equality (not just JSON-bytes) so this catches schema drift /
 * accidental coercion across the parse + serialize path.
 */
describe("export → import deep equality", () => {
  function richDiagram(): DiagramV1 {
    const base = emptyDiagram();
    return {
      ...base,
      name: "Rich roundtrip",
      canvas: { showGrid: false, gridSpacing: 24, zoom: 0.85 },
      nodes: [
        {
          id: "n-1",
          text: "Lock & link",
          x: 12,
          y: 34,
          w: 160,
          h: 72,
          styleId: "red",
          shape: "hexagon",
          link: "https://example.com/n-1",
          locked: true,
        },
        {
          id: "n-2",
          text: "Plain",
          x: 220,
          y: 34,
          w: 100,
          h: 50,
          styleId: "blue",
          shape: "roundedRect",
        },
      ],
      edges: [
        {
          id: "e-1",
          from: "n-1",
          to: "n-2",
          sourceHandle: "src-right",
          targetHandle: "tgt-left",
          routing: "curved",
          dash: "dashed",
          head: "triangleArrow",
          tail: "circle",
          label: "rel: ↔ ",
          strokeWidth: 3,
          relationshipPreset: 7,
          link: "https://example.com/edge",
          locked: true,
        },
      ],
      customStyles: [
        ...(base.customStyles ?? []),
        {
          id: "red",
          fillRed: 0.95,
          fillGreen: 0.2,
          fillBlue: 0.2,
          fillAlpha: 1,
          strokeRed: 0.5,
          strokeGreen: 0.1,
          strokeBlue: 0.1,
          strokeAlpha: 1,
          shape: "roundedRect",
        },
        {
          id: "custom-1",
          fillRed: 240,
          fillGreen: 240,
          fillBlue: 240,
          fillAlpha: 200,
          strokeRed: 30,
          strokeGreen: 30,
          strokeBlue: 30,
          strokeAlpha: 255,
          shape: "octagon",
        },
      ],
      textLabels: [
        { id: "t-1", x: 5, y: 200, text: "Free text" },
        { id: "t-2", x: 5, y: 230, text: "" },
      ],
      frames: [
        { id: "f-titled", name: "Network zone", x: 0, y: 0, w: 400, h: 220, color: "blue" },
        { id: "f-untitled", x: 420, y: 0, w: 320, h: 180 },
      ],
      images: [
        {
          id: "i-1",
          src: "https://example.com/logo.png",
          x: 500,
          y: 240,
          w: 120,
          h: 60,
          alt: "Logo",
        },
        {
          id: "i-2",
          src: "https://example.com/no-alt.png",
          x: 500,
          y: 320,
          w: 80,
          h: 80,
        },
      ],
    };
  }

  it("parse(serialize(d)) deep-equals d for a rich diagram", () => {
    const d = richDiagram();
    const back = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
    expect(back).toEqual(d);
  });

  it("survives multiple export → import cycles unchanged", () => {
    const d = richDiagram();
    let current: DiagramV1 = d;
    for (let i = 0; i < 4; i++) {
      const next = parseDiagram(JSON.parse(serializeDiagram(current)) as unknown);
      expect(next).toEqual(d);
      current = next;
    }
  });

  it("preserves resized frame dimensions across export → import", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f1", name: "Area", x: 100, y: 100, w: 320, h: 200 });
    const resized: DiagramV1 = {
      ...d,
      frames: d.frames.map((f) =>
        f.id === "f1" ? { ...f, w: 612.5, h: 380.25, x: 50.5, y: 60.75 } : f,
      ),
    };
    const back = parseDiagram(JSON.parse(serializeDiagram(resized)) as unknown);
    expect(back.frames[0]).toEqual({
      id: "f1",
      name: "Area",
      x: 50.5,
      y: 60.75,
      w: 612.5,
      h: 380.25,
    });
  });

  it("drops the title when frame.name is omitted (no implicit empty string)", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f-untitled", x: 0, y: 0, w: 200, h: 120 });
    const back = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
    expect(back.frames[0]).not.toHaveProperty("name");
  });

  it("clearing a frame title (name: undefined) does not reappear as empty after export → import", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f-x", name: "Old", x: 0, y: 0, w: 200, h: 120 });
    const cleared: DiagramV1 = {
      ...d,
      frames: d.frames.map((f) => {
        const { name: _drop, ...rest } = f;
        return rest;
      }),
    };
    const back = parseDiagram(JSON.parse(serializeDiagram(cleared)) as unknown);
    expect(back.frames[0]?.name).toBeUndefined();
  });

  it("preserves parent → child sub-flow relationships and relative positions", () => {
    const d = emptyDiagram();
    d.customStyles = [
      ...(d.customStyles ?? []),
      {
        id: "red",
        fillRed: 1,
        fillGreen: 0,
        fillBlue: 0,
        fillAlpha: 1,
        strokeRed: 0.5,
        strokeGreen: 0,
        strokeBlue: 0,
        strokeAlpha: 1,
        shape: "roundedRect",
      },
    ];
    d.frames.push({ id: "frame-A", name: "Group", x: 100, y: 200, w: 400, h: 240 });
    d.nodes.push({
      id: "child-1",
      text: "Inside",
      x: 24,
      y: 36,
      w: 140,
      h: 64,
      styleId: "red",
      shape: "roundedRect",
      parentId: "frame-A",
    });
    d.nodes.push({
      id: "free-1",
      text: "Outside",
      x: 600,
      y: 50,
      w: 100,
      h: 50,
      styleId: "blue",
    });
    const back = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
    expect(back.nodes.find((n) => n.id === "child-1")).toEqual({
      id: "child-1",
      text: "Inside",
      x: 24,
      y: 36,
      w: 140,
      h: 64,
      styleId: "red",
      shape: "roundedRect",
      parentId: "frame-A",
    });
    expect(back.nodes.find((n) => n.id === "free-1")).not.toHaveProperty("parentId");
  });
});

describe("renderer absolute positioning for sub-flow children", () => {
  it("renders child node text at parent + relative coords", () => {
    const d = emptyDiagram();
    d.customStyles = [
      ...(d.customStyles ?? []),
      {
        id: "red",
        fillRed: 1,
        fillGreen: 0,
        fillBlue: 0,
        fillAlpha: 1,
        strokeRed: 0.5,
        strokeGreen: 0,
        strokeBlue: 0,
        strokeAlpha: 1,
        shape: "roundedRect",
      },
    ];
    d.frames.push({ id: "frame-A", x: 100, y: 200, w: 400, h: 240 });
    d.nodes.push({
      id: "child-1",
      text: "Inside",
      x: 24,
      y: 36,
      w: 140,
      h: 64,
      styleId: "red",
      shape: "roundedRect",
      parentId: "frame-A",
    });
    const svg = renderSVG(d, { showGrid: false });
    // child center should be at (100 + 24 + 70, 200 + 36 + 32) = (194, 268)
    expect(svg).toContain('x="194"');
    expect(svg).toContain('y="268"');
    expect(svg).toContain("Inside");
  });

  it("falls back to relative coords when the parent frame is missing", () => {
    const d = emptyDiagram();
    d.customStyles = [
      ...(d.customStyles ?? []),
      {
        id: "red",
        fillRed: 1,
        fillGreen: 0,
        fillBlue: 0,
        fillAlpha: 1,
        strokeRed: 0.5,
        strokeGreen: 0,
        strokeBlue: 0,
        strokeAlpha: 1,
        shape: "roundedRect",
      },
    ];
    d.nodes.push({
      id: "orphan",
      text: "No parent",
      x: 10,
      y: 10,
      w: 100,
      h: 50,
      styleId: "red",
      parentId: "missing",
    });
    const svg = renderSVG(d, { showGrid: false });
    expect(svg).toContain("No parent");
  });
});

describe("frame color wire format", () => {
  it("round-trips each frame color token", () => {
    for (const color of ["gray", "blue", "green", "pink", "yellow"] as const) {
      const d = emptyDiagram();
      d.frames.push({
        id: "f1",
        x: 0,
        y: 0,
        w: 100,
        h: 80,
        ...(color === "gray" ? {} : { color }),
      });
      const back = parseDiagram(JSON.parse(serializeDiagram(d)) as unknown);
      if (color === "gray") {
        expect(back.frames[0]).not.toHaveProperty("color");
      } else {
        expect(back.frames[0]?.color).toBe(color);
      }
    }
  });

  it("emits colored frame stroke in SVG export", () => {
    const d = emptyDiagram();
    d.frames.push({ id: "f1", x: 0, y: 0, w: 200, h: 120, color: "blue" });
    const svg = renderSVG(d, { showGrid: false });
    expect(svg).toContain('stroke="#3b82f6"');
  });
});

