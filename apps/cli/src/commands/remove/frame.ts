import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class RemoveFrame extends Command {
  static id = "remove frame";
  static description = "Remove a frame by id";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Frame id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveFrame);
    const doc = readDiagram(args.file);
    doc.frames = doc.frames.filter((f) => f.id !== flags.id);
    writeDiagram(args.file, doc);
  }
}
