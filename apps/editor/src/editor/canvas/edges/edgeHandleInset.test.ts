import { getSmoothStepPath, Position } from "@xyflow/react";
import { describe, expect, it } from "vitest";

describe("getSmoothStepPath (orthogonal / step edges)", () => {
  it("Right→Left with target south-east: H-V-H at midX (two bends at x=300)", () => {
    const [path] = getSmoothStepPath({
      sourceX: 200,
      sourceY: 100,
      sourcePosition: Position.Right,
      targetX: 400,
      targetY: 220,
      targetPosition: Position.Left,
      borderRadius: 0,
      offset: 0,
    });
    const midX = (200 + 400) / 2;
    expect(path).toContain(`${midX},100`);
    expect(path).toContain(`${midX},220`);
  });

  it("Right→Top mixed sides: L-shape reaches target x and y", () => {
    const [path] = getSmoothStepPath({
      sourceX: 100,
      sourceY: 100,
      sourcePosition: Position.Right,
      targetX: 200,
      targetY: 40,
      targetPosition: Position.Top,
      borderRadius: 0,
      offset: 0,
    });
    expect(path.startsWith("M")).toBe(true);
    expect(path).toContain("200");
    expect(path).toContain("40");
  });
});
