/** Same JSON we document in `apps/mcp/README.md` and the onboarding wizard. */
export const AUTODRAW_MCP_SERVERS_SNIPPET = `{
  "mcpServers": {
    "autodraw": {
      "command": "npx",
      "args": ["-y", "@autodraw/mcp"]
    }
  }
}`;

/** Single-line JSON for compact copy rows in {@link AgentGetStartedPanel}. */
export const AUTODRAW_MCP_SERVERS_ONE_LINE = JSON.stringify({
  mcpServers: {
    autodraw: {
      command: "npx",
      args: ["-y", "@autodraw/mcp"],
    },
  },
});

export const AUTODRAW_AGENT_PROMPT_CURSOR =
  "In Cursor: add the Autodraw MCP stdio server. Merge the JSON from the next line into ~/.cursor/mcp.json under mcpServers (create the file if needed), restart Cursor, then list tools whose names start with autodraw_.";

export const AUTODRAW_AGENT_PROMPT_CLAUDE =
  "In Claude Desktop: add the Autodraw MCP stdio server. Merge the JSON from the next line into your claude_desktop_config.json mcpServers (macOS: ~/Library/Application Support/Claude/claude_desktop_config.json — Windows: %APPDATA%\\Claude\\claude_desktop_config.json), restart Claude, then list tools whose names start with autodraw_.";

export const AUTODRAW_AGENT_PROMPT_SKILL =
  "Without MCP: use the Autodraw CLI documented in SKILL.md (download from the sparkles button in the editor). Ask your agent to run autodraw init, autodraw add:node, autodraw add:edge, and autodraw export for .adraw files on disk.";
