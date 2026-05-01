# @autodraw/mcp

Stdio [Model Context Protocol](https://modelcontextprotocol.io/) server for **Autodraw** `.adraw` files. Tools mirror [`@autodraw/cli`](../cli) (init, add/patch/remove nodes and edges, frames, images, text labels, list, validate, export, etc.).

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

## Install for agents (recommended)

Use the published package via **npx** so Cursor and Claude Desktop always pick up a current build:

```json
{
  "mcpServers": {
    "autodraw": {
      "command": "npx",
      "args": ["-y", "@autodraw/mcp"]
    }
  }
}
```

### Cursor

Merge the block above into `~/.cursor/mcp.json` (create the file if it does not exist). If you already have an `mcpServers` object, add the `autodraw` entry next to your other servers. Restart Cursor after saving.

### Claude Desktop

Merge the same `mcpServers` object into:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop after saving.

## Local development (fallback)

Point at the built workspace binary instead of npx:

```json
{
  "mcpServers": {
    "autodraw": {
      "command": "node",
      "args": ["/absolute/path/to/autodraw/apps/mcp/bin/run.mjs"]
    }
  }
}
```

Build `@autodraw/mcp` first (`pnpm --filter @autodraw/mcp build`). You can also run `pnpm exec autodraw-mcp` from the repo with a wrapper script if your client requires a single executable.

## Live editor sync

The MCP server only reads and writes `.adraw` files **on disk**. It does not push into a running Autodraw window. After your agent edits a file, **reopen that file** in the editor (or reload) so the UI reflects external changes.

## Tools

All tools take a filesystem `path` to an existing `.adraw` file except **`autodraw_init`**, which creates the file at `path`.

| Tool | Purpose |
|------|---------|
| `autodraw_init` | New empty diagram at `path` |
| `autodraw_add_node` | Add node |
| `autodraw_add_edge` | Add edge between nodes |
| `autodraw_remove_node` | Remove node and incident edges |
| `autodraw_remove_edge` | Remove edge |
| `autodraw_move_node` | Move node |
| `autodraw_patch_node` | Patch node fields |
| `autodraw_patch_edge` | Patch edge fields |
| `autodraw_add_text_label` | Add free-floating text label |
| `autodraw_add_frame` | Add frame region |
| `autodraw_add_image` | Add image (HTTPS URL) |
| `autodraw_remove_text_label` | Remove text label |
| `autodraw_remove_frame` | Remove frame |
| `autodraw_remove_image` | Remove image |
| `autodraw_list_text_labels` | List text labels (JSON) |
| `autodraw_list_frames` | List frames (JSON) |
| `autodraw_list_images` | List images (JSON) |
| `autodraw_list_nodes` | List nodes (JSON) |
| `autodraw_list_edges` | List edges (JSON) |
| `autodraw_validate` | Parse diagram; optional rewrite |
| `autodraw_export` | Export PNG / PDF / SVG |
| `autodraw_show_diagram` | Summary or full JSON |
| `autodraw_rename_diagram` | Set diagram display name |
| `autodraw_set_canvas` | Canvas grid / zoom settings |
| `autodraw_copy_palette` | Copy palette from another `.adraw` |

See also [`apps/cli/SKILL.md`](../cli/SKILL.md) for CLI equivalents.
