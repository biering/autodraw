import { NODE_BACKGROUND_FILL_OPACITY } from "./palettes.js";
import type { NodeStyleDefinition } from "./schema.js";

/**
 * Strokes at full alpha read much heavier than node bodies, which use
 * {@link NODE_BACKGROUND_FILL_OPACITY}. Canvas and SVG apply this factor to stroke alpha
 * so borders stay in the same visual weight class as the wash fill.
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

/** Canvas / HTML: single `rgba()` string for the translucent node body. */
export function resolvedNodeBodyFillRgba(style: NodeBodyFillChannels): string {
  return rgbaFromLinearRgb(style.fillRed, style.fillGreen, style.fillBlue, NODE_BACKGROUND_FILL_OPACITY);
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

/** SVG uses `fill` + `fill-opacity` / `stroke` + `stroke-opacity` (no alpha in rgb()). */
export function resolvedNodeSvgFillParts(style: NodeBodyFillChannels): {
  fillRgb: string;
  fillOpacity: number;
} {
  return {
    fillRgb: rgbFromLinearRgb(style.fillRed, style.fillGreen, style.fillBlue),
    fillOpacity: NODE_BACKGROUND_FILL_OPACITY,
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
export const FALLBACK_NODE_BODY_FILL_RGBA = rgbaFromLinearRgb(
  238 / BYTE,
  238 / BYTE,
  238 / BYTE,
  NODE_BACKGROUND_FILL_OPACITY,
);

export const FALLBACK_NODE_BODY_STROKE_RGBA = rgbaFromLinearRgb(
  0x44 / BYTE,
  0x44 / BYTE,
  0x44 / BYTE,
  1,
);
