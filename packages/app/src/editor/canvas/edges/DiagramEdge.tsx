import type { EdgeRecord } from "@agentsdraw/core";
import type { DiagramFlowEdge } from "../flowAdapter.js";
import {
  BaseEdge,
  getSmoothStepPath,
  getStraightPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { memo, useMemo } from "react";

function diagramEdgePropsAreEqual(prev: EdgeProps<DiagramFlowEdge>, next: EdgeProps<DiagramFlowEdge>): boolean {
  if (
    prev.id !== next.id ||
    prev.selected !== next.selected ||
    prev.sourceX !== next.sourceX ||
    prev.sourceY !== next.sourceY ||
    prev.targetX !== next.targetX ||
    prev.targetY !== next.targetY ||
    prev.sourcePosition !== next.sourcePosition ||
    prev.targetPosition !== next.targetPosition
  ) {
    return false;
  }
  const a = prev.data;
  const b = next.data;
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (
    a.routing === b.routing &&
    a.dash === b.dash &&
    a.head === b.head &&
    (a.strokeWidth ?? 1.5) === (b.strokeWidth ?? 1.5) &&
    (a.label ?? "") === (b.label ?? "") &&
    (a.tail ?? "none") === (b.tail ?? "none") &&
    (a.relationshipPreset ?? null) === (b.relationshipPreset ?? null)
  );
}

const EDGE_STROKE = "#6b6b70";

function DiagramEdgeInner(props: EdgeProps<DiagramFlowEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data } =
    props;
  const edge = data as EdgeRecord | undefined;
  const strokeW = edge?.strokeWidth ?? 1.5;
  const dash =
    edge?.dash === "dashed" ? "6 4" : edge?.dash === "dotted" ? "2 4" : undefined;

  const routing = edge?.routing ?? "orthogonal";
  const useStraight = routing === "straight";

  const [path, labelX, labelY] = useMemo(() => {
    if (useStraight) {
      return getStraightPath({ sourceX, sourceY, targetX, targetY });
    }
    return getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: sourcePosition ?? Position.Right,
      targetX,
      targetY,
      targetPosition: targetPosition ?? Position.Left,
      borderRadius: 10,
    });
  }, [useStraight, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const strokeOpacity = selected ? 1 : 0.8;
  const markerStroke = selected ? EDGE_STROKE : "rgba(107, 107, 112, 0.8)";

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
            <path
              d="M0,0 L0,6 L9,3 z"
              fill="none"
              stroke={markerStroke}
              strokeWidth={strokeW}
            />
          </marker>
          <marker id={fillId} markerWidth="10" markerHeight="8" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill={selected ? EDGE_STROKE : "rgba(107, 107, 112, 0.8)"} />
          </marker>
          <marker id={sqId} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto" markerUnits="strokeWidth">
            <rect
              x="0"
              y="1"
              width="6"
              height="6"
              fill="none"
              stroke={markerStroke}
              strokeWidth={strokeW}
            />
          </marker>
        </defs>
      </svg>
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke: EDGE_STROKE,
          strokeWidth: strokeW,
          strokeDasharray: dash,
          strokeOpacity,
        }}
        markerEnd={markerEnd}
        interactionWidth={26}
      />
      {edge?.label ? (
        <text
          x={labelX}
          y={labelY}
          fontSize={11}
          fill="#333"
          fillOpacity={strokeOpacity}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {edge.label}
        </text>
      ) : null}
    </>
  );
}

export const DiagramEdge = memo(DiagramEdgeInner, diagramEdgePropsAreEqual);
