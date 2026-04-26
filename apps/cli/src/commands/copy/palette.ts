import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class CopyPalette extends Command {
  static id = "copy palette";
  static description = "Copy palette and custom styles from another diagram";

  static args = {
    file: Args.string({
      description: "Target diagram .adraw path (modified in place)",
      required: true,
    }),
  };

  static flags = {
    from: Flags.string({ description: "Source diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CopyPalette);
    const target = readDiagram(args.file);
    const source = readDiagram(flags.from);
    target.palette = source.palette;
    target.customStyles = source.customStyles ?? [];
    writeDiagram(args.file, target);
    this.log(`Copied palette from ${flags.from}`);
  }
}
