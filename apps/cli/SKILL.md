---
name: autodraw-cli
description: >-
  Use the autodraw CLI (`autodraw`) or MCP server (`@autodraw/mcp`) to create, edit,
  export, and open `.adraw` diagram JSON files from scripts, terminal workflows, or
  MCP hosts. Load when automating diagrams, batch-editing nodes/edges, CI export, or
  integrating with agents.
---

# autodraw CLI

The CLI reads and writes **diagram v1** JSON files (extension `.adraw`). It uses `@autodraw/core` for validation, SVG rendering, and relationship presets.

Commands use **verb-first, space-separated** topics (e.g. `autodraw add node …`).

## Installation

From the **autodraw** monorepo root after building the CLI:

```bash
pnpm --filter @autodraw/cli build
pnpm exec autodraw --help
# Or from any machine with npm:
# npx -y @autodraw/cli --help
```

Globally (optional): link or publish the `@autodraw/cli` package and run `autodraw`.

## File format

- Input/output paths are ordinary UTF-8 JSON files matching `diagramSchemaV1` from `@autodraw/core`.
- Prefer extension `.adraw` for clarity.

## Commands

### `init` — new empty diagram

```bash
autodraw init <file.adraw>
```

Creates a new diagram file with default node styles in `customStyles`.

### `open` — open in default app

```bash
autodraw open <file.adraw>
```

Uses the OS default application (`open` on macOS, `xdg-open` on Linux, `start` on Windows).

### `validate` — parse (and optionally rewrite) JSON

```bash
autodraw validate <file.adraw> [--rewrite] [--quiet]
```

Runs `parseDiagram`. With `--rewrite`, writes migrated, pretty-printed JSON back to the file. Exit code `1` on invalid input.

### `export` — PNG, PDF, or SVG

```bash
autodraw export <file.adraw> --format png --output out.png [--scale 2] [--show-grid|--no-show-grid]
autodraw export <file.adraw> --format pdf --output out.pdf [--show-grid|--no-show-grid]
autodraw export <file.adraw> --format svg --output out.svg [--show-grid|--no-show-grid]
```

- **PNG**: raster via Resvg; `--scale` affects export resolution (1–8, default `2`).
- **PDF**: raster page embedded via `pdf-lib` (high-res render then single-page PDF).
- **SVG**: writes `renderSVG` output as UTF-8; `--scale` is ignored (a warning is printed if set).

### `add node`

```bash
autodraw add node <file.adraw> --text "Label" [--shape roundedRect] [--x 240] [--y 240] [--w 160] [--h 72] [--style <styleId>] [--id <uuid>]
```

`--shape` is one of: `rectangle`, `roundedRect`, `oval`, `circle`, `diamond`, `hexagon`, `octagon`, `parallelogram`. If `--style` is omitted, uses `defaultStyleId` for the diagram (first `customStyles` entry). Prints the new node `id` on stdout.

### `add edge`

```bash
autodraw add edge <file.adraw> --from <nodeId> --to <nodeId> \
  [--routing straight|orthogonal|curved] [--dash solid|dashed|dotted] \
  [--head none|lineArrow|triangleArrow|triangleReversed|circle|diamond] \
  [--tail none|lineArrow|...] [--label ""] [--stroke-width 1] \
  [--source-handle src] [--target-handle tgt] \
  [--preset 0-7]
```

- If `--preset` is set (0–7), routing/dash/head/tail/strokeWidth come from `applyRelationshipPreset` (same presets as the desktop app). `--source-handle` / `--target-handle` still apply.
- Without `--preset`, `--tail` defaults to `none` and `--stroke-width` defaults to `1`.
- Prints the new edge `id` on stdout.

### `remove node`

```bash
autodraw remove node <file.adraw> --id <nodeId>
```

Removes the node and **all edges** incident on it.

### `remove edge`

```bash
autodraw remove edge <file.adraw> --id <edgeId>
```

### `move node`

```bash
autodraw move node <file.adraw> --id <nodeId> --x <n> --y <n>
```

### `list nodes`

```bash
autodraw list nodes <file.adraw>
```

Prints a TSV header then rows: `id`, `text`, `x`, `y`, `w`, `h`, `styleId`, `shape` (shape column may be empty).

