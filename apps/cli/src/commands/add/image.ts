import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class AddImage extends Command {
  static id = "add image";
  static description = "Add an image element (URL only, no base64)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    src: Flags.string({ description: "Image URL (https://…)", required: true }),
    x: Flags.integer({ description: "X position", default: 200 }),
    y: Flags.integer({ description: "Y position", default: 200 }),
    w: Flags.integer({ description: "Width", default: 160 }),
    h: Flags.integer({ description: "Height", default: 120 }),
    alt: Flags.string({ description: "Optional alt text" }),
    id: Flags.string({ description: "Optional explicit id" }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddImage);
    const doc = readDiagram(args.file);
    const id = flags.id ?? randomUUID();
    try {
      new URL(flags.src);
    } catch {
      this.error("Invalid --src URL");
    }
    doc.images.push({
      id,
      src: flags.src,
      x: flags.x,
      y: flags.y,
      w: flags.w,
      h: flags.h,
      ...(flags.alt !== undefined && flags.alt !== "" ? { alt: flags.alt } : {}),
    });
    writeDiagram(args.file, doc);
    this.log(id);
  }
}
