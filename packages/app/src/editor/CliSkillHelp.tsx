import { Sparkles } from "lucide-react";
import { useCallback, useState } from "react";
import cliSkillMarkdown from "../../../cli/SKILL.md?raw";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isTauri } from "../platform/isTauri.js";

const DOWNLOAD_NAME = "agentsdraw-cli.SKILL.md";

export function CliSkillHelp() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const download = useCallback(async () => {
    setBusy(true);
    try {
      if (isTauri()) {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const { writeTextFile } = await import("@tauri-apps/plugin-fs");
        const path = await save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
          defaultPath: DOWNLOAD_NAME,
        });
        if (typeof path !== "string") return;
        await writeTextFile(path, cliSkillMarkdown);
        setOpen(false);
        return;
      }
      const blob = new Blob([cliSkillMarkdown], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = DOWNLOAD_NAME;
      a.rel = "noopener";
      a.click();
      URL.revokeObjectURL(url);
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="fixed right-4 top-[calc(10px+env(safe-area-inset-top,0px))] z-[85] h-10 w-10 rounded-full border border-border/80 bg-card/95 shadow-md backdrop-blur-md hover:bg-accent [-webkit-app-region:no-drag] [app-region:no-drag]"
        aria-label="CLI skill for agents"
        title="Download CLI skill (SKILL.md)"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[min(88vh,720px)] max-w-2xl flex-col gap-0 p-0 sm:max-w-2xl"
          hideClose
        >
          <DialogHeader className="border-b border-border px-6 py-4 text-left">
            <DialogTitle>CLI skill for agents</DialogTitle>
            <DialogDescription>
              Save this SKILL.md for Cursor or other agents. It documents the{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                agentsdraw
              </code>{" "}
              CLI: init, nodes, edges, and export.
            </DialogDescription>
          </DialogHeader>
          <pre className="mx-1 mb-1 max-h-[min(52vh,420px)] min-h-0 flex-1 overflow-auto rounded-md border border-border bg-muted/40 px-4 py-3 font-mono text-[11px] leading-relaxed text-foreground">
            {cliSkillMarkdown}
          </pre>
          <DialogFooter className="border-t border-border px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Close
            </Button>
            <Button type="button" onClick={() => void download()} disabled={busy}>
              {busy ? "Saving…" : "Download SKILL.md"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
