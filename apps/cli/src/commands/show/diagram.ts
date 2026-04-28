import { Args, Command, Flags } from "@oclif/core";
import { serializeDiagram } from "@autodraw/core";
import { readDiagram } from "../../internal/io.js";

export default class ShowDiagram extends Command {
  static id = "show diagram";
  static description = "Print diagram metadata summary";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    json: Flags.boolean({ description: "Print full diagram JSON", default: false, allowNo: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ShowDiagram);
    const doc = readDiagram(args.file);
    if (flags.json) {
      this.log(serializeDiagram(doc));
      return;
    }
    const customLen = doc.customStyles?.length ?? 0;
    this.log(`name: ${doc.name}`);
    this.log(`palette: ${doc.palette}`);
    this.log(`nodes: ${doc.nodes.length}`);
    this.log(`edges: ${doc.edges.length}`);
    this.log(`textLabels: ${doc.textLabels.length}`);
    this.log(`frames: ${doc.frames.length}`);
    this.log(`images: ${doc.images.length}`);
    this.log(`customStyles: ${customLen}`);
    this.log(`canvas.showGrid: ${doc.canvas.showGrid}`);
    this.log(`canvas.gridSpacing: ${doc.canvas.gridSpacing}`);
    this.log(`canvas.zoom: ${doc.canvas.zoom}`);
  }
}
