import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class AddText extends Command {
  static id = "add text";
  static description = "Add a free-floating text label to a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    text: Flags.string({ description: "Label text", required: true }),
    x: Flags.integer({ description: "X position", default: 240 }),
    y: Flags.integer({ description: "Y position", default: 240 }),
    id: Flags.string({ description: "Optional explicit id" }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddText);
    const doc = readDiagram(args.file);
    const id = flags.id ?? randomUUID();
    doc.textLabels.push({
      id,
      text: flags.text,
      x: flags.x,
      y: flags.y,
    });
    writeDiagram(args.file, doc);
    this.log(id);
  }
}
