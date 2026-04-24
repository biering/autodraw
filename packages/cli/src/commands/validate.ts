import { Args, Command, Flags } from "@oclif/core";
import { readFileSync, writeFileSync } from "node:fs";
import { parseDiagram, serializeDiagram } from "@agentsdraw/core";

export default class Validate extends Command {
  static id = "validate";
  static description = "Validate a diagram JSON file (parse + optional rewrite)";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    rewrite: Flags.boolean({
      description: "Write migrated, formatted JSON back to the file",
      default: false,
      allowNo: true,
    }),
    quiet: Flags.boolean({ description: "Suppress success output", default: false, allowNo: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Validate);
    try {
      const raw = JSON.parse(readFileSync(args.file, "utf8")) as unknown;
      const doc = parseDiagram(raw);
      if (flags.rewrite) {
        writeFileSync(args.file, serializeDiagram(doc), "utf8");
        if (!flags.quiet) this.log(`valid (rewrote ${args.file})`);
      } else if (!flags.quiet) {
        this.log("valid");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.error(msg, { exit: 1 });
    }
  }
}
