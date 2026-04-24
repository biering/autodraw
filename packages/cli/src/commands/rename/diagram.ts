import { Args, Command, Flags } from "@oclif/core";
import { normalizeDiagramName } from "@agentsdraw/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class RenameDiagram extends Command {
  static id = "rename diagram";
  static description = "Set the diagram display name";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    name: Flags.string({ description: "New diagram name", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RenameDiagram);
    const doc = readDiagram(args.file);
    doc.name = normalizeDiagramName(flags.name);
    writeDiagram(args.file, doc);
  }
}
