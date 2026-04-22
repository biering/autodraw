import { Args, Command, Flags } from "@oclif/core";
import { readFileSync, writeFileSync } from "node:fs";
import { parseDiagram, serializeDiagram } from "@agentsdraw/core";

export default class EdgeRemove extends Command {
  static id = "edge:remove";
  static description = "Remove an edge";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Edge id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(EdgeRemove);
    const doc = parseDiagram(JSON.parse(readFileSync(args.file, "utf8")) as unknown);
    doc.edges = doc.edges.filter((e) => e.id !== flags.id);
    writeFileSync(args.file, serializeDiagram(doc), "utf8");
  }
}
