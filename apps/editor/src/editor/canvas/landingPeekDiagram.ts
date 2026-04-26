import {
  emptyDiagram,
  type DiagramV1,
  type NodeRecord,
  type NodeStyleDefinition,
} from "@autodraw/core";

const PEEK_STYLE_ID = "lp-card";

/** White fill + crisp dark border so the marketing peek reads against the white page background. */
const PEEK_STYLE: NodeStyleDefinition = {
  id: PEEK_STYLE_ID,
  fillRed: 1,
  fillGreen: 1,
  fillBlue: 1,
  fillAlpha: 1,
  strokeRed: 0.07,
  strokeGreen: 0.07,
  strokeBlue: 0.08,
  strokeAlpha: 1,
  shape: "roundedRect",
};

/** Static sample used on the marketing page; ids prefixed so they never collide with editor sessions. */
export function createLandingPeekDiagram(): DiagramV1 {
  const d = emptyDiagram("grayscale");
  d.name = "Preview";
  d.canvas = { showGrid: true, gridSpacing: 16, zoom: 1 };
  return {
    ...d,
    customStyles: [PEEK_STYLE],
    nodes: [
      { id: "lp-left", text: "API", x: 64, y: 92, w: 132, h: 56, styleId: PEEK_STYLE_ID },
      { id: "lp-right", text: "Service", x: 320, y: 92, w: 132, h: 56, styleId: PEEK_STYLE_ID },
    ],
    edges: [
      {
        id: "lp-e1",
        from: "lp-left",
        to: "lp-right",
        routing: "orthogonal",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        label: "",
        strokeWidth: 1,
      },
    ],
  };
}

function cloneDiagram(d: DiagramV1): DiagramV1 {
  return {
    ...d,
    canvas: { ...d.canvas },
    nodes: d.nodes.map((n) => ({ ...n })),
    edges: d.edges.map((e) => ({ ...e })),
    customStyles: d.customStyles ? d.customStyles.map((s) => ({ ...s })) : [],
  };
}

/** Gentle vertical motion for the landing peek (flow px). */
export function landingPeekDiagramAtTime(base: DiagramV1, tMs: number): DiagramV1 {
  const d = cloneDiagram(base);
  const wobble = (id: string, phase: number, amp: number) => {
    const i = d.nodes.findIndex((n) => n.id === id);
    if (i < 0) return;
    const cur = d.nodes[i];
    if (!cur) return;
    const dy = Math.round(Math.sin(tMs / 2200 + phase) * amp * 10) / 10;
    const next: NodeRecord = { ...cur, y: cur.y + dy };
    d.nodes[i] = next;
  };
  wobble("lp-left", 0, 2.2);
  wobble("lp-right", 1.4, 1.8);
  return d;
}
