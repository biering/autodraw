import type { DiagramV1, EdgeDash, EdgeHead, EdgeRecord, NodeRecord, NodeShape } from "./schema.js";
import { pathPoints } from "./routing.js";
import { resolvedStyles, styleById } from "./palettes.js";

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

function contentBounds(
  diagram: DiagramV1,
  padding: number,
): { x: number; y: number; w: number; h: number } {
  if (diagram.nodes.length === 0) {
    return { x: 0, y: 0, w: 400, h: 300 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const n of diagram.nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.w);
    maxY = Math.max(maxY, n.y + n.h);
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

function markerDefs(edge: EdgeRecord, uid: string): string {
  const sw = Math.max(1, edge.strokeWidth ?? 1);
  const stroke = "#262626";
  const mkOpen = (id: string, flip: boolean) => {
    const refX = flip ? 1 : 10;
    const d = flip ? "M10,0 L10,6 L1,3 z" : "M0,0 L0,6 L9,3 z";
    return `<marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="11" markerHeight="8" refX="${refX}" refY="3" orient="auto"><path d="${d}" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/></marker>`;
  };
  const mkFill = (id: string) =>
    `<marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="8" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${stroke}" stroke="none"/></marker>`;
  const mkSq = (id: string, flip: boolean) => {
    const ref = flip ? 6 : 0;
    return `<marker id="${id}" markerUnits="userSpaceOnUse" markerWidth="8" markerHeight="8" refX="${flip ? 2 : 6}" refY="4" orient="auto"><rect x="${ref}" y="1" width="6" height="6" fill="none" stroke="${stroke}" stroke-width="${sw}"/></marker>`;
  };
  const parts: string[] = [];
  if (edge.head === "arrowOpen" || edge.head === "arrowDouble")
    parts.push(mkOpen(`mk_h_open_${uid}`, false));
  if (edge.head === "arrowDouble") parts.push(mkOpen(`mk_h_open_start_${uid}`, true));
  if (edge.head === "arrowFilled") parts.push(mkFill(`mk_h_fill_${uid}`));
  if (edge.head === "square") parts.push(mkSq(`mk_h_sq_${uid}`, false));
  const tail = edge.tail ?? "none";
  if (tail === "arrowOpen") parts.push(mkOpen(`mk_t_open_${uid}`, true));
  if (tail === "square") parts.push(mkSq(`mk_t_sq_${uid}`, true));
  return parts.join("\n");
}

function markerEndUrl(edge: EdgeRecord, uid: string): string | undefined {
  switch (edge.head) {
    case "none":
      return undefined;
    case "arrowOpen":
      return `url(#mk_h_open_${uid})`;
    case "arrowDouble":
      return `url(#mk_h_open_${uid})`;
    case "arrowFilled":
      return `url(#mk_h_fill_${uid})`;
    case "square":
      return `url(#mk_h_sq_${uid})`;
    default:
      return undefined;
  }
}

function markerStartUrl(edge: EdgeRecord, uid: string): string | undefined {
  if (edge.head === "arrowDouble") {
    return `url(#mk_h_open_start_${uid})`;
  }
  const tail = edge.tail ?? "none";
  switch (tail) {
    case "arrowOpen":
      return `url(#mk_t_open_${uid})`;
    case "square":
      return `url(#mk_t_sq_${uid})`;
    default:
      return undefined;
  }
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
  const common = `fill="${fill}" fill-opacity="${fo}" stroke="${stroke}" stroke-opacity="${so}" stroke-width="1.5" filter="url(#shadow)"`;
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

  const nodeMap = new Map(diagram.nodes.map((n) => [n.id, n]));

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

  for (const n of diagram.nodes) {
    const st = styleById(diagram, n.styleId) ?? styles[0];
    if (!st) continue;
    const shape = n.shape ?? st.shape;
    const fill = `rgb(${Math.round(st.fillRed * 255)},${Math.round(st.fillGreen * 255)},${Math.round(st.fillBlue * 255)})`;
    const fo = st.fillAlpha;
    const stroke = `rgb(${Math.round(st.strokeRed * 255)},${Math.round(st.strokeGreen * 255)},${Math.round(st.strokeBlue * 255)})`;
    const so = st.strokeAlpha;
    body.push(renderNodeShape(n, shape, fill, fo, stroke, so));
    body.push(
      `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#111">${esc(n.text)}</text>`,
    );
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
