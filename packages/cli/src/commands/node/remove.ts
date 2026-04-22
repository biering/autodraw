import { Args, Command, Flags } from "@oclif/core";
import { readFileSync, writeFileSync } from "node:fs";
import { parseDiagram, serializeDiagram } from "@agentsdraw/core";

export default class NodeRemove extends Command {
  static id = "node:remove";
  static description = "Remove a node (and incident edges)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Node id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(NodeRemove);
    const doc = parseDiagram(JSON.parse(readFileSync(args.file, "utf8")) as unknown);
    doc.nodes = doc.nodes.filter((n) => n.id !== flags.id);
    doc.edges = doc.edges.filter((e) => e.from !== flags.id && e.to !== flags.id);
    writeFileSync(args.file, serializeDiagram(doc), "utf8");
  }
}
