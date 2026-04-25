import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import {
  applyRelationshipPreset,
  type EdgeDash,
  type EdgeHead,
  type EdgeRecord,
  type EdgeRouting,
} from "@autodraw/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class AddEdge extends Command {
  static id = "add edge";
  static description = "Add an edge between two nodes";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    from: Flags.string({ description: "Source node id", required: true }),
    to: Flags.string({ description: "Target node id", required: true }),
    routing: Flags.string({
      description: "Edge routing (ignored when --preset is set)",
      options: ["straight", "orthogonal", "curved"],
      default: "orthogonal",
    }),
    dash: Flags.string({
      description: "Dash style (ignored when --preset is set)",
      options: ["solid", "dashed", "dotted"],
      default: "solid",
    }),
    head: Flags.string({
      description: "Arrow head (ignored when --preset is set)",
      options: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
      default: "lineArrow",
    }),
    tail: Flags.string({
      description: "Arrow tail (ignored when --preset is set)",
      options: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
    }),
    label: Flags.string({ description: "Edge label", default: "" }),
    "stroke-width": Flags.integer({
      description: "Stroke width (ignored when --preset is set)",
      default: 1,
      min: 1,
      max: 20,
    }),
    "source-handle": Flags.string({ description: "Source handle id (e.g. src, src-top)" }),
    "target-handle": Flags.string({ description: "Target handle id (e.g. tgt, tgt-bottom)" }),
    preset: Flags.integer({
      description: "Relationship preset index (0-7); sets routing, dash, head, tail, strokeWidth.",
      min: 0,
      max: 7,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddEdge);
    const doc = readDiagram(args.file);
    const id = randomUUID();

    let edge: EdgeRecord;

    if (flags.preset !== undefined && flags.preset !== null) {
      const st = applyRelationshipPreset(flags.preset);
      edge = {
        id,
        from: flags.from,
        to: flags.to,
        label: flags.label,
        routing: st.routing,
        dash: st.dash,
        head: st.head,
        tail: st.tail,
        strokeWidth: st.strokeWidth,
        relationshipPreset: st.relationshipPreset,
      };
    } else {
      edge = {
        id,
        from: flags.from,
        to: flags.to,
        routing: flags.routing as EdgeRouting,
        dash: flags.dash as EdgeDash,
        head: flags.head as EdgeHead,
        tail: (flags.tail as EdgeHead | undefined) ?? "none",
        label: flags.label,
        strokeWidth: flags["stroke-width"],
      };
    }

    if (flags["source-handle"]) edge.sourceHandle = flags["source-handle"];
    if (flags["target-handle"]) edge.targetHandle = flags["target-handle"];

    doc.edges.push(edge);
    writeDiagram(args.file, doc);
    this.log(id);
  }
}
