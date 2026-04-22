---
name: agentsdraw-cli
description: >-
  Use the agentsdraw CLI (`agentsdraw`) to create, edit, export, and open `.adraw`
  diagram JSON files from scripts or terminal workflows. Load when automating
  diagrams, batch-editing nodes/edges, CI export, or integrating with agents.
---

# agentsdraw CLI

The CLI reads and writes **diagram v1** JSON files (extension `.adraw`). It uses `@agentsdraw/core` for validation, SVG rendering, and relationship presets.

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

### `export` — PNG or PDF

```bash
agentsdraw export <file.adraw> --format png --output out.png [--scale 2] [--show-grid|--no-show-grid]
agentsdraw export <file.adraw> --format pdf --output out.pdf [--show-grid|--no-show-grid]
```

- **PNG**: raster via Resvg; `--scale` affects export resolution (1–8, default `2`).
- **PDF**: raster page embedded via `pdf-lib` (high-res render then single-page PDF).

### `node:list`

```bash
agentsdraw node:list <file.adraw>
```

Prints TSV lines: `id`, `text`, `x`, `y`, `w`, `h`, `styleId`.

### `node:add`

```bash
agentsdraw node:add <file.adraw> --text "Label" [--x 240] [--y 240] [--w 160] [--h 72] [--style <styleId>] [--id <uuid>]
```

Appends a node. If `--style` is omitted, uses `defaultStyleId` for the diagram’s palette. Prints the new node `id` on stdout.

### `node:move`

```bash
agentsdraw node:move <file.adraw> --id <nodeId> --x <n> --y <n>
```

### `node:remove`

```bash
agentsdraw node:remove <file.adraw> --id <nodeId>
```

Removes the node and **all edges** incident on it.

### `edge:add`

```bash
agentsdraw edge:add <file.adraw> --from <nodeId> --to <nodeId> \
  [--routing straight|orthogonal|curved] [--dash solid|dashed|dotted] \
  [--head none|arrowOpen|arrowFilled|arrowDouble|square] [--label ""] \
  [--preset 0-7]
```

- If `--preset` is set (0–7), routing/dash/head/tail/stroke come from `applyRelationshipPreset` and override manual routing flags for styling.
- Prints the new edge `id` on stdout.

### `edge:remove`

```bash
agentsdraw edge:remove <file.adraw> --id <edgeId>
```

## Agent workflow tips

1. **Discover node ids** with `node:list` before adding edges.
2. **Prefer `edge:add --preset`** when you want consistent relationship styling (same presets as the desktop app).
3. **Validate** by running `export --format png` in CI to catch corrupt JSON early.
4. After scripted edits, **open** the file in the desktop app for visual review.

## Related packages

- **`@agentsdraw/core`**: `parseDiagram`, `serializeDiagram`, `emptyDiagram`, `renderSVG`, palette and relationship helpers.
- **Desktop app (Tauri)**: interactive editing; CLI is for automation and headless pipelines.
