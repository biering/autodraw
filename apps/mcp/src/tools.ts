import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import {
  applyRelationshipPreset,
  type DiagramV1,
  defaultStyleId,
  type EdgeDash,
  type EdgeHead,
  type EdgeRecord,
  type EdgeRouting,
  emptyDiagram,
  type NodeShape,
  nodeShapeSchema,
  normalizeDiagramName,
  parseDiagram,
  renderSVG,
  serializeDiagram,
} from "@autodraw/core";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { Resvg } from "@resvg/resvg-js";
import { PDFDocument } from "pdf-lib";
import { readDiagram, requireEdge, requireNode, writeDiagram } from "./io.js";

function okText(data: unknown): CallToolResult {
  return {
    content: [
      { type: "text", text: typeof data === "string" ? data : JSON.stringify(data, null, 2) },
    ],
  };
}

function errText(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return {};
}

function str(r: Record<string, unknown>, k: string): string | undefined {
  const v = r[k];
  return typeof v === "string" ? v : undefined;
}

function num(r: Record<string, unknown>, k: string): number | undefined {
  const v = r[k];
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function bool(r: Record<string, unknown>, k: string): boolean | undefined {
  const v = r[k];
  if (typeof v === "boolean") return v;
  return undefined;
}

export const TOOL_DEFINITIONS = [
  {
    name: "autodraw_init",
    description: "Create a new empty .adraw diagram file at the given path.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Output file path" },
      },
      required: ["path"],
    },
  },
  {
    name: "autodraw_add_node",
    description: "Add a node to a diagram file.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        text: { type: "string" },
        x: { type: "number", description: "Default 240" },
        y: { type: "number", description: "Default 240" },
        w: { type: "number", description: "Default 160" },
        h: { type: "number", description: "Default 72" },
        styleId: {
          type: "string",
          description: "Optional style id; defaults to first custom style",
        },
        id: { type: "string", description: "Optional explicit node id" },
        shape: { type: "string", enum: [...nodeShapeSchema.options] },
        link: { type: "string", description: "Optional https URL" },
        locked: { type: "boolean", description: "When true, node is locked in the editor" },
      },
      required: ["path", "text"],
    },
  },
  {
    name: "autodraw_add_edge",
    description: "Add an edge between two nodes.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        from: { type: "string" },
        to: { type: "string" },
        routing: { type: "string", enum: ["straight", "orthogonal", "curved"] },
        dash: { type: "string", enum: ["solid", "dashed", "dotted"] },
        head: {
          type: "string",
          enum: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
        },
        tail: {
          type: "string",
          enum: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
        },
        label: { type: "string" },
        strokeWidth: { type: "number", minimum: 1, maximum: 20 },
        sourceHandle: { type: "string" },
        targetHandle: { type: "string" },
        preset: {
          type: "integer",
          minimum: 0,
          maximum: 7,
          description: "Relationship preset; overrides routing/dash/head/tail/strokeWidth",
        },
      },
      required: ["path", "from", "to"],
    },
  },
  {
    name: "autodraw_remove_node",
    description: "Remove a node and all incident edges.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, id: { type: "string" } },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_remove_edge",
    description: "Remove an edge by id.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, id: { type: "string" } },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_move_node",
    description: "Move a node to new x,y.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        id: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
      },
      required: ["path", "id", "x", "y"],
    },
  },
  {
    name: "autodraw_patch_node",
    description: "Patch fields on an existing node (at least one field besides id).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        id: { type: "string" },
        text: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        w: { type: "number" },
        h: { type: "number" },
        styleId: { type: "string" },
        shape: { type: "string", enum: [...nodeShapeSchema.options] },
        link: { type: "string", description: "Set URL; use empty string to clear" },
        locked: { type: "boolean", description: "Set locked state" },
      },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_patch_edge",
    description: "Patch fields on an existing edge.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        id: { type: "string" },
        routing: { type: "string", enum: ["straight", "orthogonal", "curved"] },
        dash: { type: "string", enum: ["solid", "dashed", "dotted"] },
        head: {
          type: "string",
          enum: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
        },
        tail: {
          type: "string",
          enum: ["none", "lineArrow", "triangleArrow", "triangleReversed", "circle", "diamond"],
        },
        label: { type: "string" },
        strokeWidth: { type: "number" },
        sourceHandle: { type: "string", description: 'Use "" to clear' },
        targetHandle: { type: "string", description: 'Use "" to clear' },
        preset: { type: "integer", minimum: 0, maximum: 7 },
        link: { type: "string", description: "Set URL; use empty string to clear" },
        locked: { type: "boolean", description: "Set locked state" },
      },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_add_text_label",
    description: "Add a free-floating text label.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        text: { type: "string" },
        x: { type: "number", description: "Default 240" },
        y: { type: "number", description: "Default 240" },
        id: { type: "string", description: "Optional explicit id" },
      },
      required: ["path", "text"],
    },
  },
  {
    name: "autodraw_add_frame",
    description: "Add a named frame (region).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        x: { type: "number", description: "Default 80" },
        y: { type: "number", description: "Default 80" },
        w: { type: "number", description: "Default 320" },
        h: { type: "number", description: "Default 200" },
        name: { type: "string", description: "Optional title" },
        id: { type: "string" },
      },
      required: ["path"],
    },
  },
  {
    name: "autodraw_add_image",
    description: "Add an image by URL (no base64).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        src: { type: "string", description: "https image URL" },
        x: { type: "number", description: "Default 200" },
        y: { type: "number", description: "Default 200" },
        w: { type: "number", description: "Default 160" },
        h: { type: "number", description: "Default 120" },
        alt: { type: "string" },
        id: { type: "string" },
      },
      required: ["path", "src"],
    },
  },
  {
    name: "autodraw_remove_text_label",
    description: "Remove a text label by id.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, id: { type: "string" } },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_remove_frame",
    description: "Remove a frame by id.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, id: { type: "string" } },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_remove_image",
    description: "Remove an image by id.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, id: { type: "string" } },
      required: ["path", "id"],
    },
  },
  {
    name: "autodraw_list_text_labels",
    description: "List text labels (JSON array).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "autodraw_list_frames",
    description: "List frames (JSON array).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "autodraw_list_images",
    description: "List images (JSON array).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "autodraw_list_nodes",
    description: "List all nodes in a diagram (JSON array).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "autodraw_list_edges",
    description: "List all edges in a diagram (JSON array).",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" } },
      required: ["path"],
    },
  },
  {
    name: "autodraw_validate",
    description: "Validate diagram JSON; optionally rewrite file with normalized JSON.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        rewrite: { type: "boolean", description: "Write migrated formatted JSON back" },
      },
      required: ["path"],
    },
  },
  {
    name: "autodraw_export",
    description: "Export diagram to PNG, PDF, or SVG (same behavior as CLI).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Input .adraw path" },
        format: { type: "string", enum: ["png", "pdf", "svg"] },
        output: { type: "string", description: "Output file path" },
        showGrid: { type: "boolean", description: "Default true" },
        scale: { type: "number", description: "PNG scale 1–8 (default 2); ignored for SVG" },
      },
      required: ["path", "format", "output"],
    },
  },
  {
    name: "autodraw_show_diagram",
    description: "Show diagram summary or full JSON.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        fullJson: { type: "boolean", description: "Return full serialized diagram" },
      },
      required: ["path"],
    },
  },
  {
    name: "autodraw_rename_diagram",
    description: "Set diagram display name.",
    inputSchema: {
      type: "object",
      properties: { path: { type: "string" }, name: { type: "string" } },
      required: ["path", "name"],
    },
  },
  {
    name: "autodraw_set_canvas",
    description: "Update canvas settings (at least one of showGrid, gridSpacing, zoom).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string" },
        showGrid: { type: "boolean" },
        gridSpacing: { type: "number", minimum: 4, maximum: 200 },
        zoom: { type: "number", description: "0.05–8" },
      },
      required: ["path"],
    },
  },
  {
    name: "autodraw_copy_styles",
    description: "Copy customStyles from source diagram into target.",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Target diagram path (modified)" },
        fromPath: { type: "string", description: "Source diagram path" },
      },
      required: ["path", "fromPath"],
    },
  },
  {
    name: "autodraw_copy_palette",
    description: "Deprecated: use autodraw_copy_styles (copies customStyles only).",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "Target diagram path (modified)" },
        fromPath: { type: "string", description: "Source diagram path" },
      },
      required: ["path", "fromPath"],
    },
  },
] as const;

