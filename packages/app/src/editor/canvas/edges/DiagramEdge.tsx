import type { EdgeRecord } from "@agentsdraw/core";
import type { DiagramFlowEdge } from "../flowAdapter.js";
import { BaseEdge, getBezierPath, getStraightPath, type EdgeProps } from "@xyflow/react";
import { memo, useMemo } from "react";
import { DiagramEdgeMarkerDefs, diagramMarkerUrls } from "./edgeMarkerDefs.js";

/**
 * React Flow attaches heads via `markerEnd` / `markerStart` on the edge path (see
 * {@link https://reactflow.dev/learn/troubleshooting/migrate-to-v10#9-arrowheadtype---markertype MarkerType → EdgeMarker}).
 * We supply custom `<marker>` SVGs for all {@link EdgeRecord} head/tail kinds.
 */
function diagramEdgePropsAreEqual(
  prev: EdgeProps<DiagramFlowEdge>,
  next: EdgeProps<DiagramFlowEdge>,
): boolean {
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
    (a.tail ?? "none") === (b.tail ?? "none") &&
    (a.strokeWidth ?? 2) === (b.strokeWidth ?? 2) &&
    (a.label ?? "") === (b.label ?? "") &&
    (a.relationshipPreset ?? null) === (b.relationshipPreset ?? null) &&
    (a.sourceHandle ?? null) === (b.sourceHandle ?? null) &&
    (a.targetHandle ?? null) === (b.targetHandle ?? null)
  );
}

/** Neutral graphite; selected edges pick up a cool accent. */
const EDGE_STROKE = "#5a5d66";
const EDGE_STROKE_SELECTED = "#3d5a8a";

function DiagramEdgeInner(props: EdgeProps<DiagramFlowEdge>) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data } =
    props;
  const edge = data as EdgeRecord | undefined;
  const strokeW = edge?.strokeWidth ?? 2;
  const dash = edge?.dash === "dashed" ? "7 5" : edge?.dash === "dotted" ? "2 5" : undefined;

  const routing = edge?.routing ?? "orthogonal";

  const [path, labelX, labelY] = useMemo(() => {
    if (routing === "straight") {
      return getStraightPath({ sourceX, sourceY, targetX, targetY });
    }
    if (routing === "curved") {
      const [p, lx, ly] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
      return [p, lx, ly] as const;
    }
    const centerX = (sourceX + targetX) / 2;
    const stepPath = `M ${sourceX} ${sourceY} L ${centerX} ${sourceY} L ${centerX} ${targetY} L ${targetX} ${targetY}`;
    const midX = centerX;
    const midY = (sourceY + targetY) / 2;
    return [stepPath, midX, midY] as const;
  }, [routing, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition]);

  const stroke = selected ? EDGE_STROKE_SELECTED : EDGE_STROKE;
  const strokeOpacity = selected ? 1 : 0.88;

  const head = edge?.head ?? "arrowOpen";
  const tail = edge?.tail;

  const { markerEnd, markerStart } = useMemo(
    () => diagramMarkerUrls(id, head, tail),
    [id, head, tail],
  );

  return (
    <>
      <DiagramEdgeMarkerDefs
        edgeId={id}
        head={head}
        tail={tail}
        stroke={stroke}
        strokeWidth={strokeW}
      />
      <BaseEdge
        id={id}
        path={path}
        style={{
          stroke,
          strokeWidth: strokeW,
          strokeDasharray: dash,
          strokeOpacity,
          strokeLinecap: "round",
          strokeLinejoin: "round",
        }}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={22}
      />
      {edge?.label ? (
        <text
          x={labelX}
          y={labelY}
          fontSize={11}
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#2e3038"
          fillOpacity={strokeOpacity}
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ paintOrder: "stroke fill", stroke: "rgba(255,255,255,0.92)", strokeWidth: 3 }}
        >
          {edge.label}
        </text>
      ) : null}
    </>
  );
}

export const DiagramEdge = memo(DiagramEdgeInner, diagramEdgePropsAreEqual);
