import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class RemoveImage extends Command {
  static id = "remove image";
  static description = "Remove an image by id";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Image id", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(RemoveImage);
    const doc = readDiagram(args.file);
    doc.images = doc.images.filter((im) => im.id !== flags.id);
    writeDiagram(args.file, doc);
  }
}
