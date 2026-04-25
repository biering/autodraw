This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Deploy on Cloudflare Workers (OpenNext)

This app is wired for [Cloudflare Workers + Workers Assets](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/) using [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare/get-started) (`open-next.config.ts`, `wrangler.jsonc`, `preview` / `deploy` scripts).

From the monorepo root:

```bash
pnpm deploy:web
```

Or from `packages/web`:

```bash
pnpm preview   # OpenNext build + local Workers preview
pnpm deploy    # OpenNext build + deploy (requires `wrangler login`)
```

1. Copy `.dev.vars.example` to `.dev.vars` and set `NEXTJS_ENV=development` for local preview when using Workers bindings.
2. Edit `wrangler.jsonc` `name` (and `services[0].service`) to match your Worker name on Cloudflare.
3. Optional: `pnpm cf-typegen` generates `cloudflare-env.d.ts` for Wrangler env typings.

`pnpm build` uses webpack (`next build --webpack`) so the Next.js production build succeeds in this monorepo. The **OpenNext** step (`opennextjs-cloudflare build`) must also complete for deploy; if it fails while bundling the server, bump `@opennextjs/cloudflare` when a release adds full support for your Next.js version, or follow [OpenNext Cloudflare troubleshooting](https://opennext.js.org/cloudflare).

For R2 incremental cache, Cloudflare Images, and other overrides, see [OpenNext Cloudflare caching](https://opennext.js.org/cloudflare/caching).
