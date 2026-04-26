import { describe, expect, it } from "vitest";
import {
  effectiveNodeStrokeAlpha,
  FALLBACK_NODE_BODY_FILL_RGBA,
  FALLBACK_NODE_BODY_STROKE_RGBA,
  NODE_STROKE_ALPHA_MULTIPLIER,
  resolvedNodeBodyFillForCanvas,
  resolvedNodeBodyFillRgba,
  resolvedNodeBodyStrokeForCanvas,
  resolvedNodeBodyStrokeRgba,
  resolvedNodeSvgFillParts,
  resolvedNodeSvgStrokeParts,
  rgbFromLinearRgb,
  rgbaFromLinearRgb,
} from "./nodeColors.js";

describe("rgbaFromLinearRgb", () => {
  it("maps primaries and alpha to CSS rgba()", () => {
    expect(rgbaFromLinearRgb(1, 0, 0, 0.5)).toBe("rgba(255,0,0,0.5)");
    expect(rgbaFromLinearRgb(0, 1, 0, 1)).toBe("rgba(0,255,0,1)");
  });

  it("rounds 8-bit channels (half values round to nearest int)", () => {
    expect(rgbaFromLinearRgb(0.5, 0.5, 0.5, 1)).toBe("rgba(128,128,128,1)");
  });
});

describe("rgbFromLinearRgb", () => {
  it("omits alpha for SVG-style rgb()", () => {
    expect(rgbFromLinearRgb(1, 0.5, 0)).toBe("rgb(255,128,0)");
  });
});

describe("effectiveNodeStrokeAlpha", () => {
  it("applies NODE_STROKE_ALPHA_MULTIPLIER", () => {
    expect(effectiveNodeStrokeAlpha(1)).toBe(NODE_STROKE_ALPHA_MULTIPLIER);
    expect(effectiveNodeStrokeAlpha(0.8)).toBeCloseTo(0.8 * NODE_STROKE_ALPHA_MULTIPLIER);
  });
});

describe("resolvedNodeBodyFillForCanvas", () => {
  it("lightens fills for light canvas theme vs raw palette", () => {
    const s = { fillRed: 0x26 / 255, fillGreen: 0xc4 / 255, fillBlue: 0x85 / 255 };
    const light = resolvedNodeBodyFillForCanvas(s, "green", "light");
    expect(light).not.toBe(resolvedNodeBodyFillRgba(s, "green"));
    expect(light).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });

  it("darkens fills for dark canvas theme", () => {
    const s = { fillRed: 0x26 / 255, fillGreen: 0xc4 / 255, fillBlue: 0x85 / 255 };
    const dark = resolvedNodeBodyFillForCanvas(s, "green", "dark");
    expect(dark).not.toBe(resolvedNodeBodyFillRgba(s, "green"));
    expect(dark).toMatch(/^rgb\(\d+,\d+,\d+\)$/);
  });
});

describe("resolvedNodeBodyStrokeForCanvas", () => {
  it("matches light theme strokes", () => {
    const s = { strokeRed: 0.2, strokeGreen: 0.4, strokeBlue: 0.6, strokeAlpha: 1 };
    expect(resolvedNodeBodyStrokeForCanvas(s, "light")).toBe(resolvedNodeBodyStrokeRgba(s));
  });

  it("returns rgba with higher alpha for dark canvas theme", () => {
    const s = { strokeRed: 0.2, strokeGreen: 0.4, strokeBlue: 0.6, strokeAlpha: 1 };
    const out = resolvedNodeBodyStrokeForCanvas(s, "dark");
    expect(out.startsWith("rgba(")).toBe(true);
    expect(out).not.toBe(resolvedNodeBodyStrokeRgba(s));
  });
});

describe("resolvedNodeBodyFillRgba", () => {
  it("returns opaque rgb() on fill channels", () => {
    const s = { fillRed: 1, fillGreen: 0, fillBlue: 0 };
    expect(resolvedNodeBodyFillRgba(s)).toBe("rgb(255,0,0)");
  });

  it("uses palette channels for universal brand green (#26C485)", () => {
    const s = { fillRed: 0x26 / 255, fillGreen: 0xc4 / 255, fillBlue: 0x85 / 255 };
    expect(resolvedNodeBodyFillRgba(s)).toBe("rgb(38,196,133)");
    expect(resolvedNodeBodyFillRgba(s, "green")).toBe("rgb(38,196,133)");
  });

  it("uses neutral gray for grayscale green (id green, gray fill)", () => {
    const s = { fillRed: 0.55, fillGreen: 0.56, fillBlue: 0.54 };
    expect(resolvedNodeBodyFillRgba(s, "green")).toBe("rgb(140,143,138)");
  });
});

describe("resolvedNodeBodyStrokeRgba", () => {
  it("scales stroke alpha for visual balance with solid fills", () => {
    const s = { strokeRed: 0, strokeGreen: 0.2, strokeBlue: 0.4, strokeAlpha: 1 };
    expect(resolvedNodeBodyStrokeRgba(s)).toBe(`rgba(0,51,102,${effectiveNodeStrokeAlpha(1)})`);
  });
});

describe("resolvedNodeSvgFillParts / resolvedNodeSvgStrokeParts", () => {
  it("splits rgb and opacity the way renderSVG expects", () => {
    const fill = resolvedNodeSvgFillParts({ fillRed: 0.2, fillGreen: 0.4, fillBlue: 0.6 });
    expect(fill.fillRgb).toBe("rgb(51,102,153)");
    expect(fill.fillOpacity).toBe(1);

    const greenFill = resolvedNodeSvgFillParts(
      {
        fillRed: 0x26 / 255,
        fillGreen: 0xc4 / 255,
        fillBlue: 0x85 / 255,
      },
      "green",
    );
    expect(greenFill.fillRgb).toBe("rgb(38,196,133)");
    expect(greenFill.fillOpacity).toBe(1);

    const stroke = resolvedNodeSvgStrokeParts({
      strokeRed: 1,
      strokeGreen: 0,
      strokeBlue: 0,
      strokeAlpha: 1,
    });
    expect(stroke.strokeRgb).toBe("rgb(255,0,0)");
    expect(stroke.strokeOpacity).toBe(effectiveNodeStrokeAlpha(1));
  });
});

describe("fallback node colors", () => {
  it("matches legacy #eee fill and #444 border (via linear channels)", () => {
    expect(FALLBACK_NODE_BODY_FILL_RGBA).toBe("rgb(238,238,238)");
    expect(FALLBACK_NODE_BODY_STROKE_RGBA).toBe("rgba(68,68,68,1)");
  });
});
