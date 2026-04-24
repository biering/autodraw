import { Args, Command, Flags } from "@oclif/core";
import { nodeShapeSchema, type NodeShape } from "@agentsdraw/core";
import { readDiagram, requireNode, writeDiagram } from "../../internal/io.js";

export default class PatchNode extends Command {
  static id = "patch node";
  static description = "Update fields on an existing node";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    id: Flags.string({ description: "Node id", required: true }),
    text: Flags.string({ description: "Node text" }),
    x: Flags.integer({ description: "X position" }),
    y: Flags.integer({ description: "Y position" }),
    w: Flags.integer({ description: "Width" }),
    h: Flags.integer({ description: "Height" }),
    style: Flags.string({ description: "Style id" }),
    shape: Flags.string({
      description: "Node shape",
      options: [...nodeShapeSchema.options],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(PatchNode);
    const doc = readDiagram(args.file);
    requireNode(doc, flags.id);

    const hasPatch =
      flags.text !== undefined ||
      flags.x !== undefined ||
      flags.y !== undefined ||
      flags.w !== undefined ||
      flags.h !== undefined ||
      flags.style !== undefined ||
      flags.shape !== undefined;

    if (!hasPatch) {
      this.error("Provide at least one of: --text, --x, --y, --w, --h, --style, --shape");
    }

    const idx = doc.nodes.findIndex((n) => n.id === flags.id);
    if (idx === -1) this.error(`Unknown node id: ${flags.id}`);
    const n = doc.nodes[idx]!;
    const next = { ...n };
    if (flags.text !== undefined) next.text = flags.text;
    if (flags.x !== undefined) next.x = flags.x;
    if (flags.y !== undefined) next.y = flags.y;
    if (flags.w !== undefined) next.w = flags.w;
    if (flags.h !== undefined) next.h = flags.h;
    if (flags.style !== undefined) next.styleId = flags.style;
    if (flags.shape !== undefined) next.shape = flags.shape as NodeShape;

    doc.nodes[idx] = next;
    writeDiagram(args.file, doc);
  }
}
