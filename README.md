# Autodraw

Cross-platform diagram editor (Tauri + React + React Flow) with a shared TypeScript core (`@autodraw/core`), a reusable editor package (`@autodraw/editor`), an agent-friendly CLI (`@autodraw/cli`), a local MCP server (`@autodraw/mcp`), and a Next.js marketing site (`packages/web`).

## Monorepo layout

- [`packages/core`](packages/core) — `.adraw` JSON schema (Zod), palette presets, edge routing, and a pure `renderSVG()` used by the app export path and the CLI.
- [`packages/editor`](packages/editor) — shared React Flow diagram editor (canvas, toolbar, state) used by the desktop app and the free web canvas; share-link encode/decode helpers for `/v` and `/app?d=`.
- [`packages/app`](packages/app) — Tauri 2 desktop shell (licensing, native menus, export) wrapping `@autodraw/editor`.
- [`packages/web`](packages/web) — SEO landing, [`.adraw` v1 spec](/spec) at `/spec`, read-only viewer at `/v?d=…`, and free in-browser editor at `/app` (no license gate; `/app?d=…` deep-links the same gzip+base64url payload).
- [`packages/cli`](packages/cli) — `oclif` CLI for scripting diagrams from agents/CI.
- [`packages/mcp`](packages/mcp) — stdio [Model Context Protocol](https://modelcontextprotocol.io/) server exposing the same operations as the CLI for MCP-capable hosts (Cursor, Claude Desktop, etc.).

## `.adraw` file format (v1)

JSON on disk:

```json
{
  "version": 1,
  "palette": "universal",
  "canvas": { "showGrid": true, "gridSpacing": 16, "zoom": 1 },
  "nodes": [
    { "id": "n1", "text": "A node", "x": 260, "y": 330, "w": 140, "h": 64, "styleId": "yellow" }
  ],
  "edges": [
    {
      "id": "e1",
      "from": "n1",
      "to": "n2",
      "routing": "orthogonal",
      "head": "lineArrow",
      "dash": "solid",
      "tail": "none",
      "label": "",
      "strokeWidth": 1
    }
  ]
}
```

## Agent workflow (CLI + MCP)

```bash
pnpm install
pnpm --filter @autodraw/cli build
pnpm --filter @autodraw/mcp build

# Create a diagram
pnpm exec autodraw init ./example.adraw --palette universal

# Add nodes + edge
pnpm exec autodraw add node ./example.adraw --text "A node" --x 200 --y 200
pnpm exec autodraw add node ./example.adraw --text "Another node" --x 520 --y 260
pnpm exec autodraw list nodes ./example.adraw

pnpm exec autodraw add edge ./example.adraw --from <id1> --to <id2> --preset 4

# Export (CLI uses Resvg for PNG; PDF embeds a high-res PNG for maximum headless compatibility)
pnpm exec autodraw export ./example.adraw --format png --output ./out.png
pnpm exec autodraw export ./example.adraw --format pdf --output ./out.pdf --no-show-grid
pnpm exec autodraw export ./example.adraw --format svg --output ./out.svg
```

The desktop app’s **Export** dialog uses Rust (`svg2pdf` + `resvg`) for **vector PDF** and PNG when you build the Tauri bundle.

### Publishing to npm

The CLI and MCP depend on `@autodraw/core`, so **publish core first**, then the CLI and MCP (from the repo root, with [`npm login`](https://docs.npmjs.com/cli/v10/commands/npm-login) or a granular token):

```bash
pnpm --filter @autodraw/core publish --access public
pnpm --filter @autodraw/cli publish --access public
pnpm --filter @autodraw/mcp publish --access public
```

`prepublishOnly` runs `pnpm run build` in each package so the tarball includes `dist/`. Scoped packages use `publishConfig.access: "public"` in each `package.json`. After the first release, bump versions before publishing again.

## Desktop app (dev)

**UI only (Node + pnpm, no Rust):** Vite on [http://localhost:1420](http://localhost:1420). Native file dialogs, menu IPC, and Rust export are skipped in a normal browser; the app still loads.

```bash
pnpm install
pnpm dev
```

**Full desktop shell (Tauri):** requires [Rust / Cargo](https://rustup.rs/). If `tauri dev` fails with “No such file or directory” for `cargo metadata`, either Rust is not installed or `cargo` is not on `PATH` (some IDE terminals omit `~/.cargo/bin`; `pnpm dev:tauri` runs a small launcher that prepends that directory when `~/.cargo/bin/cargo` exists).

```bash
pnpm install
pnpm dev:tauri
```

Equivalent from the app package:

```bash
pnpm --filter @autodraw/app exec tauri dev
```

Also install macOS / Windows / Linux [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) as needed.

Keyboard shortcuts (webview):

- Undo / Redo: `Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`
- File: `Cmd/Ctrl+N` (new), `Cmd/Ctrl+O` (open), `Cmd/Ctrl+S` (save)

The native menu emits the same actions as the File/Edit menu.

## Tests

```bash
pnpm -r test
```

## Notes / follow-ups

- Finder / Explorer “double click opens app” is configured via Tauri `bundle.fileAssociations`. Forwarding `RunEvent::Opened` into the webview can be added in `src-tauri` when you want “open file on cold start” wired end-to-end on all platforms.
- CLI PDF export is intentionally raster-in-PDF for portability; use the desktop exporter for pure vector PDF output.
