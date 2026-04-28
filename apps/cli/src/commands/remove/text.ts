import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class RemoveText extends Command {
  static id = "remove text";
  static description = "Remove a text label by id";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Text label id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveText);
    const doc = readDiagram(args.file);
    doc.textLabels = doc.textLabels.filter((t) => t.id !== flags.id);
    writeDiagram(args.file, doc);
  }
}