export async function handleToolCall(name: string, args: unknown): Promise<CallToolResult> {
  try {
    return await dispatchTool(name, args);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return errText(msg);
  }
}

async function dispatchTool(name: string, args: unknown): Promise<CallToolResult> {
  const r = asRecord(args);

  switch (name) {
    case "autodraw_init": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = emptyDiagram();
      writeFileSync(path, serializeDiagram(doc), "utf8");
      return okText({ ok: true, path, message: `Created ${path}` });
    }

    case "autodraw_add_node": {
      const path = str(r, "path");
      const text = str(r, "text");
      if (!path || text === undefined) return errText("path and text are required");
      const doc = readDiagram(path);
      const id = str(r, "id") ?? randomUUID();
      const styleId = str(r, "styleId") ?? defaultStyleId(doc);
      const shapeRaw = str(r, "shape");
      let shape: NodeShape | undefined;
      if (shapeRaw !== undefined) {
        const p = nodeShapeSchema.safeParse(shapeRaw);
        if (!p.success) return errText(`invalid shape: ${shapeRaw}`);
        shape = p.data;
      }
      const linkRaw = str(r, "link");
      let link: string | undefined;
      if (linkRaw !== undefined) {
        try {
          new URL(linkRaw);
          link = linkRaw;
        } catch {
          return errText("invalid link URL");
        }
      }
      const locked = bool(r, "locked");
      doc.nodes.push({
        id,
        text,
        x: num(r, "x") ?? 240,
        y: num(r, "y") ?? 240,
        w: num(r, "w") ?? 160,
        h: num(r, "h") ?? 72,
        styleId,
        ...(shape ? { shape } : {}),
        ...(link !== undefined ? { link } : {}),
        ...(locked === true ? { locked: true } : {}),
      });
      writeDiagram(path, doc);
      return okText({ nodeId: id });
    }

    case "autodraw_add_edge": {
      const path = str(r, "path");
      const from = str(r, "from");
      const to = str(r, "to");
      if (!path || !from || !to) return errText("path, from, and to are required");
      const doc = readDiagram(path);
      const id = randomUUID();
      const preset = num(r, "preset");
      let edge: EdgeRecord;
      if (preset !== undefined && preset >= 0 && preset <= 7) {
        const st = applyRelationshipPreset(preset);
        edge = {
          id,
          from,
          to,
          label: str(r, "label") ?? "",
          routing: st.routing,
          dash: st.dash,
          head: st.head,
          tail: st.tail,
          strokeWidth: st.strokeWidth,
          relationshipPreset: st.relationshipPreset,
        };
      } else {
        edge = {
          id,
          from,
          to,
          routing: (str(r, "routing") as EdgeRouting) ?? "orthogonal",
          dash: (str(r, "dash") as EdgeDash) ?? "solid",
          head: (str(r, "head") as EdgeHead) ?? "lineArrow",
          tail: (str(r, "tail") as EdgeHead | undefined) ?? "none",
          label: str(r, "label") ?? "",
          strokeWidth: num(r, "strokeWidth") ?? 1,
        };
      }
      const sh = str(r, "sourceHandle");
      const th = str(r, "targetHandle");
      if (sh) edge.sourceHandle = sh;
      if (th) edge.targetHandle = th;
      doc.edges.push(edge);
      writeDiagram(path, doc);
      return okText({ edgeId: id });
    }

    case "autodraw_remove_node": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      doc.nodes = doc.nodes.filter((n) => n.id !== id);
      doc.edges = doc.edges.filter((e) => e.from !== id && e.to !== id);
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_remove_edge": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      doc.edges = doc.edges.filter((e) => e.id !== id);
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_move_node": {
      const path = str(r, "path");
      const id = str(r, "id");
      const x = num(r, "x");
      const y = num(r, "y");
      if (!path || !id || x === undefined || y === undefined)
        return errText("path, id, x, y are required");
      const doc = readDiagram(path);
      requireNode(doc, id);
      const idx = doc.nodes.findIndex((n) => n.id === id);
      const n = doc.nodes[idx]!;
      doc.nodes[idx] = { ...n, x, y };
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_patch_node": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      requireNode(doc, id);
      const hasPatch =
        str(r, "text") !== undefined ||
        num(r, "x") !== undefined ||
        num(r, "y") !== undefined ||
        num(r, "w") !== undefined ||
        num(r, "h") !== undefined ||
        str(r, "styleId") !== undefined ||
        str(r, "shape") !== undefined ||
        str(r, "link") !== undefined ||
        Object.hasOwn(r, "locked");
      if (!hasPatch)
        return errText("Provide at least one of: text, x, y, w, h, styleId, shape, link, locked");
      const idx = doc.nodes.findIndex((n) => n.id === id);
      const n = doc.nodes[idx]!;
      const next = { ...n };
      const t = str(r, "text");
      if (t !== undefined) next.text = t;
      const x = num(r, "x");
      if (x !== undefined) next.x = x;
      const y = num(r, "y");
      if (y !== undefined) next.y = y;
      const w = num(r, "w");
      if (w !== undefined) next.w = w;
      const h = num(r, "h");
      if (h !== undefined) next.h = h;
      const st = str(r, "styleId");
      if (st !== undefined) next.styleId = st;
      const shp = str(r, "shape");
      if (shp !== undefined) {
        const p = nodeShapeSchema.safeParse(shp);
        if (!p.success) return errText(`invalid shape: ${shp}`);
        next.shape = p.data;
      }
      const linkPatch = str(r, "link");
      if (linkPatch !== undefined) {
        if (linkPatch === "") {
          delete next.link;
        } else {
          try {
            new URL(linkPatch);
            next.link = linkPatch;
          } catch {
            return errText("invalid link URL");
          }
        }
      }
      if (Object.hasOwn(r, "locked")) {
        if (bool(r, "locked") === true) next.locked = true;
        else delete next.locked;
      }
      doc.nodes[idx] = next;
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_patch_edge": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      requireEdge(doc, id);
      const hasPatch =
        str(r, "routing") !== undefined ||
        str(r, "dash") !== undefined ||
        str(r, "head") !== undefined ||
        str(r, "tail") !== undefined ||
        str(r, "label") !== undefined ||
        num(r, "strokeWidth") !== undefined ||
        str(r, "sourceHandle") !== undefined ||
        str(r, "targetHandle") !== undefined ||
        num(r, "preset") !== undefined ||
        str(r, "link") !== undefined ||
        Object.hasOwn(r, "locked");
      if (!hasPatch) return errText("Provide at least one patch field, preset, link, or locked");
      const idx = doc.edges.findIndex((e) => e.id === id);
      const e = { ...doc.edges[idx]! };
      const preset = num(r, "preset");
      if (preset !== undefined && preset >= 0 && preset <= 7) {
        Object.assign(e, applyRelationshipPreset(preset));
      }
      const routing = str(r, "routing");
      if (routing) e.routing = routing as EdgeRouting;
      const dash = str(r, "dash");
      if (dash) e.dash = dash as EdgeDash;
      const head = str(r, "head");
      if (head) e.head = head as EdgeHead;
      const tail = str(r, "tail");
      if (tail) e.tail = tail as EdgeHead;
      const label = str(r, "label");
      if (label !== undefined) e.label = label;
      const sw = num(r, "strokeWidth");
      if (sw !== undefined) e.strokeWidth = sw;
      if (str(r, "sourceHandle") !== undefined) {
        const v = str(r, "sourceHandle")!;
        if (v === "") delete e.sourceHandle;
        else e.sourceHandle = v;
      }
      if (str(r, "targetHandle") !== undefined) {
        const v = str(r, "targetHandle")!;
        if (v === "") delete e.targetHandle;
        else e.targetHandle = v;
      }
      const linkEdge = str(r, "link");
      if (linkEdge !== undefined) {
        if (linkEdge === "") {
          delete e.link;
        } else {
          try {
            new URL(linkEdge);
            e.link = linkEdge;
          } catch {
            return errText("invalid link URL");
          }
        }
      }
      if (Object.hasOwn(r, "locked")) {
        if (bool(r, "locked") === true) e.locked = true;
        else delete e.locked;
      }
      doc.edges[idx] = e;
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_add_text_label": {
      const path = str(r, "path");
      const text = str(r, "text");
      if (!path || text === undefined) return errText("path and text are required");
      const doc = readDiagram(path);
      const id = str(r, "id") ?? randomUUID();
      doc.textLabels.push({
        id,
        text,
        x: num(r, "x") ?? 240,
        y: num(r, "y") ?? 240,
      });
      writeDiagram(path, doc);
      return okText({ textLabelId: id });
    }

    case "autodraw_add_frame": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      const id = str(r, "id") ?? randomUUID();
      const name = str(r, "name");
      doc.frames.push({
        id,
        x: num(r, "x") ?? 80,
        y: num(r, "y") ?? 80,
        w: num(r, "w") ?? 320,
        h: num(r, "h") ?? 200,
        ...(name !== undefined && name !== "" ? { name } : {}),
      });
      writeDiagram(path, doc);
      return okText({ frameId: id });
    }

    case "autodraw_add_image": {
      const path = str(r, "path");
      const src = str(r, "src");
      if (!path || !src) return errText("path and src are required");
      try {
        new URL(src);
      } catch {
        return errText("invalid src URL");
      }
      const doc = readDiagram(path);
      const id = str(r, "id") ?? randomUUID();
      const alt = str(r, "alt");
      doc.images.push({
        id,
        src,
        x: num(r, "x") ?? 200,
        y: num(r, "y") ?? 200,
        w: num(r, "w") ?? 160,
        h: num(r, "h") ?? 120,
        ...(alt !== undefined && alt !== "" ? { alt } : {}),
      });
      writeDiagram(path, doc);
      return okText({ imageId: id });
    }

    case "autodraw_remove_text_label": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      doc.textLabels = doc.textLabels.filter((t) => t.id !== id);
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_remove_frame": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      doc.frames = doc.frames.filter((f) => f.id !== id);
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_remove_image": {
      const path = str(r, "path");
      const id = str(r, "id");
      if (!path || !id) return errText("path and id are required");
      const doc = readDiagram(path);
      doc.images = doc.images.filter((im) => im.id !== id);
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_list_text_labels": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      return okText(doc.textLabels);
    }

    case "autodraw_list_frames": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      return okText(doc.frames);
    }

    case "autodraw_list_images": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      return okText(doc.images);
    }

    case "autodraw_list_nodes": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      return okText(doc.nodes);
    }

    case "autodraw_list_edges": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      return okText(doc.edges);
    }

    case "autodraw_validate": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
      const doc = parseDiagram(raw);
      if (bool(r, "rewrite") === true) {
        writeFileSync(path, serializeDiagram(doc), "utf8");
        return okText({ valid: true, rewrote: true });
      }
      return okText({ valid: true });
    }

    case "autodraw_export": {
      const path = str(r, "path");
      const format = str(r, "format");
      const output = str(r, "output");
      if (!path || !format || !output) return errText("path, format, and output are required");
      const diagram = readDiagram(path);
      const showGrid = bool(r, "showGrid") !== false;
      const svg = renderSVG(diagram, { showGrid });

      if (format === "svg") {
        writeFileSync(output, svg, "utf8");
        return okText({ ok: true, output, format: "svg" });
      }

      const scale = Math.max(1, Math.min(8, num(r, "scale") ?? 2));

      if (format === "png") {
        const resvg = new Resvg(svg, {
          fitTo: { mode: "zoom", value: Math.max(50, Math.min(400, scale * 100)) },
        });
        const png = resvg.render().asPng();
        writeFileSync(output, png);
        return okText({ ok: true, output, format: "png" });
      }

      if (format === "pdf") {
        const resvg = new Resvg(svg, { fitTo: { mode: "zoom", value: 2400 } });
        const png = resvg.render().asPng();
        const pdf = await PDFDocument.create();
        const image = await pdf.embedPng(png);
        const page = pdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        const bytes = await pdf.save();
        writeFileSync(output, bytes);
        return okText({ ok: true, output, format: "pdf" });
      }

      return errText(`unknown format: ${format}`);
    }

    case "autodraw_show_diagram": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      if (bool(r, "fullJson") === true) {
        return okText(JSON.parse(serializeDiagram(doc)) as DiagramV1);
      }
      return okText({
        name: doc.name,
        nodes: doc.nodes.length,
        edges: doc.edges.length,
        textLabels: doc.textLabels.length,
        frames: doc.frames.length,
        images: doc.images.length,
        customStyles: doc.customStyles?.length ?? 0,
        canvas: doc.canvas,
      });
    }

    case "autodraw_rename_diagram": {
      const path = str(r, "path");
      const name = str(r, "name");
      if (!path || name === undefined) return errText("path and name are required");
      const doc = readDiagram(path);
      doc.name = normalizeDiagramName(name);
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_set_canvas": {
      const path = str(r, "path");
      if (!path) return errText("path is required");
      const doc = readDiagram(path);
      const has =
        bool(r, "showGrid") !== undefined ||
        num(r, "gridSpacing") !== undefined ||
        num(r, "zoom") !== undefined;
      if (!has) return errText("Provide at least one of: showGrid, gridSpacing, zoom");
      const c = { ...doc.canvas };
      const sg = bool(r, "showGrid");
      if (sg !== undefined) c.showGrid = sg;
      const gs = num(r, "gridSpacing");
      if (gs !== undefined) {
        if (gs < 4 || gs > 200) return errText("gridSpacing must be 4–200");
        c.gridSpacing = gs;
      }
      const z = num(r, "zoom");
      if (z !== undefined) {
        if (Number.isNaN(z) || z < 0.05 || z > 8) return errText("zoom must be between 0.05 and 8");
        c.zoom = z;
      }
      doc.canvas = c;
      writeDiagram(path, doc);
      return okText({ ok: true });
    }

    case "autodraw_copy_styles":
    case "autodraw_copy_palette": {
      const path = str(r, "path");
      const fromPath = str(r, "fromPath");
      if (!path || !fromPath) return errText("path and fromPath are required");
      const target = readDiagram(path);
      const source = readDiagram(fromPath);
      target.customStyles = source.customStyles ?? [];
      writeDiagram(path, target);
      const verb = name === "autodraw_copy_palette" ? "palette (deprecated name)" : "styles";
      return okText({ ok: true, message: `Copied ${verb} from ${fromPath}` });
    }

    default:
      return errText(`Unknown tool: ${name}`);
  }
}
