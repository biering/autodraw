import type { NodeShape, NodeStyleDefinition, PalettePreset } from "./schema.js";

function style(
  id: string,
  fill: [number, number, number, number],
  stroke: [number, number, number, number],
  shape: NodeShape
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

const universal: NodeStyleDefinition[] = [
  style("yellow", [1, 0.95, 0.6, 0.85], [0.85, 0.65, 0, 1], "roundedRect"),
  style("orange", [1, 0.85, 0.65, 0.9], [0.9, 0.45, 0.1, 1], "roundedRect"),
  style("red", [1, 0.85, 0.85, 0.95], [0.85, 0.2, 0.2, 1], "roundedRect"),
  style("pink", [1, 0.88, 0.95, 0.95], [0.9, 0.35, 0.65, 1], "roundedRect"),
  style("purple", [0.92, 0.85, 1, 0.95], [0.45, 0.25, 0.75, 1], "roundedRect"),
  style("blue", [0.85, 0.92, 1, 0.95], [0.2, 0.45, 0.85, 1], "roundedRect"),
  style("green", [0.85, 0.95, 0.88, 0.95], [0.15, 0.55, 0.3, 1], "roundedRect"),
  style("gray", [0.92, 0.92, 0.92, 1], [0.45, 0.45, 0.48, 1], "roundedRect"),
  style("shape_rect", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "rectangle"),
  style("shape_rounded", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "roundedRect"),
  style("shape_oval", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "oval"),
  style("shape_circle", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "circle"),
  style("shape_diamond", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "diamond"),
  style("shape_hex", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "hexagon"),
  style("shape_oct", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "octagon"),
  style("shape_para", [1, 1, 1, 1], [0.35, 0.35, 0.38, 1], "parallelogram"),
];

function toGray(s: NodeStyleDefinition): NodeStyleDefinition {
  const y = (f: number, g: number, b: number) => 0.299 * f + 0.587 * g + 0.114 * b;
  const fy = y(s.fillRed, s.fillGreen, s.fillBlue);
  const sy = y(s.strokeRed, s.strokeGreen, s.strokeBlue);
  return {
    ...s,
    fillRed: fy,
    fillGreen: fy,
    fillBlue: fy,
    strokeRed: sy,
    strokeGreen: sy,
    strokeBlue: sy,
  };
}

const grayscale = universal.map(toGray);

const flowchart: NodeStyleDefinition[] = [
  style("fc_process", [1, 1, 1, 1], [0, 0, 0, 1], "rectangle"),
  style("fc_decision", [1, 1, 1, 1], [0, 0, 0, 1], "diamond"),
  style("fc_terminator", [1, 1, 1, 1], [0, 0, 0, 1], "oval"),
  style("fc_io", [1, 1, 1, 1], [0, 0, 0, 1], "parallelogram"),
  style("fc_connector", [0.95, 0.95, 0.95, 1], [0.2, 0.2, 0.2, 1], "circle"),
  style("fc_doc", [1, 1, 0.92, 1], [0.2, 0.2, 0.2, 1], "roundedRect"),
  style("fc_prep", [0.92, 0.92, 1, 1], [0.2, 0.2, 0.2, 1], "hexagon"),
  style("fc_manual", [1, 0.95, 0.9, 1], [0.2, 0.2, 0.2, 1], "roundedRect"),
];

export function paletteStyles(preset: PalettePreset): NodeStyleDefinition[] {
  switch (preset) {
    case "universal":
      return universal;
    case "grayscale":
      return grayscale;
    case "flowchart":
      return flowchart;
    case "empty":
      return [];
  }
}

export function defaultStyleId(preset: PalettePreset): string {
  const s = paletteStyles(preset);
  return s[0]?.id ?? "yellow";
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
  presetIndex: number
): Pick<
  import("./schema.js").EdgeRecord,
  "routing" | "dash" | "head" | "tail" | "strokeWidth" | "relationshipPreset"
> {
  const idx = Math.max(0, Math.min(7, presetIndex));
  const base = { relationshipPreset: idx };
  switch (idx) {
    case 0:
      return { ...base, routing: "straight", dash: "solid", head: "arrowOpen", tail: "none", strokeWidth: 1 };
    case 1:
      return { ...base, routing: "orthogonal", dash: "solid", head: "arrowOpen", tail: "none", strokeWidth: 1 };
    case 2:
      return { ...base, routing: "orthogonal", dash: "solid", head: "arrowOpen", tail: "none", strokeWidth: 2.5 };
    case 3:
      return { ...base, routing: "orthogonal", dash: "solid", head: "arrowDouble", tail: "arrowOpen", strokeWidth: 1 };
    case 4:
      return { ...base, routing: "orthogonal", dash: "dashed", head: "arrowOpen", tail: "none", strokeWidth: 1 };
    case 5:
      return { ...base, routing: "orthogonal", dash: "dashed", head: "arrowOpen", tail: "square", strokeWidth: 1 };
    case 6:
      return { ...base, routing: "orthogonal", dash: "dashed", head: "square", tail: "none", strokeWidth: 1 };
    case 7:
      return { ...base, routing: "orthogonal", dash: "dotted", head: "arrowOpen", tail: "none", strokeWidth: 1 };
    default:
      return { ...base, routing: "orthogonal", dash: "solid", head: "arrowOpen", tail: "none", strokeWidth: 1 };
  }
}

export function resolvedStyles(
  diagram: import("./schema.js").DiagramV1
): NodeStyleDefinition[] {
  return [...paletteStyles(diagram.palette), ...(diagram.customStyles ?? [])];
}

export function styleById(
  diagram: import("./schema.js").DiagramV1,
  id: string
): NodeStyleDefinition | undefined {
  return resolvedStyles(diagram).find((s) => s.id === id);
}
