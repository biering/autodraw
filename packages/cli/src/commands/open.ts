import { Args, Command } from "@oclif/core";
import { spawn } from "node:child_process";

export default class Open extends Command {
  static id = "open";
  static description = "Open a diagram with the default application";

  static args = {
    file: Args.string({ description: "Input .adraw path", required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Open);
    if (process.platform === "darwin") {
      spawn("open", [args.file], { stdio: "ignore", detached: true }).unref();
      return;
    }
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", args.file], {
        stdio: "ignore",
        detached: true,
        windowsHide: true,
      }).unref();
      return;
    }
    spawn("xdg-open", [args.file], { stdio: "ignore", detached: true }).unref();
  }
}
