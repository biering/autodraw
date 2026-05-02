# Autodraw — agent guide

This file orients AI assistants and humans working across the **pnpm monorepo**. User-facing overview lives in [`README.md`](README.md).

## What this repo is

- **Autodraw** — open-source diagram editor and **`.adraw` v1** format (UTF-8 JSON). Schema and rendering live in `@autodraw/core`; public spec and examples: [autodraw.ink/spec](https://autodraw.ink/spec).
- **Agents / automation** — same operations as the UI via [`@autodraw/cli`](apps/cli) (`autodraw …`) and [`@autodraw/mcp`](apps/mcp) (stdio MCP server). Prefer CLI/MCP or validated JSON over guessing field shapes.

## Workspace layout

| Package | Path | Role |
|--------|------|------|
| `@autodraw/core` | `apps/core` | Zod schema, node styles, routing, `renderSVG()` — **published entry is `dist/`** (compiled with `tsc`). |
| `@autodraw/editor` | `apps/editor` | React Flow canvas UI — **exports TypeScript source** (`./src/...`); no separate `build` script. |
| `@autodraw/app` | `apps/app` | Tauri 2 desktop shell, licensing, Vite + React; consumes editor + core. |
| `web` | `apps/web` | Astro 6 SSG + React islands; marketing site, `/app` canvas, `/spec`, `/v`, imprint/privacy. Deploy: static **Workers Assets** + Wrangler. |
| `@autodraw/cli` | `apps/cli` | oclif CLI; `bin/run.mjs` → compiled `dist/`. |
| `@autodraw/mcp` | `apps/mcp` | MCP stdio server mirroring CLI operations. |

Root [`package.json`](package.json): `pnpm build` → `pnpm -r run build`, `pnpm test` → recursive tests, `pnpm format` / Biome at repo root.

## Build order and resolution

- **`@autodraw/core` must be built** (`apps/core/dist` exists) before any tool that resolves its package `exports` to `./dist/*.js` without compiling core from source — e.g. **Vite/Astro** bundling the web app or **Node** running another package’s compiled output that imports core.
- **`web`** `package.json` `build` (and `preview` / `deploy`) runs `pnpm --filter @autodraw/core run build` before `astro build`, so CI commands like `pnpm --filter web build` stay correct.
- **`@autodraw/editor`** does not emit `dist`; bundlers compile it. Do not assume a `apps/editor/dist` folder.
- Full graph: `pnpm build` at the repo root builds all packages that define a `build` script (order is workspace-dependent; when in doubt, build core first or use root `pnpm build`).

## Package-specific notes

### `apps/web` (Astro)

- Stack: Astro (static output), `@astrojs/react`, Tailwind v4 via `@tailwindcss/vite`. Path alias `@/*` → `./src/*` (see that package’s `tsconfig.json`).
- **Editor** (`@autodraw/editor`) is heavy on `window` / DOM / React Flow — load it only on `/app` and in client islands (`client:only="react"`, `client:visible`, etc.), not in server-only Astro frontmatter.
- **Share viewer** `/v`: decoding `?d=` happens in the **browser** (client island), not on the server.
- **Do not** reintroduce Next.js or OpenNext here; site is **Astro + Wrangler** only.

### `apps/app` (Tauri)

- Needs Rust and [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/). Root `pnpm dev:tauri` can help with `PATH` if `cargo` lives under `~/.cargo/bin`.

### `apps/cli` / `apps/mcp`

- Depend on `@autodraw/core`; `prepublishOnly` runs each package’s build. For local runs, build core (or full `pnpm build`) before relying on compiled CLI/MCP `dist/`.

## Quality bar

- Keep changes **scoped** to the task; match existing naming, imports, and formatting.
- **Biome** config at repo root (`biome.json`); some packages add local Biome config (e.g. web may tune Astro/lint rules).
- Before pushing: where relevant, **`pnpm build`**, **`pnpm -r test`**, and package-level lint/typecheck as touched by the change.

## Publishing (maintainers)

Publish **`@autodraw/core` first**, then packages that depend on it (e.g. CLI, MCP). See [`README.md`](README.md) “Publishing”.
