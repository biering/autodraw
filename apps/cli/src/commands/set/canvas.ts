import { Args, Command, Flags } from "@oclif/core";
import { readDiagram, writeDiagram } from "../../internal/io.js";

export default class SetCanvas extends Command {
  static id = "set canvas";
  static description = "Update canvas settings on a diagram";

  static args = {
    file: Args.string({ description: "Diagram .adraw path", required: true }),
  };

  static flags = {
    "show-grid": Flags.boolean({
      description: "Show background grid",
      allowNo: true,
    }),
    "grid-spacing": Flags.integer({
      description: "Grid spacing in diagram units",
      min: 4,
      max: 200,
    }),
    zoom: Flags.string({ description: "Canvas zoom factor (number, e.g. 1 or 0.75)" }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(SetCanvas);
    const doc = readDiagram(args.file);

    const has =
      flags["show-grid"] !== undefined ||
      flags["grid-spacing"] !== undefined ||
      flags.zoom !== undefined;

    if (!has) {
      this.error("Provide at least one of: --show-grid, --no-show-grid, --grid-spacing, --zoom");
    }

    const c = { ...doc.canvas };
    if (flags["show-grid"] !== undefined) {
      c.showGrid = flags["show-grid"];
    }
    if (flags["grid-spacing"] !== undefined) {
      c.gridSpacing = flags["grid-spacing"];
    }
    if (flags.zoom !== undefined) {
      const z = Number(flags.zoom);
      if (Number.isNaN(z) || z < 0.05 || z > 8) {
        this.error("zoom must be a number between 0.05 and 8");
      }
      c.zoom = z;
    }
    doc.canvas = c;
    writeDiagram(args.file, doc);
  }
}
