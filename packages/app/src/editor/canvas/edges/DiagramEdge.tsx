import { pathPoints } from "@agentsdraw/core";
import type { EdgeRecord } from "@agentsdraw/core";
import { BaseEdge, getStraightPath, type EdgeProps } from "@xyflow/react";
import { memo, useMemo } from "react";
import { useDocument } from "../../state/useDocument.js";
import { useShallow } from "zustand/react/shallow";

function DiagramEdgeInner(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, data, source, target } = props;
  const edge = data as EdgeRecord | undefined;
  const diagram = useDocument(useShallow((s) => s.diagram));
  const a = diagram.nodes.find((n) => n.id === source);
  const b = diagram.nodes.find((n) => n.id === target);
  const strokeW = edge?.strokeWidth ?? 1;
  const dash =
    edge?.dash === "dashed" ? "6 4" : edge?.dash === "dotted" ? "2 4" : undefined;

  const mid = useMemo(() => {
    return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
  }, [sourceX, sourceY, targetX, targetY]);

  const path = useMemo(() => {
    if (!a || !b) {
      const [p] = getStraightPath({ sourceX, sourceY, targetX, targetY });
      return p;
    }
    const pts = pathPoints(
      edge?.routing ?? "straight",
      { x: a.x, y: a.y, w: a.w, h: a.h },
      { x: b.x, y: b.y, w: b.w, h: b.h }
    );
    if (pts.length === 2) {
      const [p] = getStraightPath({
        sourceX: pts[0]!.x,
        sourceY: pts[0]!.y,
        targetX: pts[1]!.x,
        targetY: pts[1]!.y,
      });
      return p;
    }
    return pts.map((pt, i) => `${i === 0 ? "M" : "L"} ${pt.x} ${pt.y}`).join(" ");
  }, [a, b, edge?.routing, sourceX, sourceY, targetX, targetY]);

  const openId = `open-arrow-${id}`;
  const fillId = `fill-arrow-${id}`;
  const sqId = `sq-arrow-${id}`;

  const markerEnd =
    edge?.head === "arrowOpen" || edge?.head === "arrowDouble"
      ? `url(#${openId})`
      : edge?.head === "arrowFilled"
        ? `url(#${fillId})`
        : edge?.head === "square"
          ? `url(#${sqId})`
          : undefined;

  return (
    <>
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <marker id={openId} markerWidth="10" markerHeight="8" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="none" stroke="#262626" strokeWidth={strokeW} />
          </marker>
          <marker id={fillId} markerWidth="10" markerHeight="8" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill="#262626" />
          </marker>
          <marker id={sqId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
            <rect x="0" y="1" width="6" height="6" fill="none" stroke="#262626" strokeWidth={strokeW} />
          </marker>
        </defs>
      </svg>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: "#262626",
          strokeWidth: strokeW,
          strokeDasharray: dash,
        }}
        markerEnd={markerEnd}
        interactionWidth={16}
      />
      {edge?.label ? (
        <text x={mid.x} y={mid.y} fontSize={11} fill="#333" textAnchor="middle">
          {edge.label}
        </text>
      ) : null}
    </>
  );
}

export const DiagramEdge = memo(DiagramEdgeInner);
