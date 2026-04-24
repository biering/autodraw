import { vi } from "vitest";

const map = new Map<string, string>();

function memoryImpl(): Storage {
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(String(key), String(value));
    },
    removeItem(key: string) {
      map.delete(String(key));
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
  };
}

/** Stub `globalThis.localStorage` with an in-memory store (Node / broken experimental LS). */
export function installMemoryLocalStorage(): void {
  map.clear();
  vi.stubGlobal("localStorage", memoryImpl());
}

export function clearMemoryLocalStorage(): void {
  map.clear();
}
