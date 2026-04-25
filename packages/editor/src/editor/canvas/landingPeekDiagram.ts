import { defaultStyleId, emptyDiagram, type DiagramV1, type NodeRecord } from "@autodraw/core";

/** Static sample used on the marketing page; ids prefixed so they never collide with editor sessions. */
export function createLandingPeekDiagram(): DiagramV1 {
  const styleId = defaultStyleId("grayscale");
  const d = emptyDiagram("grayscale");
  d.name = "Preview";
  d.canvas = { showGrid: true, gridSpacing: 16, zoom: 1 };
  return {
    ...d,
    nodes: [
      { id: "lp-gateway", text: "Gateway", x: 32, y: 72, w: 112, h: 48, styleId },
      { id: "lp-service", text: "Service", x: 208, y: 32, w: 112, h: 48, styleId },
      { id: "lp-queue", text: "Queue", x: 208, y: 128, w: 112, h: 48, styleId },
      { id: "lp-db", text: "Database", x: 384, y: 72, w: 120, h: 48, styleId },
      { id: "lp-cache", text: "Cache", x: 48, y: 208, w: 112, h: 48, styleId },
      { id: "lp-worker", text: "Worker", x: 256, y: 208, w: 112, h: 48, styleId },
    ],
    edges: [
      {
        id: "lp-e1",
        from: "lp-gateway",
        to: "lp-service",
        routing: "curved",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        label: "",
        strokeWidth: 1,
      },
      {
        id: "lp-e2",
        from: "lp-gateway",
        to: "lp-queue",
        routing: "curved",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        label: "",
        strokeWidth: 1,
      },
      {
        id: "lp-e3",
        from: "lp-service",
        to: "lp-db",
        routing: "curved",
        dash: "dashed",
        head: "lineArrow",
        tail: "none",
        label: "",
        strokeWidth: 1,
      },
      {
        id: "lp-e4",
        from: "lp-queue",
        to: "lp-db",
        routing: "curved",
        dash: "dotted",
        head: "lineArrow",
        tail: "none",
        label: "",
        strokeWidth: 1,
      },
      {
        id: "lp-e5",
        from: "lp-service",
        to: "lp-queue",
        routing: "orthogonal",
        dash: "solid",
        head: "none",
        tail: "none",
        label: "",
        strokeWidth: 1,
      },
      {
        id: "lp-e6",
        from: "lp-cache",
        to: "lp-worker",
        routing: "curved",
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
  wobble("lp-gateway", 0, 2.2);
  wobble("lp-service", 1.1, 1.8);
  wobble("lp-queue", 2.3, 2);
  wobble("lp-db", 0.6, 2.4);
  wobble("lp-cache", 1.7, 1.6);
  wobble("lp-worker", 2.8, 1.9);
  return d;
}
