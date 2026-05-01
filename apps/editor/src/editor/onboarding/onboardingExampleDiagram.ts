import { defaultStyleId, emptyDiagram, type DiagramV1 } from "@autodraw/core";

/** Small signup-flow example for the onboarding “Load in canvas” action. */
export function createOnboardingExampleDiagram(): DiagramV1 {
  const palette = "universal" as const;
  const styleId = defaultStyleId(palette);
  const n1 = { id: "onb-l", text: "Landing", x: 64, y: 140, w: 152, h: 72, styleId };
  const n2 = { id: "onb-s", text: "Sign up", x: 280, y: 140, w: 152, h: 72, styleId };
  const n3 = { id: "onb-v", text: "Verify email", x: 496, y: 140, w: 168, h: 72, styleId };
  const n4 = { id: "onb-d", text: "Dashboard", x: 712, y: 140, w: 160, h: 72, styleId };
  return {
    ...emptyDiagram(palette),
    name: "Signup flow (example)",
    nodes: [n1, n2, n3, n4],
    edges: [
      {
        id: "onb-e1",
        from: n1.id,
        to: n2.id,
        routing: "straight",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        label: "",
      },
      {
        id: "onb-e2",
        from: n2.id,
        to: n3.id,
        routing: "straight",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        label: "",
      },
      {
        id: "onb-e3",
        from: n3.id,
        to: n4.id,
        routing: "straight",
        dash: "solid",
        head: "lineArrow",
        tail: "none",
        label: "",
      },
    ],
  };
}
