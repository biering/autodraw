# packages/web — Astro + React

- **Stack**: Astro 5 (SSG), `@astrojs/react` for islands, Tailwind v4 via `@tailwindcss/vite`, deploy as static **Workers Assets** with Wrangler (`astro build` → `dist/`).
- **Editor**: `@autodraw/editor` is loaded only on `/app` and in client islands (`client:only="react"` / `client:visible`) because it depends on `window` / DOM / React Flow.
- **Share viewer** (`/v`): decoding of `?d=` runs in the browser (`DiagramViewerIsland`), not on a server.
- **Paths**: `@/*` maps to `./src/*` (see `tsconfig.json`).
- **Do not** reintroduce Next.js or OpenNext here; use `astro` + `wrangler` scripts in `package.json`.
