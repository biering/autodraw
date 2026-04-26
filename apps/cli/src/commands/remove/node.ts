import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class RemoveNode extends Command {
  static id = "remove node";
  static description = "Remove a node (and incident edges)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Node id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveNode);
    const doc = readDiagram(args.file);
    doc.nodes = doc.nodes.filter((n) => n.id !== flags.id);
    doc.edges = doc.edges.filter((e) => e.from !== flags.id && e.to !== flags.id);
    writeDiagram(args.file, doc);
  }
}
