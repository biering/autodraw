# agentsdraw

Cross-platform diagram editor (Tauri + React + React Flow) with a shared TypeScript core (`@agentsdraw/core`) and an agent-friendly CLI (`@agentsdraw/cli`).

## Monorepo layout

- [`packages/core`](packages/core) — `.adraw` JSON schema (Zod), palette presets, edge routing, and a pure `renderSVG()` used by the app export path and the CLI.
- [`packages/app`](packages/app) — Tauri 2 desktop UI (toolbar, sheets, popovers, React Flow canvas, undo/redo via `zundo`).
- [`packages/cli`](packages/cli) — `oclif` CLI for scripting diagrams from agents/CI.

## `.adraw` file format (v1)

JSON on disk:

```json
{
  "version": 1,
  "palette": "universal",
  "canvas": { "showGrid": true, "gridSpacing": 16, "zoom": 1 },
  "nodes": [
    { "id": "n1", "text": "A node", "x": 260, "y": 330, "w": 140, "h": 64, "styleId": "red" }
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

## Agent workflow (CLI)

```bash
pnpm install
pnpm --filter @agentsdraw/cli build

# Create a diagram
pnpm exec agentsdraw init ./example.adraw --palette universal

# Add nodes + edge
pnpm exec agentsdraw add node ./example.adraw --text "A node" --x 200 --y 200
pnpm exec agentsdraw add node ./example.adraw --text "Another node" --x 520 --y 260
pnpm exec agentsdraw list nodes ./example.adraw

pnpm exec agentsdraw add edge ./example.adraw --from <id1> --to <id2> --preset 4

# Export (CLI uses Resvg for PNG; PDF embeds a high-res PNG for maximum headless compatibility)
pnpm exec agentsdraw export ./example.adraw --format png --output ./out.png
pnpm exec agentsdraw export ./example.adraw --format pdf --output ./out.pdf --no-show-grid
pnpm exec agentsdraw export ./example.adraw --format svg --output ./out.svg
```

The desktop app’s **Export** dialog uses Rust (`svg2pdf` + `resvg`) for **vector PDF** and PNG when you build the Tauri bundle.

### Publishing to npm

The CLI depends on `@agentsdraw/core`, so **publish core first**, then the CLI (from the repo root, with [`npm login`](https://docs.npmjs.com/cli/v10/commands/npm-login) or a granular token):

```bash
pnpm --filter @agentsdraw/core publish --access public
pnpm --filter @agentsdraw/cli publish --access public
```

`prepublishOnly` runs `pnpm run build` in each package so the tarball includes `dist/`. Scoped packages use `publishConfig.access: "public"` in each `package.json`. After the first release, bump versions in both packages before publishing again.

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
pnpm --filter @agentsdraw/app exec tauri dev
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
