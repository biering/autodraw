"use client";

import { Bot, Pencil, Terminal } from "lucide-react";
import { useState } from "react";
import { cn } from "../../../lib/utils";

const cards = [
  {
    key: "ui" as const,
    title: "Editor only",
    body: "Draw here with the mouse or keyboard. Open and save .adraw files from the toolbar or File menu.",
    icon: Pencil,
  },
  {
    key: "cli" as const,
    title: "CLI",
    body: "Use the autodraw CLI in scripts and CI: init, add nodes/edges, export SVG/PNG/PDF.",
    icon: Terminal,
  },
  {
    key: "agent" as const,
    title: "Agent (MCP)",
    body: "Give Cursor or Claude Desktop tools that read and write the same .adraw JSON on disk.",
    icon: Bot,
  },
];

export function WelcomeStep() {
  const [focus, setFocus] = useState<"ui" | "cli" | "agent" | null>("agent");

  return (
    <div className="space-y-4">
      <p className="text-pretty text-sm leading-6 text-muted-foreground">
        Autodraw is a diagram editor and an open <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.adraw</code>{" "}
        format. Pick how you want to work—the next steps focus on agents and MCP.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ key, title, body, icon: Icon }) => {
          const active = focus === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFocus(key)}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active ? "border-foreground/25 bg-muted/50" : "border-border bg-card hover:bg-muted/30",
              )}
            >
              <Icon className="mb-2 size-5 text-foreground" aria-hidden />
              <h4 className="font-medium text-foreground text-sm">{title}</h4>
              <p className="mt-1 text-muted-foreground text-xs leading-relaxed">{body}</p>
            </button>
          );
        })}
      </div>
      {focus === "agent" ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Continue with <strong className="text-foreground">Connect your agent</strong> to paste MCP config or download the CLI skill.
        </p>
      ) : null}
      {focus === "ui" ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          You can close this anytime—reopen it from the rocket button in the top-right.
        </p>
      ) : null}
      {focus === "cli" ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          See the sparkles button for a downloadable <code className="font-mono text-[11px]">SKILL.md</code> that documents CLI commands for agents.
        </p>
      ) : null}
    </div>
  );
}
