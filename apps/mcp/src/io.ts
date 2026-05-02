import { readFileSync, writeFileSync } from "node:fs";
import {
  type DiagramV1,
  type EdgeRecord,
  type NodeRecord,
  parseDiagram,
  serializeDiagram,
} from "@autodraw/core";

export class McpDiagramError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpDiagramError";
  }
}

export function readDiagram(path: string): DiagramV1 {
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return parseDiagram(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new McpDiagramError(`Failed to read diagram ${path}: ${msg}`);
  }
}

export function writeDiagram(path: string, d: DiagramV1): void {
  writeFileSync(path, serializeDiagram(d), "utf8");
}

export function requireNode(d: DiagramV1, id: string): NodeRecord {
  const n = d.nodes.find((x) => x.id === id);
  if (!n) throw new McpDiagramError(`Unknown node id: ${id}`);
  return n;
}

export function requireEdge(d: DiagramV1, id: string): EdgeRecord {
  const e = d.edges.find((x) => x.id === id);
  if (!e) throw new McpDiagramError(`Unknown edge id: ${id}`);
  return e;
}
