import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://v2.tauri.app/start/frontend/vite/
const tauriDevHost = process.env.TAURI_DEV_HOST;
const esTarget =
  process.env.TAURI_ENV_PLATFORM === "windows" ? "chrome105" : "safari13";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_ENV_", "TAURI_"],
  server: {
    port: 1420,
    strictPort: true,
    // `true` listens on all addresses so both http://localhost:1420 and http://127.0.0.1:1420 work
    // (WKWebView / OS resolver quirks vs plain `pnpm dev` in a browser).
    host: tauriDevHost || true,
    hmr: tauriDevHost
      ? { protocol: "ws", host: tauriDevHost, port: 1421 }
      : undefined,
    watch: { ignored: ["**/src-tauri/**"] },
  },
  esbuild: {
    target: esTarget,
  },
  build: {
    // WebView targets (Chromium vs WebKit); avoids blank dev windows from unsupported syntax.
    target: esTarget,
    minify: process.env.TAURI_ENV_DEBUG ? false : "esbuild",
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
});
