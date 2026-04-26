# Autodraw

**Open source** diagram editor for people, teams, and **agents** — one small JSON format (`.adraw`), a fast canvas, and tools so automation and humans stay in sync.

**Website:** [autodraw.ink](https://autodraw.ink) — free web canvas at [`/app`](https://autodraw.ink/app), format spec at [`/spec`](https://autodraw.ink/spec), read-only share links at [`/v?d=…`](https://autodraw.ink/v).

## Goal

Architecture and flow diagrams should be easy to sketch, hand off, and evolve. Autodraw keeps the loop simple: **draw or generate** a `.adraw` file, **commit or share** it, **open** it in the browser or native app, and let **CLI / MCP** do the same operations your editor does — so agents and CI can maintain diagrams next to code.

## Quick demo

From the repo root after `pnpm install`, build the CLI once (`pnpm build` or `pnpm --filter @autodraw/cli build`), then:

```bash
pnpm exec autodraw init ./demo.adraw --palette universal
pnpm exec autodraw add node ./demo.adraw --text "API" --x 200 --y 200
pnpm exec autodraw add node ./demo.adraw --text "Worker" --x 420 --y 220
pnpm exec autodraw add edge ./demo.adraw --from <first-id> --to <second-id> --preset 1
pnpm exec autodraw export ./demo.adraw --format svg --output ./demo.svg
```

Open [`autodraw.ink/app`](https://autodraw.ink/app) and drag in `demo.adraw`, or paste a share payload from the spec page. Same format everywhere.

## Getting started

```bash
git clone https://github.com/biering/autodraw.git
cd autodraw
pnpm install
```

| What you want | Command |
|----------------|---------|
| Web marketing + editor (Astro) | `pnpm --filter web dev` |
| Desktop UI in browser (Vite, no Rust) | `pnpm dev` |
| Full desktop (Tauri + Rust) | `pnpm dev:tauri` |
| All package builds | `pnpm build` |
| Tests | `pnpm -r test` |

The desktop app needs [Rust](https://rustup.rs/) and [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/) for native shells. If `cargo` is missing from `PATH`, try `pnpm dev:tauri` (it prepends `~/.cargo/bin` when present).

## Let your agent draw

1. **`.adraw` v1** — UTF-8 JSON; validated in [`@autodraw/core`](apps/core). Full field list: [autodraw.ink/spec](https://autodraw.ink/spec).
2. **CLI** — [`@autodraw/cli`](apps/cli): `pnpm exec autodraw …` from any machine with the package built or installed.
3. **MCP** — [`@autodraw/mcp`](apps/mcp): stdio server with the same operations for Cursor, Claude Desktop, and other MCP hosts.

Agents can emit JSON that matches the spec, write `.adraw` files in-repo, or call CLI/MCP in CI. Share links (`/v?d=…`, `/app?d=…`) use gzip + base64url encoding — see the spec page for details.

## Monorepo

| Package | Role |
|---------|------|
| [`apps/core`](apps/core) | Schema (Zod), palettes, routing, `renderSVG()` |
| [`apps/editor`](apps/editor) | React Flow editor (web + desktop) |
| [`apps/app`](apps/app) | Tauri 2 shell, licensing, native export |
| [`apps/web`](apps/web) | Astro site + public `/app` canvas |
| [`apps/cli`](apps/cli) | `oclif` CLI for scripts and agents |
| [`apps/mcp`](apps/mcp) | MCP server over stdio |

## Contributing

Contributions are welcome. Open an [issue](https://github.com/biering/autodraw/issues) to discuss larger changes; small fixes and docs can go straight to a PR.

- Match existing style and keep diffs focused.
- `pnpm build` and `pnpm -r test` should pass where relevant.
- Formatting: `pnpm format` / Biome (`biome.json` at repo root).

## Publishing (maintainers)

`@autodraw/cli` and `@autodraw/mcp` depend on `@autodraw/core`. Publish **core** first, then CLI and MCP. `prepublishOnly` builds each package; scoped packages use `publishConfig.access: "public"`.

## Notes

- CLI PDF export uses a raster page inside PDF for portability; the desktop app can produce vector PDF via Rust.
- Keyboard in the webview: undo/redo `Cmd/Ctrl+Z` / `Cmd+Shift+Z`; file shortcuts match the native menu when running in Tauri.
