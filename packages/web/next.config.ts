import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@autodraw/editor", "@autodraw/core"],
  turbopack: {
    // `CliSkillHelp` imports `SKILL.md?raw` from the CLI package — treat as a string module.
    rules: {
      "*.md": {
        condition: { query: /raw/ },
        type: "raw",
      },
    },
  },
};

export default nextConfig;
