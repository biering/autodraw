import { CLIError } from "@oclif/core/errors";
import { readFileSync, writeFileSync } from "node:fs";
import {
  parseDiagram,
  serializeDiagram,
  type DiagramV1,
  type EdgeRecord,
  type NodeRecord,
} from "@autodraw/core";

export function readDiagram(path: string): DiagramV1 {
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return parseDiagram(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new CLIError(`Failed to read diagram ${path}: ${msg}`, { exit: 1 });
  }
}

export function writeDiagram(path: string, d: DiagramV1): void {
  writeFileSync(path, serializeDiagram(d), "utf8");
}

export function requireNode(d: DiagramV1, id: string): NodeRecord {
  const n = d.nodes.find((x) => x.id === id);
  if (!n) throw new CLIError(`Unknown node id: ${id}`, { exit: 1 });
  return n;
}

export function requireEdge(d: DiagramV1, id: string): EdgeRecord {
  const e = d.edges.find((x) => x.id === id);
  if (!e) throw new CLIError(`Unknown edge id: ${id}`, { exit: 1 });
  return e;
}
