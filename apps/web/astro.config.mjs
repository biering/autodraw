import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
	site: "https://autodraw.ink",
	integrations: [react(), sitemap()],
	vite: {
		plugins: [tailwindcss()],
		// `simple-icons` is one huge ESM; Vite’s dep optimizer can mis-resolve named exports (`siCursor`).
		optimizeDeps: {
			exclude: ["simple-icons"],
		},
	},
});
