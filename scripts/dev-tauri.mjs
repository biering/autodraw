#!/usr/bin/env node
/**
 * Runs `pnpm run dev:tauri` from `apps/app` after ensuring `cargo` is on PATH.
 * Many editors spawn shells without ~/.cargo/bin, so we prepend it when the binary exists.
 *
 * The app `dev:tauri` script pins `CARGO_TARGET_DIR` so a stale global target dir
 * (e.g. pointing at an old `agentsdraw` checkout) cannot break the Tauri build.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const appDir = join(root, "apps", "app");

const cargoName = process.platform === "win32" ? "cargo.exe" : "cargo";
const cargoHomeBin = join(homedir(), ".cargo", "bin");
const cargoHomePath = join(cargoHomeBin, cargoName);

function cargoWorks() {
  const r = spawnSync("cargo", ["--version"], { encoding: "utf8" });
  return r.status === 0;
}

if (!cargoWorks() && existsSync(cargoHomePath)) {
  process.env.PATH = `${cargoHomeBin}${delimiter}${process.env.PATH ?? ""}`;
}

if (!cargoWorks()) {
  console.error(`
Could not run \`cargo\`. Tauri needs the Rust toolchain.

  • Install Rust: https://rustup.rs/
  • Then open a new terminal (or ensure ~/.cargo/bin is on your PATH).

If \`cargo\` works in Terminal.app but not here, your IDE shell may omit ~/.cargo/bin;
this script prepends that directory when ${cargoHomePath} exists.

Until Rust works, use: pnpm dev
`);
  process.exit(1);
}

const shell = process.platform === "win32";
const r = spawnSync("pnpm", ["run", "dev:tauri"], {
  cwd: appDir,
  stdio: "inherit",
  env: process.env,
  shell,
});

process.exit(typeof r.status === "number" ? r.status : 1);
