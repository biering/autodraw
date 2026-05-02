import { writeFileSync } from "node:fs";
import { emptyDiagram, serializeDiagram } from "@autodraw/core";
import { Args, Command } from "@oclif/core";

export default class Init extends Command {
  static id = "init";
  static description = "Create a new empty .adraw diagram file";

  static args = {
    file: Args.string({ description: "Output path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Init);
    const doc = emptyDiagram();
    writeFileSync(args.file, serializeDiagram(doc), "utf8");
    this.log(`Created ${args.file}`);
  }
}
