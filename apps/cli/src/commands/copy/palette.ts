import { Args, Command, Flags } from "@oclif/core";
import { copyCustomStylesInPlace } from "./styles.js";

/** @deprecated Use `copy styles`. */
export default class CopyPalette extends Command {
  static id = "copy palette";
  static description = "Deprecated: use `copy styles` (copies customStyles only)";

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
    this.warn(
      "`autodraw copy palette` is deprecated; use `autodraw copy styles` (node styles live in customStyles).",
    );
    copyCustomStylesInPlace(args.file, flags.from);
    this.log(`Copied styles from ${flags.from}`);
  }
}
