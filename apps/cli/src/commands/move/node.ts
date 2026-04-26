import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, requireNode, writeDiagram } from "../../internal/io.js";

export default class MoveNode extends Command {
  static id = "move node";
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
    const { args, flags } = await this.parse(MoveNode);
    const doc = readDiagram(args.file);
    requireNode(doc, flags.id);
    const idx = doc.nodes.findIndex((n) => n.id === flags.id);
    const n = doc.nodes[idx]!;
    doc.nodes[idx] = { ...n, x: flags.x, y: flags.y };
    writeDiagram(args.file, doc);
  }
}
