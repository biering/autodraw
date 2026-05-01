"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { AgentGetStartedPanel } from "../AgentGetStartedPanel";
import {
  AUTODRAW_AGENT_PROMPT_CLAUDE,
  AUTODRAW_AGENT_PROMPT_CURSOR,
  AUTODRAW_AGENT_PROMPT_SKILL,
  AUTODRAW_MCP_SERVERS_ONE_LINE,
} from "../mcpConfig";
import { downloadCliSkill } from "../downloadCliSkill";

const OR_RUN_MCP = { id: "npx-mcp", text: "npx -y @autodraw/mcp" } as const;
const OR_RUN_CLI = { id: "npx-cli-help", text: "npx -y @autodraw/cli --help" } as const;
const OR_RUN_INIT = {
  id: "npx-cli-init",
  text: "npx -y @autodraw/cli init ./design.adraw --palette universal",
} as const;

export function ConnectStep() {
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="cursor">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cursor">Cursor</TabsTrigger>
          <TabsTrigger value="claude">Claude Desktop</TabsTrigger>
          <TabsTrigger value="skill">Custom agent</TabsTrigger>
        </TabsList>

        <TabsContent value="cursor" className="mt-4 space-y-3">
          <AgentGetStartedPanel
            primaryLabel="Tell your agent to:"
            primaryRow={{ id: "cursor-prompt", text: AUTODRAW_AGENT_PROMPT_CURSOR }}
            secondaryLabel="MCP entry (merge into ~/.cursor/mcp.json):"
            secondaryRow={{ id: "mcp-json", text: AUTODRAW_MCP_SERVERS_ONE_LINE }}
            orRunRows={[OR_RUN_MCP, OR_RUN_CLI]}
          />
        </TabsContent>

        <TabsContent value="claude" className="mt-4 space-y-3">
          <AgentGetStartedPanel
            primaryLabel="Tell your agent to:"
            primaryRow={{ id: "claude-prompt", text: AUTODRAW_AGENT_PROMPT_CLAUDE }}
            secondaryLabel="MCP entry (merge into Claude config):"
            secondaryRow={{ id: "mcp-json-claude", text: AUTODRAW_MCP_SERVERS_ONE_LINE }}
            orRunRows={[OR_RUN_MCP, OR_RUN_CLI]}
          />
        </TabsContent>

        <TabsContent value="skill" className="mt-4 space-y-3">
          <AgentGetStartedPanel
            primaryLabel="Tell your agent to:"
            primaryRow={{ id: "skill-prompt", text: AUTODRAW_AGENT_PROMPT_SKILL }}
            orRunRows={[OR_RUN_CLI, OR_RUN_INIT]}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setBusy(true);
              void downloadCliSkill().finally(() => setBusy(false));
            }}
          >
            {busy ? "Saving…" : "Download SKILL.md"}
          </Button>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Local MCP dev: point <code className="font-mono text-[11px]">command</code> to{" "}
            <code className="font-mono text-[11px]">node</code> and <code className="font-mono text-[11px]">args</code> to your built{" "}
            <code className="font-mono text-[11px]">apps/mcp/bin/run.mjs</code> — see <code className="font-mono text-[11px]">apps/mcp/README.md</code>.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}
