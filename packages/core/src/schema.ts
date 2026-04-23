import { z } from "zod";

export const palettePresetSchema = z.enum(["universal", "grayscale", "flowchart", "empty"]);

export const nodeShapeSchema = z.enum([
  "rectangle",
  "roundedRect",
  "oval",
  "circle",
  "diamond",
  "hexagon",
  "octagon",
  "parallelogram",
]);

export const edgeRoutingSchema = z.enum(["straight", "orthogonal", "curved"]);
export const edgeDashSchema = z.enum(["solid", "dashed", "dotted"]);
export const edgeHeadSchema = z.enum([
  "none",
  "lineArrow",
  "triangleArrow",
  "triangleReversed",
  "circle",
  "diamond",
]);

/** Pre-2026 diagrams used a different marker vocabulary; map it to the current set. */
const LEGACY_EDGE_HEAD_MAP: Record<string, z.infer<typeof edgeHeadSchema>> = {
  arrowOpen: "lineArrow",
  arrowFilled: "triangleArrow",
  arrowDouble: "triangleArrow",
  square: "diamond",
};

function migrateEdgeHead(value: unknown): z.infer<typeof edgeHeadSchema> {
  if (typeof value !== "string") return "none";
  if (value in LEGACY_EDGE_HEAD_MAP) return LEGACY_EDGE_HEAD_MAP[value]!;
  return edgeHeadSchema.options.includes(value as z.infer<typeof edgeHeadSchema>)
    ? (value as z.infer<typeof edgeHeadSchema>)
    : "none";
}

export const nodeStyleDefinitionSchema = z.object({
  id: z.string(),
  fillRed: z.number(),
  fillGreen: z.number(),
  fillBlue: z.number(),
  fillAlpha: z.number(),
  strokeRed: z.number(),
  strokeGreen: z.number(),
  strokeBlue: z.number(),
  strokeAlpha: z.number(),
  shape: nodeShapeSchema,
});

export const nodeSchema = z.object({
  id: z.string(),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  styleId: z.string(),
  shape: nodeShapeSchema.optional(),
});

export const edgeSchema = z.object({
  id: z.string(),
  from: z.string(),
  to: z.string(),
  /** React Flow handle id on the source node (e.g. `src`, `src-top`). */
  sourceHandle: z.string().optional(),
  /** React Flow handle id on the target node (e.g. `tgt`, `tgt-bottom`). */
  targetHandle: z.string().optional(),
  routing: edgeRoutingSchema,
  dash: edgeDashSchema,
  head: edgeHeadSchema,
  tail: edgeHeadSchema.optional(),
  label: z.string(),
  strokeWidth: z.number().optional(),
  relationshipPreset: z.number().int().optional(),
});

export const canvasSchema = z.object({
  showGrid: z.boolean(),
  gridSpacing: z.number(),
  zoom: z.number(),
});

export const diagramSchemaV1 = z.object({
  version: z.literal(1),
  palette: palettePresetSchema,
  canvas: canvasSchema,
  nodes: z.array(nodeSchema),
  edges: z.array(edgeSchema),
  customStyles: z.array(nodeStyleDefinitionSchema).optional(),
});

export type PalettePreset = z.infer<typeof palettePresetSchema>;
export type NodeShape = z.infer<typeof nodeShapeSchema>;
export type EdgeRouting = z.infer<typeof edgeRoutingSchema>;
export type EdgeDash = z.infer<typeof edgeDashSchema>;
export type EdgeHead = z.infer<typeof edgeHeadSchema>;
export type NodeStyleDefinition = z.infer<typeof nodeStyleDefinitionSchema>;
export type NodeRecord = z.infer<typeof nodeSchema>;
export type EdgeRecord = z.infer<typeof edgeSchema>;
export type CanvasSettings = z.infer<typeof canvasSchema>;
export type DiagramV1 = z.infer<typeof diagramSchemaV1>;

/** Permissive edge shape: accepts legacy `head`/`tail` names so {@link parseDiagram} can migrate them. */
const looseEdgeSchema = edgeSchema.extend({
  head: z.string(),
  tail: z.string().optional(),
});

const looseDiagram = z
  .object({
    version: z.number(),
    palette: palettePresetSchema,
    canvas: canvasSchema.partial().optional(),
    nodes: z.array(nodeSchema),
    edges: z.array(looseEdgeSchema),
    customStyles: z.array(nodeStyleDefinitionSchema).optional(),
  })
  .passthrough();

/** Parse and migrate unknown JSON to DiagramV1. */
export function parseDiagram(raw: unknown): DiagramV1 {
  const parsed = looseDiagram.parse(raw);
  if (parsed.version !== 1) {
    throw new Error(`Unsupported diagram version: ${parsed.version}`);
  }
  const canvas = {
    showGrid: parsed.canvas?.showGrid ?? true,
    gridSpacing: parsed.canvas?.gridSpacing ?? 16,
    zoom: parsed.canvas?.zoom ?? 1,
  };
  return diagramSchemaV1.parse({
    version: 1 as const,
    palette: parsed.palette,
    canvas,
    nodes: parsed.nodes.map((n) => ({
      ...n,
      shape: n.shape ?? "roundedRect",
    })),
    edges: parsed.edges.map((e) => ({
      ...e,
      head: migrateEdgeHead(e.head),
      tail: migrateEdgeHead(e.tail ?? "none"),
      strokeWidth: e.strokeWidth ?? 1,
    })),
    customStyles: parsed.customStyles ?? [],
  });
}

export function serializeDiagram(d: DiagramV1): string {
  return JSON.stringify(d, null, 2);
}

export function emptyDiagram(palette: PalettePreset = "universal"): DiagramV1 {
  return {
    version: 1,
    palette,
    canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
    nodes: [],
    edges: [],
    customStyles: [],
  };
}
