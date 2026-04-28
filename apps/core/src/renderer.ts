import { frameSvgStrokeFill } from "./frameTokens.js";
import type {
  DiagramV1,
  EdgeDash,
  EdgeHead,
  EdgeRecord,
  FrameRecord,
  ImageRecord,
  NodeRecord,
  NodeShape,
  TextLabelRecord,
} from "./schema.js";
import { pathPoints } from "./routing.js";
import { resolvedStyles, styleById } from "./palettes.js";
import { resolvedNodeSvgFillParts, resolvedNodeSvgStrokeParts } from "./nodeColors.js";

export type RenderSVGOptions = {
  showGrid?: boolean;
  padding?: number;
};

function esc(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Escape for XML attribute values (e.g. image href). */
function escAttr(s: string): string {
  return s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function dashArray(d: EdgeDash): string {
  switch (d) {
    case "solid":
      return "none";
    case "dashed":
      return "6 4";
    case "dotted":
      return "2 4";
    default:
      return "none";
  }
}

function nodeRect(n: NodeRecord): { x: number; y: number; w: number; h: number } {
  return { x: n.x, y: n.y, w: n.w, h: n.h };
}

/**
 * Resolve a node's absolute position. When `parentId` points to a frame, the stored coords are
 * **relative** to that frame (React Flow sub-flow convention); we sum the parent's origin in.
 */
function absoluteNode(diagram: DiagramV1, n: NodeRecord): NodeRecord {
  if (n.parentId == null) return n;
  const parent = diagram.frames.find((f) => f.id === n.parentId);
  if (!parent) return n;
  return { ...n, x: n.x + parent.x, y: n.y + parent.y };
}

function textLabelBounds(t: TextLabelRecord): { x: number; y: number; w: number; h: number } {
  const lineH = 18;
  const approxW = Math.max(40, Math.min(480, t.text.length * 7.5 + 8));
  return { x: t.x, y: t.y, w: approxW, h: lineH };
}

function contentBounds(
  diagram: DiagramV1,
  padding: number,
): { x: number; y: number; w: number; h: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;
  const bump = (x: number, y: number, w: number, h: number) => {
    any = true;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  };
  for (const n of diagram.nodes) {
    const a = absoluteNode(diagram, n);
    bump(a.x, a.y, a.w, a.h);
  }
  for (const f of diagram.frames) {
    bump(f.x, f.y, f.w, f.h);
  }
  for (const im of diagram.images) {
    bump(im.x, im.y, im.w, im.h);
  }
  for (const t of diagram.textLabels) {
    const b = textLabelBounds(t);
    bump(b.x, b.y, b.w, b.h);
  }
  if (!any) {
    return { x: 0, y: 0, w: 400, h: 300 };
  }
  return {
    x: minX - padding,
    y: minY - padding,
    w: maxX - minX + 2 * padding,
    h: maxY - minY + 2 * padding,
  };
}

function polylinePoints(pts: { x: number; y: number }[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

/**
 * Per-marker SVG body. `role` picks orientation so the same geometry works at both ends;
 * `refX` lands the tip (end) / base (start) right at the line endpoint.
 */
function markerBody(
  kind: Exclude<EdgeHead, "none">,
  role: "start" | "end",
  sw: number,
  stroke: string,
): string {
  const strokeAttr = `stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"`;
  const tri = `markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refY="4" orient="auto"`;
  switch (kind) {
    case "lineArrow":
      return role === "end"
        ? `markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="10" refX="10" refY="4" orient="auto"><path d="M1,0 L10,4 L1,8" fill="none" stroke-linecap="round" ${strokeAttr}/>`
        : `markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="10" refX="2" refY="4" orient="auto"><path d="M10,0 L1,4 L10,8" fill="none" stroke-linecap="round" ${strokeAttr}/>`;
    case "triangleArrow":
      return role === "end"
        ? `${tri} refX="10"><path d="M1,0 L10,4 L1,8 z" fill="none" ${strokeAttr}/>`
        : `${tri} refX="2"><path d="M10,0 L1,4 L10,8 z" fill="none" ${strokeAttr}/>`;
    case "triangleReversed":
      return role === "end"
        ? `${tri} refX="10"><path d="M10,0 L1,4 L10,8 z" fill="none" ${strokeAttr}/>`
        : `${tri} refX="2"><path d="M1,0 L10,4 L1,8 z" fill="none" ${strokeAttr}/>`;
    case "circle":
      return `markerUnits="userSpaceOnUse" markerWidth="12" markerHeight="12" refX="${role === "end" ? 10 : 2}" refY="6" orient="auto"><circle cx="6" cy="6" r="3.5" fill="none" ${strokeAttr}/>`;
    case "diamond":
      return `markerUnits="userSpaceOnUse" markerWidth="14" markerHeight="12" refX="${role === "end" ? 12 : 2}" refY="6" orient="auto"><path d="M7,1.5 L12,6 L7,10.5 L2,6 z" fill="none" ${strokeAttr}/>`;
  }
}

function markerDefs(edge: EdgeRecord, uid: string): string {
  const sw = Math.max(1, edge.strokeWidth ?? 1);
  const stroke = "#262626";
  const parts: string[] = [];
  if (edge.head !== "none") {
    parts.push(`<marker id="mk_h_${uid}" ${markerBody(edge.head, "end", sw, stroke)}</marker>`);
  }
  const tail = edge.tail ?? "none";
  if (tail !== "none") {
    parts.push(`<marker id="mk_t_${uid}" ${markerBody(tail, "start", sw, stroke)}</marker>`);
  }
  return parts.join("\n");
}

function markerEndUrl(edge: EdgeRecord, uid: string): string | undefined {
  return edge.head === "none" ? undefined : `url(#mk_h_${uid})`;
}

function markerStartUrl(edge: EdgeRecord, uid: string): string | undefined {
  const tail = edge.tail ?? "none";
  return tail === "none" ? undefined : `url(#mk_t_${uid})`;
}

function renderNodeShape(
  n: NodeRecord,
  shape: NodeShape,
  fill: string,
  fo: number,
  stroke: string,
  so: number,
): string {
  const x = n.x;
  const y = n.y;
  const w = n.w;
  const h = n.h;
  const corner = Math.min(12, Math.min(w, h) * 0.2);
  const common = `fill="${fill}" fill-opacity="${fo}" stroke="${stroke}" stroke-opacity="${so}" stroke-width="2.5" filter="url(#shadow)"`;
  switch (shape) {
    case "rectangle":
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${common}/>`;
    case "roundedRect":
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${corner}" ry="${corner}" ${common}/>`;
    case "oval":
    case "circle": {
      const rx = shape === "circle" ? Math.min(w, h) / 2 : w / 2;
      const ry = shape === "circle" ? Math.min(w, h) / 2 : h / 2;
      const cx = x + w / 2;
      const cy = y + h / 2;
      return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${common}/>`;
    }
    case "diamond": {
      const mx = x + w / 2;
      const my = y + h / 2;
      return `<polygon points="${mx},${y} ${x + w},${my} ${mx},${y + h} ${x},${my}" ${common}/>`;
    }
    case "hexagon":
    case "octagon": {
      const sides = shape === "hexagon" ? 6 : 8;
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = Math.min(w, h) / 2 - 2;
      const pts: string[] = [];
      const rot = shape === "hexagon" ? Math.PI / 6 : Math.PI / 8;
      for (let i = 0; i < sides; i++) {
        const a = rot + (i * 2 * Math.PI) / sides - Math.PI / 2;
        pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
      }
      return `<polygon points="${pts.join(" ")}" ${common}/>`;
    }
    case "parallelogram": {
      const skew = w * 0.15;
      return `<polygon points="${x + skew},${y} ${x + w},${y} ${x + w - skew},${y + h} ${x},${y + h}" ${common}/>`;
    }
    default:
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${corner}" ry="${corner}" ${common}/>`;
  }
}

function renderFrameSvg(f: FrameRecord): string {
  const rx = Math.min(12, Math.min(f.w, f.h) * 0.12);
  const title = f.name?.trim() ? esc(f.name.trim()) : "";
  const { stroke, fill } = frameSvgStrokeFill(f.color);
  const rect = `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" rx="${rx}" ry="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="6 4"/>`;
  const label = title
    ? `<text x="${f.x + 10}" y="${f.y + 18}" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="600" fill="#555">${title}</text>`
    : "";
  return `${rect}\n${label}`;
}

function renderImageSvg(im: ImageRecord): string {
  const href = escAttr(im.src);
  const alt = im.alt ? ` role="img" aria-label="${escAttr(im.alt)}"` : "";
  return `<image x="${im.x}" y="${im.y}" width="${im.w}" height="${im.h}" href="${href}" preserveAspectRatio="xMidYMid meet"${alt}/>`;
}

function renderTextLabelSvg(t: TextLabelRecord): string {
  return `<text x="${t.x}" y="${t.y}" dominant-baseline="hanging" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#111">${esc(t.text)}</text>`;
}

/** Pure SVG string for export (PDF/PNG) and tests. Coordinates in diagram space. */
export function renderSVG(diagram: DiagramV1, opts: RenderSVGOptions = {}): string {
  const padding = opts.padding ?? 40;
  const showGrid = opts.showGrid ?? diagram.canvas.showGrid;
  const b = contentBounds(diagram, padding);
  const styles = resolvedStyles(diagram);
  const defs: string[] = [];
  const body: string[] = [];

  if (showGrid) {
    const g = diagram.canvas.gridSpacing;
    let y = Math.floor(b.y / g) * g;
    while (y <= b.y + b.h) {
      let x = Math.floor(b.x / g) * g;
      while (x <= b.x + b.w) {
        body.push(`<circle cx="${x}" cy="${y}" r="0.75" fill="#d9d9d9"/>`);
        x += g;
      }
      y += g;
    }
  }

  for (const f of diagram.frames) {
    body.push(renderFrameSvg(f));
  }

  for (const im of diagram.images) {
    body.push(renderImageSvg(im));
  }

  const absoluteNodes = diagram.nodes.map((n) => absoluteNode(diagram, n));
  const nodeMap = new Map(absoluteNodes.map((n) => [n.id, n]));

  for (const e of diagram.edges) {
    const a = nodeMap.get(e.from);
    const bnode = nodeMap.get(e.to);
    if (!a || !bnode) continue;
    const uid = e.id.replace(/[^a-zA-Z0-9_-]/g, "_");
    defs.push(markerDefs(e, uid));
    const pts = pathPoints(e.routing, nodeRect(a), nodeRect(bnode));
    const points = polylinePoints(pts);
    const dash = dashArray(e.dash);
    const strokeW = e.strokeWidth ?? 1;
    const me = markerEndUrl(e, uid);
    const ms = markerStartUrl(e, uid);
    const meAttr = me ? ` marker-end="${me}"` : "";
    const msAttr = ms ? ` marker-start="${ms}"` : "";
    body.push(
      `<polyline fill="none" stroke="#262626" stroke-width="${strokeW}" stroke-dasharray="${dash}" points="${points}"${meAttr}${msAttr}/>`,
    );
  }

  for (const n of absoluteNodes) {
    const st = styleById(diagram, n.styleId) ?? styles[0];
    if (!st) continue;
    const shape = n.shape ?? st.shape;
    const { fillRgb: fill, fillOpacity: fo } = resolvedNodeSvgFillParts(st, n.styleId);
    const { strokeRgb: stroke, strokeOpacity: so } = resolvedNodeSvgStrokeParts(st);
    body.push(renderNodeShape(n, shape, fill, fo, stroke, so));
    body.push(
      `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#111">${esc(n.text)}</text>`,
    );
  }

  for (const t of diagram.textLabels) {
    body.push(renderTextLabelSvg(t));
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${b.w}" height="${b.h}" viewBox="${b.x} ${b.y} ${b.w} ${b.h}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-opacity="0.12"/>
    </filter>
    ${defs.join("\n")}
  </defs>
  <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="#ffffff"/>
  ${body.join("\n")}
</svg>`;
}
