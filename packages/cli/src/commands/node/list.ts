import { Args, Command } from "@oclif/core";
import { readFileSync } from "node:fs";
import { parseDiagram } from "@agentsdraw/core";

export default class NodeList extends Command {
  static id = "node:list";
  static description = "List nodes in a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(NodeList);
    const doc = parseDiagram(JSON.parse(readFileSync(args.file, "utf8")) as unknown);
    for (const n of doc.nodes) {
      this.log(`${n.id}\t${n.text}\t${n.x}\t${n.y}\t${n.w}\t${n.h}\t${n.styleId}`);
    }
  }
}
