import { Args, Command } from "@oclif/core";
import { readDiagram } from "../../internal/io.js";

export default class ListNodes extends Command {
  static id = "list nodes";
  static description = "List nodes in a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ListNodes);
    const doc = readDiagram(args.file);
    this.log("id\ttext\tx\ty\tw\th\tstyleId\tshape");
    for (const n of doc.nodes) {
      const shape = n.shape ?? "";
      this.log(
        `${n.id}\t${n.text.replace(/\t/g, " ")}\t${n.x}\t${n.y}\t${n.w}\t${n.h}\t${n.styleId}\t${shape}`,
      );
    }
  }
}
