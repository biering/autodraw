import { Args, Command, Flags } from "@oclif/core";
import { randomUUID } from "node:crypto";
import { defaultStyleId, nodeShapeSchema, type NodeShape } from "@agentsdraw/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class AddNode extends Command {
  static id = "add node";
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
    shape: Flags.string({
      description: "Node shape",
      options: [...nodeShapeSchema.options],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AddNode);
    const doc = readDiagram(args.file);
    const id = flags.id ?? randomUUID();
    const styleId = flags.style ?? defaultStyleId(doc.palette);
    const shape = flags.shape as NodeShape | undefined;
    doc.nodes.push({
      id,
      text: flags.text,
      x: flags.x,
      y: flags.y,
      w: flags.w,
      h: flags.h,
      styleId,
      ...(shape ? { shape } : {}),
    });
    writeDiagram(args.file, doc);
    this.log(id);
  }
}
