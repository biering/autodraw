import { Sparkles } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import cliSkillMarkdown from "../../../cli/SKILL.md?raw";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { useDocument } from "./state/useDocument";
import { downloadCliSkill } from "./onboarding/downloadCliSkill";

export function CliSkillHelp() {
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const isDarkCanvas = canvasTheme === "dark";
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  /** Match {@link ZoomDock} shell so floating chrome reads as one family on the canvas. */
  const triggerClass = useMemo(
    () =>
      cn(
        "fixed right-16 top-[calc(10px+env(safe-area-inset-top,0px))] z-[85] h-10 w-10 rounded-full shadow-md [-webkit-app-region:no-drag] [app-region:no-drag]",
        isDarkCanvas
          ? "border border-white/[0.14] bg-[rgba(255,255,255,0.08)] hover:bg-white/12"
          : "border border-black/[0.12] bg-[rgba(0,0,0,0.02)] hover:bg-black/10",
      ),
    [isDarkCanvas],
  );

  const download = useCallback(async () => {
    setBusy(true);
    try {
      await downloadCliSkill({ onAfter: () => setOpen(false) });
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={triggerClass}
        aria-label="CLI skill for agents"
        title="Download CLI skill (SKILL.md)"
        onClick={() => setOpen(true)}
      >
        <Sparkles
          className={cn("h-5 w-5", isDarkCanvas ? "text-white" : "text-black")}
          strokeWidth={1.75}
          aria-hidden
        />
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
                autodraw
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
