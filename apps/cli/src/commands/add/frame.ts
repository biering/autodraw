import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class AddFrame extends Command {
  static id = "add frame";
  static description = "Add a named frame (region) to a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    x: Flags.integer({ description: "X position", default: 80 }),
    y: Flags.integer({ description: "Y position", default: 80 }),
    w: Flags.integer({ description: "Width", default: 320 }),
    h: Flags.integer({ description: "Height", default: 200 }),
    name: Flags.string({ description: "Optional frame title" }),
    id: Flags.string({ description: "Optional explicit id" }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddFrame);
    const doc = readDiagram(args.file);
    const id = flags.id ?? randomUUID();
    doc.frames.push({
      id,
      x: flags.x,
      y: flags.y,
      w: flags.w,
      h: flags.h,
      ...(flags.name !== undefined && flags.name !== "" ? { name: flags.name } : {}),
    });
    writeDiagram(args.file, doc);
    this.log(id);
  }
}
