import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

/** Must match Next’s inferred `outputFileTracingRoot` in this monorepo (see turbopack.root warning). */
const webRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@autodraw/editor", "@autodraw/core"],
  turbopack: {
    root: webRoot,
    // `CliSkillHelp` imports `SKILL.md?raw` from the CLI package — treat as a string module.
    rules: {
      "*.md": {
        condition: { query: /raw/ },
        type: "raw",
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      resourceQuery: /raw/,
      type: "asset/source",
    });
    return config;
  },
};

export default nextConfig;

/** Lets `next dev` align with the OpenNext Cloudflare adapter (bindings in dev). */
initOpenNextCloudflareForDev();
