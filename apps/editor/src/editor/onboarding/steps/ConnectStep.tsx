"use client";

import { Button } from "../../../components/ui/button";
import { AgentGetStartedPanel } from "../AgentGetStartedPanel";
import {
  AUTODRAW_AGENT_SETUP_PROMPT,
  AUTODRAW_CLI_GLOBAL_INSTALL,
  AUTODRAW_CLI_NPX_HELP,
  AUTODRAW_MCP_SERVERS_ONE_LINE,
} from "../mcpConfig";

export function ConnectStep({ onDone }: { onDone?: () => void }) {
  return (
    <AgentGetStartedPanel
      primaryLabel="Tell your agent to:"
      primaryRow={{ id: "agent-setup", text: AUTODRAW_AGENT_SETUP_PROMPT }}
      orRunRows={[
        { id: "cli-global", text: AUTODRAW_CLI_GLOBAL_INSTALL },
        { id: "cli-npx", text: AUTODRAW_CLI_NPX_HELP },
      ]}
      mcpLabel="MCP (stdio)"
      mcpRows={[
        { id: "mcp-json", text: AUTODRAW_MCP_SERVERS_ONE_LINE },
        { id: "npx-mcp", text: "npx -y @autodraw/mcp" },
      ]}
      footer={
        onDone ? (
          <Button type="button" onClick={onDone}>
            Done
          </Button>
        ) : null
      }
    />
  );
}
