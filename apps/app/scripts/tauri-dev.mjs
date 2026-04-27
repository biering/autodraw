#!/usr/bin/env node
/**
 * Runs `tauri dev` with `CARGO_TARGET_DIR` pinned under this package's `src-tauri/target`.
 *
 * Also aligns Cargo’s Tauri plugin permission paths with that target dir:
 * Cargo exposes paths like `DEP_TAURI_*_PERMISSION_FILES_PATH` from the **tauri** crate’s
 * build output. If those were generated while `CARGO_TARGET_DIR` pointed at another checkout
 * (e.g. `agentsdraw/.../target`), builds keep failing with missing `.../permissions/.../app_hide.toml`
 * even after fixing `CARGO_TARGET_DIR`. Bumping `src-tauri/tauri-build-cache-version` (tracked)
 * forces a one-time `cargo clean` so plugin metadata is regenerated.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(dirname(fileURLToPath(import.meta.url)));
const srcTauri = join(appDir, "src-tauri");
const targetDir = resolve(srcTauri, "target");
const versionFile = join(srcTauri, "tauri-build-cache-version");
const appliedFile = join(srcTauri, ".tauri-cache-applied");

function readRequiredVersion() {
  try {
    return readFileSync(versionFile, "utf8").trim();
  } catch {
    return "0";
  }
}

function readAppliedVersion() {
  try {
    return readFileSync(appliedFile, "utf8").trim();
  } catch {
    return "";
  }
}

function syncBuildCacheWithVersion() {
  const required = readRequiredVersion();
  const applied = readAppliedVersion();
  if (required === "0" || applied === required) return;

  console.warn(
    `[autodraw] Tauri Rust cache out of date (${applied || "none"} → ${required}). Running cargo clean…`,
  );
  const shell = process.platform === "win32";
  const clean = spawnSync("cargo", ["clean"], {
    cwd: srcTauri,
    stdio: "inherit",
    env: { ...process.env, CARGO_TARGET_DIR: targetDir },
    shell,
  });
  if (clean.status !== 0) {
    console.error("[autodraw] cargo clean failed; fix errors above before running tauri dev.");
    process.exit(clean.status ?? 1);
  }
  writeFileSync(appliedFile, `${required}\n`, "utf8");
}

syncBuildCacheWithVersion();

const shell = process.platform === "win32";
const r = spawnSync("pnpm", ["exec", "tauri", "dev"], {
  cwd: appDir,
  stdio: "inherit",
  env: { ...process.env, CARGO_TARGET_DIR: targetDir },
  shell,
});

process.exit(typeof r.status === "number" ? r.status : 1);
