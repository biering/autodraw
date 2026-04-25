import { Args, Command, Flags } from "@oclif/core";
import { writeFileSync } from "node:fs";
import { emptyDiagram, serializeDiagram, type PalettePreset } from "@autodraw/core";

export default class Init extends Command {
  static id = "init";
  static description = "Create a new empty .adraw diagram file";

  static args = {
    file: Args.string({ description: "Output path", required: true }),
  };

  static flags = {
    palette: Flags.string({
      description: "Palette preset",
      options: ["universal", "grayscale", "flowchart", "empty"],
      default: "universal",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Init);
    const palette = flags.palette as PalettePreset;
    const doc = emptyDiagram(palette);
    writeFileSync(args.file, serializeDiagram(doc), "utf8");
    this.log(`Created ${args.file}`);
  }
}
