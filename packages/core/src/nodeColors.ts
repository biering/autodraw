import type { NodeStyleDefinition } from "./schema.js";

/**
 * Strokes at full alpha read much heavier than node bodies at full opacity.
 * Canvas and SVG scale stroke alpha by this factor so borders stay visually balanced.
 */
export const NODE_STROKE_ALPHA_MULTIPLIER = 0.5;

const BYTE = 255;

function byteFromLinear(channel: number): number {
  return Math.round(channel * BYTE);
}

/** Linear RGB channels (0–1) and alpha → CSS `rgba(r,g,b,a)` with 8-bit rounding. */
export function rgbaFromLinearRgb(r: number, g: number, b: number, a: number): string {
  return `rgba(${byteFromLinear(r)},${byteFromLinear(g)},${byteFromLinear(b)},${a})`;
}

/** Linear RGB (0–1) → CSS `rgb(r,g,b)` with 8-bit rounding (opacity separate). */
export function rgbFromLinearRgb(r: number, g: number, b: number): string {
  return `rgb(${byteFromLinear(r)},${byteFromLinear(g)},${byteFromLinear(b)})`;
}

export function effectiveNodeStrokeAlpha(strokeAlpha: number): number {
  return strokeAlpha * NODE_STROKE_ALPHA_MULTIPLIER;
}

export type NodeBodyFillChannels = Pick<NodeStyleDefinition, "fillRed" | "fillGreen" | "fillBlue">;

export type NodeBodyStrokeChannels = Pick<
  NodeStyleDefinition,
  "strokeRed" | "strokeGreen" | "strokeBlue" | "strokeAlpha"
>;

/** Editor canvas background mode for node chrome (diagram surface only). */
export type NodeCanvasTheme = "light" | "dark";

/** Light canvas: mix body fill toward white so borders (same hue, ~50% alpha) read as edges, not duplicate fills. */
const LIGHT_FILL_MIX = 0.46;

const DARK_FILL_MIX = 0.56;
const DARK_FILL_ANCHOR_R = 0.1;
const DARK_FILL_ANCHOR_G = 0.1;
const DARK_FILL_ANCHOR_B = 0.12;

function blendFillForLightCanvas(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const w = LIGHT_FILL_MIX;
  return {
    r: r * (1 - w) + w,
    g: g * (1 - w) + w,
    b: b * (1 - w) + w,
  };
}

function blendFillForDarkCanvas(r: number, g: number, b: number): { r: number; g: number; b: number } {
  const w = DARK_FILL_MIX;
  return {
    r: r * (1 - w) + DARK_FILL_ANCHOR_R * w,
    g: g * (1 - w) + DARK_FILL_ANCHOR_G * w,
    b: b * (1 - w) + DARK_FILL_ANCHOR_B * w,
  };
}

function liftStrokeForDarkCanvas(style: NodeBodyStrokeChannels): { r: number; g: number; b: number } {
  const lift = 0.44;
  return {
    r: Math.min(1, style.strokeRed * (1 - lift) + lift),
    g: Math.min(1, style.strokeGreen * (1 - lift) + lift),
    b: Math.min(1, style.strokeBlue * (1 - lift) + lift),
  };
}

/**
 * Canvas / HTML: opaque CSS `rgb()` for the node body (no alpha channel).
 * Ignores {@link NodeStyleDefinition.fillAlpha}; bodies are always fully opaque.
 */
export function resolvedNodeBodyFillRgba(style: NodeBodyFillChannels, _styleId?: string): string {
  return rgbFromLinearRgb(style.fillRed, style.fillGreen, style.fillBlue);
}

/** Node body fill for the editor canvas; dark theme uses muted card fills. */
export function resolvedNodeBodyFillForCanvas(
  style: NodeBodyFillChannels,
  styleId: string | undefined,
  theme: NodeCanvasTheme,
): string {
  if (theme === "light") {
    const m = blendFillForLightCanvas(style.fillRed, style.fillGreen, style.fillBlue);
    return rgbFromLinearRgb(m.r, m.g, m.b);
  }
  const m = blendFillForDarkCanvas(style.fillRed, style.fillGreen, style.fillBlue);
  return rgbFromLinearRgb(m.r, m.g, m.b);
}

/** Canvas / HTML: single `rgba()` string for the node border. */
export function resolvedNodeBodyStrokeRgba(style: NodeBodyStrokeChannels): string {
  return rgbaFromLinearRgb(
    style.strokeRed,
    style.strokeGreen,
    style.strokeBlue,
    effectiveNodeStrokeAlpha(style.strokeAlpha),
  );
}

/** Node border for the editor canvas; dark theme lifts stroke for contrast on dark fills. */
export function resolvedNodeBodyStrokeForCanvas(
  style: NodeBodyStrokeChannels,
  theme: NodeCanvasTheme,
): string {
  if (theme === "light") {
    return resolvedNodeBodyStrokeRgba(style);
  }
  const u = liftStrokeForDarkCanvas(style);
  const a = Math.min(0.92, effectiveNodeStrokeAlpha(style.strokeAlpha) * 1.75);
  return rgbaFromLinearRgb(u.r, u.g, u.b, a);
}

/** SVG uses `fill` + `fill-opacity` / `stroke` + `stroke-opacity` (no alpha in rgb()). */
export function resolvedNodeSvgFillParts(style: NodeBodyFillChannels, _styleId?: string): {
  fillRgb: string;
  fillOpacity: number;
} {
  return {
    fillRgb: rgbFromLinearRgb(style.fillRed, style.fillGreen, style.fillBlue),
    fillOpacity: 1,
  };
}

export function resolvedNodeSvgStrokeParts(style: NodeBodyStrokeChannels): {
  strokeRgb: string;
  strokeOpacity: number;
} {
  return {
    strokeRgb: rgbFromLinearRgb(style.strokeRed, style.strokeGreen, style.strokeBlue),
    strokeOpacity: effectiveNodeStrokeAlpha(style.strokeAlpha),
  };
}

/** When `styleId` does not resolve; matches previous `#eee` / `#444` fallbacks. */
export const FALLBACK_NODE_BODY_FILL_RGBA = rgbFromLinearRgb(
  238 / BYTE,
  238 / BYTE,
  238 / BYTE,
);

export const FALLBACK_NODE_BODY_STROKE_RGBA = rgbaFromLinearRgb(
  0x44 / BYTE,
  0x44 / BYTE,
  0x44 / BYTE,
  1,
);

export const FALLBACK_NODE_BODY_FILL_DARK = rgbFromLinearRgb(0.15, 0.15, 0.17);

export const FALLBACK_NODE_BODY_STROKE_DARK = rgbaFromLinearRgb(0.58, 0.6, 0.66, 0.9);
