import { Args, Command, Flags } from "@oclif/core";
import {
  applyRelationshipPreset,
  type EdgeDash,
  type EdgeHead,
  type EdgeRouting,
} from "@agentsdraw/core";
import { readDiagram, requireEdge, writeDiagram } from "../../internal/io.js";

export default class PatchEdge extends Command {
  static id = "patch edge";
  static description = "Update fields on an existing edge";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Edge id", required: true }),
    routing: Flags.string({
      description: "Edge routing",
      options: ["straight", "orthogonal", "curved"],
    }),
    dash: Flags.string({
      description: "Dash style",
      options: ["solid", "dashed", "dotted"],
    }),
    head: Flags.string({
      description: "Arrow head",
      options: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
    }),
    tail: Flags.string({
      description: "Arrow tail",
      options: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
    }),
    label: Flags.string({ description: "Edge label" }),
    "stroke-width": Flags.integer({
      description: "Stroke width",
      min: 1,
      max: 20,
    }),
    "source-handle": Flags.string({ description: "Source handle id" }),
    "target-handle": Flags.string({ description: "Target handle id" }),
    preset: Flags.integer({
      description:
        "Relationship preset (0-7); applies routing/dash/head/tail/stroke, then other flags override.",
      min: 0,
      max: 7,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PatchEdge);
    const doc = readDiagram(args.file);
    requireEdge(doc, flags.id);

    const hasPatch =
      flags.routing !== undefined ||
      flags.dash !== undefined ||
      flags.head !== undefined ||
      flags.tail !== undefined ||
      flags.label !== undefined ||
      flags["stroke-width"] !== undefined ||
      flags["source-handle"] !== undefined ||
      flags["target-handle"] !== undefined ||
      flags.preset !== undefined;

    if (!hasPatch) {
      this.error(
        "Provide at least one of: --routing, --dash, --head, --tail, --label, --stroke-width, --source-handle, --target-handle, --preset",
      );
    }

    const idx = doc.edges.findIndex((e) => e.id === flags.id);
    if (idx === -1) this.error(`Unknown edge id: ${flags.id}`);
    let e = { ...doc.edges[idx]! };

    if (flags.preset !== undefined && flags.preset !== null) {
      Object.assign(e, applyRelationshipPreset(flags.preset));
    }
    if (flags.routing !== undefined) e.routing = flags.routing as EdgeRouting;
    if (flags.dash !== undefined) e.dash = flags.dash as EdgeDash;
    if (flags.head !== undefined) e.head = flags.head as EdgeHead;
    if (flags.tail !== undefined) e.tail = flags.tail as EdgeHead;
    if (flags.label !== undefined) e.label = flags.label;
    if (flags["stroke-width"] !== undefined) e.strokeWidth = flags["stroke-width"];
    if (flags["source-handle"] !== undefined) {
      if (flags["source-handle"] === "") delete e.sourceHandle;
      else e.sourceHandle = flags["source-handle"];
    }
    if (flags["target-handle"] !== undefined) {
      if (flags["target-handle"] === "") delete e.targetHandle;
      else e.targetHandle = flags["target-handle"];
    }

    doc.edges[idx] = e;
    writeDiagram(args.file, doc);
  }
}
