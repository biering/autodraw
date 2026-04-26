import { Args, Command } from "@oclif/core";
import { readDiagram } from "../../internal/io.js";

function cell(v: string | number | undefined | null): string {
  if (v === undefined || v === null) return "";
  return String(v);
}

export default class ListEdges extends Command {
  static id = "list edges";
  static description = "List edges in a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ListEdges);
    const doc = readDiagram(args.file);
    this.log(
      "id\tfrom\tto\trouting\tdash\thead\ttail\tlabel\tstrokeWidth\tsourceHandle\ttargetHandle\trelationshipPreset",
    );
    for (const e of doc.edges) {
      this.log(
        [
          e.id,
          e.from,
          e.to,
          e.routing,
          e.dash,
          e.head,
          cell(e.tail),
          e.label.replace(/\t/g, " "),
          cell(e.strokeWidth),
          cell(e.sourceHandle),
          cell(e.targetHandle),
          cell(e.relationshipPreset),
        ].join("\t"),
      );
    }
  }
}
