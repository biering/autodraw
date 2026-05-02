import type { NodeShape, NodeStyleDefinition } from "./schema.js";

function style(
  id: string,
  fill: [number, number, number, number],
  stroke: [number, number, number, number],
  shape: NodeShape,
): NodeStyleDefinition {
  return {
    id,
    fillRed: fill[0],
    fillGreen: fill[1],
    fillBlue: fill[2],
    fillAlpha: fill[3],
    strokeRed: stroke[0],
    strokeGreen: stroke[1],
    strokeBlue: stroke[2],
    strokeAlpha: stroke[3],
    shape,
  };
}

/** `#RRGGBB` → linear RGB channels 0–1. */
function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const n = Number.parseInt(h, 16);
  return [(n >> 16) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

function styleFromHex(
  id: string,
  fillHex: string,
  shape: NodeShape = "roundedRect",
): NodeStyleDefinition {
  const [r, g, b] = hexRgb(fillHex);
  return style(id, [r, g, b, 1], [r, g, b, 1], shape);
}

/**
 * Default node fills (editor + export): brand hexes; `red` / `pink` reuse coral and purple for older `styleId` values.
 */
const defaultSwatches: NodeStyleDefinition[] = [
  styleFromHex("yellow", "#F0EC57"),
  styleFromHex("orange", "#E2856E"),
  styleFromHex("pink", "#6A66A3"),
  styleFromHex("blue", "#32908F"),
  styleFromHex("green", "#26C485"),
  styleFromHex("lime", "#E0EF91"),
  style("gray", [0.82, 0.82, 0.84, 1], [0.45, 0.45, 0.48, 1], "roundedRect"),
];

/** Shallow copy of default brand swatches for new diagrams (`emptyDiagram`). */
export function defaultDiagramCustomStyles(): NodeStyleDefinition[] {
  return defaultSwatches.map((s) => ({ ...s }));
}

export function resolvedStyles(diagram: import("./schema.js").DiagramV1): NodeStyleDefinition[] {
  return diagram.customStyles ?? [];
}

export function defaultStyleId(diagram: import("./schema.js").DiagramV1): string {
  return diagram.customStyles?.[0]?.id ?? "yellow";
}

export function styleById(
  diagram: import("./schema.js").DiagramV1,
  id: string,
): NodeStyleDefinition | undefined {
  return resolvedStyles(diagram).find((s) => s.id === id);
}

/** Relationship popover presets 0..7 */
export const relationshipPresets = [
  "straightSolidOpenArrow",
  "orthogonalSolidOpenArrow",
  "orthogonalBoldOpenArrow",
  "orthogonalDoubleArrow",
  "orthogonalDashedOpenArrow",
  "dashedDotStartOpenArrow",
  "orthogonalDashedSquareEnd",
  "orthogonalDottedOpenArrow",
] as const;

export type RelationshipPresetId = (typeof relationshipPresets)[number];

export function applyRelationshipPreset(
  presetIndex: number,
): Pick<
  import("./schema.js").EdgeRecord,
  "routing" | "dash" | "head" | "tail" | "strokeWidth" | "relationshipPreset"
> {
  const idx = Math.max(0, Math.min(7, presetIndex));
  const base = { relationshipPreset: idx };
  switch (idx) {
    case 0:
      return {
        ...base,
        routing: "straight",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        strokeWidth: 1,
      };
    case 1:
      return {
        ...base,
        routing: "orthogonal",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        strokeWidth: 1,
      };
    case 2:
      return {
        ...base,
        routing: "orthogonal",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        strokeWidth: 2.5,
      };
    case 3:
      return {
        ...base,
        routing: "orthogonal",
        dash: "solid",
        head: "triangleArrow",
        tail: "lineArrow",
        strokeWidth: 1,
      };
    case 4:
      return {
        ...base,
        routing: "orthogonal",
        dash: "dashed",
        head: "lineArrow",
        tail: "none",
        strokeWidth: 1,
      };
    case 5:
      return {
        ...base,
        routing: "orthogonal",
        dash: "dashed",
        head: "lineArrow",
        tail: "diamond",
        strokeWidth: 1,
      };
    case 6:
      return {
        ...base,
        routing: "orthogonal",
        dash: "dashed",
        head: "diamond",
        tail: "none",
        strokeWidth: 1,
      };
    case 7:
      return {
        ...base,
        routing: "orthogonal",
        dash: "dotted",
        head: "lineArrow",
        tail: "none",
        strokeWidth: 1,
      };
    default:
      return {
        ...base,
        routing: "orthogonal",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        strokeWidth: 1,
      };
  }
}
