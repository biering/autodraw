import { Args, Command } from "@oclif/core";
import { readDiagram } from "../../internal/io.js";

export default class ListFrames extends Command {
  static id = "list frames";
  static description = "List frames in a diagram (JSON array)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ListFrames);
    const doc = readDiagram(args.file);
    this.log(JSON.stringify(doc.frames, null, 2));
  }
}
