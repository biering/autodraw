import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

/** Copy `customStyles` from source diagram into target (in-place). */
export function copyCustomStylesInPlace(targetPath: string, fromPath: string): void {
  const target = readDiagram(targetPath);
  const source = readDiagram(fromPath);
  target.customStyles = source.customStyles ?? [];
  writeDiagram(targetPath, target);
}

export default class CopyStyles extends Command {
  static id = "copy styles";
  static description = "Copy custom node styles from another diagram";

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
    const { args, flags } = await this.parse(CopyStyles);
    copyCustomStylesInPlace(args.file, flags.from);
    this.log(`Copied styles from ${flags.from}`);
  }
}
