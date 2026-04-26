# @autodraw/mcp

Stdio [Model Context Protocol](https://modelcontextprotocol.io/) server for **Autodraw** `.adraw` files. Tools mirror [`@autodraw/cli`](../cli) (init, add/patch/remove nodes and edges, list, validate, export, etc.).

## Build

From the monorepo root:

```bash
pnpm install
pnpm --filter @autodraw/mcp build
```

## Run (stdio)

```bash
node apps/mcp/bin/run.mjs
```

Or after global/link install:

```bash
autodraw-mcp
```

## Cursor / Claude Desktop config

Add an MCP server entry pointing at the built binary, for example:

```json
{
  "mcpServers": {
    "autodraw": {
      "command": "node",
      "args": ["/absolute/path/to/agentsdraw/apps/mcp/bin/run.mjs"]
    }
  }
}
```

Use `pnpm exec` + workspace path, or `npx @autodraw/mcp` once published.

## Tools

All tools take a filesystem `path` to a `.adraw` file (except `autodraw_init`, which creates the file).

| Tool | Purpose |
|------|---------|
| `autodraw_init` | New empty diagram |
| `autodraw_add_node` | Add node |
| `autodraw_add_edge` | Add edge (optional `preset` 0–7) |
| `autodraw_remove_node` | Remove node + incident edges |
| `autodraw_remove_edge` | Remove edge |
| `autodraw_move_node` | Move node |
| `autodraw_patch_node` | Patch node fields |
| `autodraw_patch_edge` | Patch edge fields |
| `autodraw_list_nodes` | JSON array of nodes |
| `autodraw_list_edges` | JSON array of edges |
| `autodraw_validate` | Parse; optional `rewrite` |
| `autodraw_export` | PNG / PDF / SVG |
| `autodraw_show_diagram` | Summary or `fullJson` |
| `autodraw_rename_diagram` | Set name |
| `autodraw_set_canvas` | Canvas settings |
| `autodraw_copy_palette` | Copy palette from `fromPath` |

See also [`apps/cli/SKILL.md`](../cli/SKILL.md) for the CLI equivalents.
