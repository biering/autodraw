import { Args, Command } from "@oclif/core";
import { readDiagram } from "../../internal/io.js";

export default class ListText extends Command {
  static id = "list text";
  static description = "List text labels in a diagram (JSON array)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ListText);
    const doc = readDiagram(args.file);
    this.log(JSON.stringify(doc.textLabels, null, 2));
  }
}
