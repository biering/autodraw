import { Args, Command, Flags } from "@oclif/core";
import { readFileSync, writeFileSync } from "node:fs";
import { parseDiagram, serializeDiagram } from "@agentsdraw/core";

export default class NodeMove extends Command {
  static id = "node:move";
  static description = "Move a node";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Node id", required: true }),
    x: Flags.integer({ description: "X", required: true }),
    y: Flags.integer({ description: "Y", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(NodeMove);
    const doc = parseDiagram(JSON.parse(readFileSync(args.file, "utf8")) as unknown);
    const idx = doc.nodes.findIndex((n) => n.id === flags.id);
    if (idx === -1) this.error(`Unknown node id: ${flags.id}`);
    const n = doc.nodes[idx]!;
    doc.nodes[idx] = { ...n, x: flags.x, y: flags.y };
    writeFileSync(args.file, serializeDiagram(doc), "utf8");
  }
}