### `list edges`

```bash
autodraw list edges <file.adraw>
```

TSV with columns: `id`, `from`, `to`, `routing`, `dash`, `head`, `tail`, `label`, `strokeWidth`, `sourceHandle`, `targetHandle`, `relationshipPreset`.

### `patch node`

```bash
autodraw patch node <file.adraw> --id <nodeId> [--text ...] [--shape ...] [--x ...] [--y ...] [--w ...] [--h ...] [--style ...]
```

At least one optional field besides `--id` is required.

### `patch edge`

```bash
autodraw patch edge <file.adraw> --id <edgeId> [--routing ...] [--dash ...] [--head ...] [--tail ...] [--label ...] \
  [--stroke-width N] [--source-handle ...] [--target-handle ...] [--preset 0-7]
```

If `--preset` is set, preset styling is applied first, then any other flags you pass override those fields. Use `--source-handle ""` / `--target-handle ""` to clear handles.

### `show diagram`

```bash
autodraw show diagram <file.adraw> [--json]
```

Without `--json`, prints a short summary (name, counts, canvas). With `--json`, prints the full diagram JSON (pretty-printed).

### `rename diagram`

```bash
autodraw rename diagram <file.adraw> --name "My title"
```

Uses `normalizeDiagramName` from core.

### `set canvas`

```bash
autodraw set canvas <file.adraw> [--show-grid|--no-show-grid] [--grid-spacing N] [--zoom 1.25]
```

At least one flag is required. `--zoom` is a decimal string (e.g. `1`, `0.75`).

### `copy styles`

```bash
autodraw copy styles <target.adraw> --from <source.adraw>
```

Copies `customStyles` from the source diagram into the target file.

`autodraw copy palette` is deprecated but still runs (same as `copy styles`).

## Agent workflow tips

1. **Discover node ids** with `list nodes` before adding edges.
2. **Prefer `add edge --preset`** when you want consistent relationship styling (same presets as the desktop app).
3. **Validate in CI** with `autodraw validate <file.adraw>` (add `--rewrite` in migration pipelines).
4. After scripted edits, **open** the file in the desktop app for visual review.

## MCP equivalents (`@autodraw/mcp`)

If the host supports **Model Context Protocol** (stdio) instead of shelling out to the CLI, use the **`@autodraw/mcp`** server. After `pnpm --filter @autodraw/mcp build`, point the MCP client at `apps/mcp/bin/run.mjs` (see [`apps/mcp/README.md`](../mcp/README.md)).

| CLI | MCP tool |
|-----|----------|
| `autodraw init …` | `autodraw_init` |
| `autodraw add node …` | `autodraw_add_node` |
| `autodraw add edge …` | `autodraw_add_edge` |
| `autodraw remove node …` | `autodraw_remove_node` |
| `autodraw remove edge …` | `autodraw_remove_edge` |
| `autodraw move node …` | `autodraw_move_node` |
| `autodraw patch node …` | `autodraw_patch_node` |
| `autodraw patch edge …` | `autodraw_patch_edge` |
| `autodraw list nodes …` | `autodraw_list_nodes` (returns JSON array) |
| `autodraw list edges …` | `autodraw_list_edges` (returns JSON array) |
| `autodraw validate …` | `autodraw_validate` |
| `autodraw export …` | `autodraw_export` |
| `autodraw show diagram …` | `autodraw_show_diagram` |
| `autodraw rename diagram …` | `autodraw_rename_diagram` |
| `autodraw set canvas …` | `autodraw_set_canvas` |
| `autodraw copy styles …` | `autodraw_copy_styles` |
| `autodraw copy palette …` (deprecated) | `autodraw_copy_palette` |

MCP tools take the same filesystem paths and fields as the CLI (snake_case / camelCase as documented in each tool’s JSON schema).

## Related packages

- **`@autodraw/core`**: `parseDiagram`, `serializeDiagram`, `emptyDiagram`, `renderSVG`, style and relationship helpers.
- **`@autodraw/mcp`**: MCP stdio server mirroring CLI operations for agent hosts that prefer MCP over subprocesses.
- **Desktop app (Tauri)**: interactive editing; CLI / MCP are for automation and headless pipelines.
