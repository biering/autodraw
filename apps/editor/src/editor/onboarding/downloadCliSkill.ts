import cliSkillMarkdown from "../../../../cli/SKILL.md?raw";
import { isTauri } from "../../platform/isTauri";

export const DOWNLOAD_CLI_SKILL_NAME = "autodraw-cli.SKILL.md";

/**
 * Save `apps/cli/SKILL.md` for Cursor or other agents (same behavior as {@link CliSkillHelp}).
 */
export async function downloadCliSkill(options?: { onAfter?: () => void }): Promise<void> {
  const onAfter = options?.onAfter;
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      filters: [{ name: "Markdown", extensions: ["md"] }],
      defaultPath: DOWNLOAD_CLI_SKILL_NAME,
    });
    if (typeof path === "string") {
      await writeTextFile(path, cliSkillMarkdown);
      onAfter?.();
    }
    return;
  }
  const blob = new Blob([cliSkillMarkdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = DOWNLOAD_CLI_SKILL_NAME;
  a.rel = "noopener";
  a.click();
  URL.revokeObjectURL(url);
  onAfter?.();
}
