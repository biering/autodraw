import { describe, expect, it } from "vitest";
import { NODE_BACKGROUND_FILL_OPACITY } from "./palettes.js";
import {
  effectiveNodeStrokeAlpha,
  FALLBACK_NODE_BODY_FILL_RGBA,
  FALLBACK_NODE_BODY_STROKE_RGBA,
  NODE_STROKE_ALPHA_MULTIPLIER,
  resolvedNodeBodyFillRgba,
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

describe("resolvedNodeBodyFillRgba", () => {
  it("uses NODE_BACKGROUND_FILL_OPACITY on fill channels", () => {
    const s = { fillRed: 1, fillGreen: 0, fillBlue: 0 };
    expect(resolvedNodeBodyFillRgba(s)).toBe(`rgba(255,0,0,${NODE_BACKGROUND_FILL_OPACITY})`);
  });
});

describe("resolvedNodeBodyStrokeRgba", () => {
  it("scales stroke alpha for parity with wash fill", () => {
    const s = { strokeRed: 0, strokeGreen: 0.2, strokeBlue: 0.4, strokeAlpha: 1 };
    expect(resolvedNodeBodyStrokeRgba(s)).toBe(
      `rgba(0,51,102,${effectiveNodeStrokeAlpha(1)})`,
    );
  });
});

describe("resolvedNodeSvgFillParts / resolvedNodeSvgStrokeParts", () => {
  it("splits rgb and opacity the way renderSVG expects", () => {
    const fill = resolvedNodeSvgFillParts({ fillRed: 0.2, fillGreen: 0.4, fillBlue: 0.6 });
    expect(fill.fillRgb).toBe("rgb(51,102,153)");
    expect(fill.fillOpacity).toBe(NODE_BACKGROUND_FILL_OPACITY);

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
  it("matches legacy #eee wash and #444 border (via linear channels)", () => {
    expect(FALLBACK_NODE_BODY_FILL_RGBA).toBe(
      `rgba(238,238,238,${NODE_BACKGROUND_FILL_OPACITY})`,
    );
    expect(FALLBACK_NODE_BODY_STROKE_RGBA).toBe("rgba(68,68,68,1)");
  });
});
