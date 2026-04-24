---
name: agentsdraw-cli
description: >-
  Use the agentsdraw CLI (`agentsdraw`) to create, edit, export, and open `.adraw`
  diagram JSON files from scripts or terminal workflows. Load when automating
  diagrams, batch-editing nodes/edges, CI export, or integrating with agents.
---

# agentsdraw CLI

The CLI reads and writes **diagram v1** JSON files (extension `.adraw`). It uses `@agentsdraw/core` for validation, SVG rendering, and relationship presets.

Commands use **verb-first, space-separated** topics (e.g. `agentsdraw add node …`).

## Installation

From the **agentsdraw** monorepo root after building the CLI:

```bash
pnpm --filter @agentsdraw/cli build
pnpm exec agentsdraw --help
```

Globally (optional): link or publish the `@agentsdraw/cli` package and run `agentsdraw`.

## File format

- Input/output paths are ordinary UTF-8 JSON files matching `diagramSchemaV1` from `@agentsdraw/core`.
- Prefer extension `.adraw` for clarity.

## Commands

### `init` — new empty diagram

```bash
agentsdraw init <file.adraw> [--palette universal|grayscale|flowchart|empty]
```

Creates a new diagram file. Default palette is `universal`.

### `open` — open in default app

```bash
agentsdraw open <file.adraw>
```

Uses the OS default application (`open` on macOS, `xdg-open` on Linux, `start` on Windows).

### `validate` — parse (and optionally rewrite) JSON

```bash
agentsdraw validate <file.adraw> [--rewrite] [--quiet]
```

Runs `parseDiagram`. With `--rewrite`, writes migrated, pretty-printed JSON back to the file. Exit code `1` on invalid input.

### `export` — PNG, PDF, or SVG

```bash
agentsdraw export <file.adraw> --format png --output out.png [--scale 2] [--show-grid|--no-show-grid]
agentsdraw export <file.adraw> --format pdf --output out.pdf [--show-grid|--no-show-grid]
agentsdraw export <file.adraw> --format svg --output out.svg [--show-grid|--no-show-grid]
```

- **PNG**: raster via Resvg; `--scale` affects export resolution (1–8, default `2`).
- **PDF**: raster page embedded via `pdf-lib` (high-res render then single-page PDF).
- **SVG**: writes `renderSVG` output as UTF-8; `--scale` is ignored (a warning is printed if set).

### `add node`

```bash
agentsdraw add node <file.adraw> --text "Label" [--shape roundedRect] [--x 240] [--y 240] [--w 160] [--h 72] [--style <styleId>] [--id <uuid>]
```

`--shape` is one of: `rectangle`, `roundedRect`, `oval`, `circle`, `diamond`, `hexagon`, `octagon`, `parallelogram`. If `--style` is omitted, uses `defaultStyleId` for the diagram palette. Prints the new node `id` on stdout.

### `add edge`

```bash
agentsdraw add edge <file.adraw> --from <nodeId> --to <nodeId> \
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
agentsdraw remove node <file.adraw> --id <nodeId>
```

Removes the node and **all edges** incident on it.

### `remove edge`

```bash
agentsdraw remove edge <file.adraw> --id <edgeId>
```

### `move node`

```bash
agentsdraw move node <file.adraw> --id <nodeId> --x <n> --y <n>
```

### `list nodes`

```bash
agentsdraw list nodes <file.adraw>
```

Prints a TSV header then rows: `id`, `text`, `x`, `y`, `w`, `h`, `styleId`, `shape` (shape column may be empty).

### `list edges`

```bash
agentsdraw list edges <file.adraw>
```

TSV with columns: `id`, `from`, `to`, `routing`, `dash`, `head`, `tail`, `label`, `strokeWidth`, `sourceHandle`, `targetHandle`, `relationshipPreset`.

### `patch node`

```bash
agentsdraw patch node <file.adraw> --id <nodeId> [--text ...] [--shape ...] [--x ...] [--y ...] [--w ...] [--h ...] [--style ...]
```

At least one optional field besides `--id` is required.

### `patch edge`

```bash
agentsdraw patch edge <file.adraw> --id <edgeId> [--routing ...] [--dash ...] [--head ...] [--tail ...] [--label ...] \
  [--stroke-width N] [--source-handle ...] [--target-handle ...] [--preset 0-7]
```

If `--preset` is set, preset styling is applied first, then any other flags you pass override those fields. Use `--source-handle ""` / `--target-handle ""` to clear handles.

### `show diagram`

```bash
agentsdraw show diagram <file.adraw> [--json]
```

Without `--json`, prints a short summary (name, palette, counts, canvas). With `--json`, prints the full diagram JSON (pretty-printed).

### `rename diagram`

```bash
agentsdraw rename diagram <file.adraw> --name "My title"
```

Uses `normalizeDiagramName` from core.

### `set canvas`

```bash
agentsdraw set canvas <file.adraw> [--show-grid|--no-show-grid] [--grid-spacing N] [--zoom 1.25]
```

At least one flag is required. `--zoom` is a decimal string (e.g. `1`, `0.75`).

### `copy palette`

```bash
agentsdraw copy palette <target.adraw> --from <source.adraw>
```

Copies `palette` and `customStyles` from the source diagram into the target file (same behavior as the app’s “load palette from”).

## Agent workflow tips

1. **Discover node ids** with `list nodes` before adding edges.
2. **Prefer `add edge --preset`** when you want consistent relationship styling (same presets as the desktop app).
3. **Validate in CI** with `agentsdraw validate <file.adraw>` (add `--rewrite` in migration pipelines).
4. After scripted edits, **open** the file in the desktop app for visual review.

## Related packages

- **`@agentsdraw/core`**: `parseDiagram`, `serializeDiagram`, `emptyDiagram`, `renderSVG`, palette and relationship helpers.
- **Desktop app (Tauri)**: interactive editing; CLI is for automation and headless pipelines.
