import { Args, Command, Flags } from "@oclif/core";
import { readFileSync, writeFileSync } from "node:fs";
import { PDFDocument } from "pdf-lib";
import { Resvg } from "@resvg/resvg-js";
import { parseDiagram, renderSVG } from "@agentsdraw/core";

export default class Export extends Command {
  static id = "export";
  static description = "Export a diagram to PDF or PNG";

  static args = {
    file: Args.string({ description: "Input .adraw path", required: true }),
  };

  static flags = {
    format: Flags.string({ description: "Output format", options: ["pdf", "png"], required: true }),
    output: Flags.string({ description: "Output file path", required: true }),
    showGrid: Flags.boolean({ description: "Render grid in output", default: true, allowNo: true }),
    scale: Flags.integer({ description: "PNG scale multiplier (approx)", default: 2, min: 1, max: 8 }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Export);
    const raw = JSON.parse(readFileSync(args.file, "utf8")) as unknown;
    const diagram = parseDiagram(raw);
    const svg = renderSVG(diagram, { showGrid: flags.showGrid });

    if (flags.format === "png") {
      const resvg = new Resvg(svg, {
        fitTo: { mode: "zoom", value: Math.max(50, Math.min(400, flags.scale * 100)) },
      });
      const png = resvg.render().asPng();
      writeFileSync(flags.output, png);
      this.log(`Wrote PNG: ${flags.output}`);
      return;
    }

    const resvg = new Resvg(svg, { fitTo: { mode: "zoom", value: 2400 } });
    const png = resvg.render().asPng();
    const pdf = await PDFDocument.create();
    const image = await pdf.embedPng(png);
    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    const bytes = await pdf.save();
    writeFileSync(flags.output, bytes);
    this.log(`Wrote PDF: ${flags.output}`);
  }
}
