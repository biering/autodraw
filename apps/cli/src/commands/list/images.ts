import { Args, Command } from "@oclif/core";
import { readDiagram } from "../../internal/io.js";

export default class ListImages extends Command {
  static id = "list images";
  static description = "List images in a diagram (JSON array)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ListImages);
    const doc = readDiagram(args.file);
    this.log(JSON.stringify(doc.images, null, 2));
  }
}
