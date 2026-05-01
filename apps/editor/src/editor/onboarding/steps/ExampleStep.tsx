"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { CLI_EXAMPLE_LINES } from "../cliExampleSnippet";
import { CopyableCliExampleCard } from "../CopyableCliExampleCard";
import { createOnboardingExampleDiagram } from "../onboardingExampleDiagram";
import { useDocument } from "../../state/useDocument";

const AGENT_PROMPT = `Create a signup flowchart using Autodraw at ~/autodraw/examples/signup.adraw with four nodes:
"Landing", "Sign up", "Verify email", and "Dashboard". Connect them left to right with edges.
Then export the diagram to ~/autodraw/examples/signup.svg using the export tool.
Finally, open the .adraw file in Autodraw (or your editor) to review it.`;

export function ExampleStep() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <CopyableCliExampleCard
        variant="embedded"
        lines={[...CLI_EXAMPLE_LINES]}
        footer={
          <>
            Same <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.adraw</code> in the canvas, desktop app,
            and CLI—copy each line for docs or scripts.
          </>
        }
      />
      <p className="text-muted-foreground text-sm leading-relaxed">
        Paste this into your agent after MCP is connected. Adjust paths to folders you use.
      </p>
      <pre className="max-h-40 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed text-foreground whitespace-pre-wrap">
        {AGENT_PROMPT}
      </pre>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void navigator.clipboard.writeText(AGENT_PROMPT).then(
              () => toast.success("Prompt copied"),
              () => toast.error("Could not copy"),
            );
          }}
        >
          Copy prompt
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            try {
              useDocument.getState().setDiagram(createOnboardingExampleDiagram(), {
                filePath: null,
                dirty: true,
              });
              toast.success("Example diagram loaded on the canvas");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Loading…" : "Load example in this canvas"}
        </Button>
      </div>
      <p className="text-muted-foreground text-xs leading-relaxed">
        MCP writes files on disk. If a diagram is already open, reload or reopen the file after the agent edits it so the editor
        picks up external changes.
      </p>
    </div>
  );
}
