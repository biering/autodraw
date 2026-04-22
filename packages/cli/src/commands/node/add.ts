import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { defaultStyleId, parseDiagram, serializeDiagram } from "@agentsdraw/core";

export default class NodeAdd extends Command {
  static id = "node:add";
  static description = "Add a node to a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    text: Flags.string({ description: "Node text", required: true }),
    x: Flags.integer({ description: "X position", default: 240 }),
    y: Flags.integer({ description: "Y position", default: 240 }),
    w: Flags.integer({ description: "Width", default: 160 }),
    h: Flags.integer({ description: "Height", default: 72 }),
    style: Flags.string({ description: "Style id (e.g. red, yellow)" }),
    id: Flags.string({ description: "Explicit node id" }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(NodeAdd);
    const doc = parseDiagram(JSON.parse(readFileSync(args.file, "utf8")) as unknown);
    const id = flags.id ?? randomUUID();
    const styleId = flags.style ?? defaultStyleId(doc.palette);
    doc.nodes.push({
      id,
      text: flags.text,
      x: flags.x,
      y: flags.y,
      w: flags.w,
      h: flags.h,
      styleId,
    });
    writeFileSync(args.file, serializeDiagram(doc), "utf8");
    this.log(id);
  }
}
