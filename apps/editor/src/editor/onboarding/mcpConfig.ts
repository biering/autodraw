/** Canonical MCP `mcpServers` object — pretty snippet is derived so it cannot drift. */
export const AUTODRAW_MCP_SERVERS_OBJECT = {
  mcpServers: {
    autodraw: {
      command: "npx",
      args: ["-y", "@autodraw/mcp"],
    },
  },
} as const;

/** Same JSON we document in `apps/mcp/README.md` and onboarding. */
export const AUTODRAW_MCP_SERVERS_SNIPPET = JSON.stringify(AUTODRAW_MCP_SERVERS_OBJECT, null, 2);

/** Single-line JSON for compact copy rows. */
export const AUTODRAW_MCP_SERVERS_ONE_LINE = JSON.stringify(AUTODRAW_MCP_SERVERS_OBJECT);

/** One-line prompt for agents (Cursor, Claude Desktop, etc.). */
export const AUTODRAW_AGENT_SETUP_PROMPT =
  "Read https://autodraw.ink/skill.md and get me set up with Autodraw.";

/** Global install of the scoped CLI; the published bin name is `autodraw`. */
export const AUTODRAW_CLI_GLOBAL_INSTALL = "npm install -g @autodraw/cli";

/**
 * Run this project’s CLI via npx without a global install. The published bin is `autodraw`.
 * Do not document `npx autodraw --help`: the unscoped npm package name `autodraw` is a different
 * project on the registry, so npx would not resolve to `@autodraw/cli`.
 */
export const AUTODRAW_CLI_NPX_HELP = "autodraw --help";
