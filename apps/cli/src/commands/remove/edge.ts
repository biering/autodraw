import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class RemoveEdge extends Command {
  static id = "remove edge";
  static description = "Remove an edge";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Edge id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveEdge);
    const doc = readDiagram(args.file);
    doc.edges = doc.edges.filter((e) => e.id !== flags.id);
    writeDiagram(args.file, doc);
  }
}
