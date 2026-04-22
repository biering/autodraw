import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import {
  applyRelationshipPreset,
  parseDiagram,
  serializeDiagram,
  type EdgeDash,
  type EdgeHead,
  type EdgeRouting,
} from "@agentsdraw/core";

export default class EdgeAdd extends Command {
  static id = "edge:add";
  static description = "Add an edge between two nodes";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    from: Flags.string({ description: "Source node id", required: true }),
    to: Flags.string({ description: "Target node id", required: true }),
    routing: Flags.string({
      description: "Edge routing",
      options: ["straight", "orthogonal", "curved"],
      default: "orthogonal",
    }),
    dash: Flags.string({
      description: "Dash style",
      options: ["solid", "dashed", "dotted"],
      default: "solid",
    }),
    head: Flags.string({
      description: "Arrow head",
      options: ["none", "arrowOpen", "arrowFilled", "arrowDouble", "square"],
      default: "arrowOpen",
    }),
    label: Flags.string({ description: "Edge label", default: "" }),
    preset: Flags.integer({
      description: "Relationship preset index (0-7). Overrides routing/dash/head when set.",
      min: 0,
      max: 7,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EdgeAdd);
    const doc = parseDiagram(JSON.parse(readFileSync(args.file, "utf8")) as unknown);
    const id = randomUUID();

    if (flags.preset !== undefined && flags.preset !== null) {
      const st = applyRelationshipPreset(flags.preset);
      doc.edges.push({
        id,
        from: flags.from,
        to: flags.to,
        routing: st.routing,
        dash: st.dash,
        head: st.head,
        tail: st.tail,
        label: flags.label,
        strokeWidth: st.strokeWidth,
        relationshipPreset: st.relationshipPreset,
      });
    } else {
      doc.edges.push({
        id,
        from: flags.from,
        to: flags.to,
        routing: flags.routing as EdgeRouting,
        dash: flags.dash as EdgeDash,
        head: flags.head as EdgeHead,
        tail: "none",
        label: flags.label,
        strokeWidth: 1,
      });
    }

    writeFileSync(args.file, serializeDiagram(doc), "utf8");
    this.log(id);
  }
}
