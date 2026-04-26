import type { EdgeHead } from "@autodraw/core";
import { Position } from "@xyflow/react";
import { memo } from "react";

/**
 * Custom SVG markers for diagram edges. React Flow resolves built-in heads via
 * {@link https://reactflow.dev/api-reference/types/marker-type MarkerType} on {@link EdgeMarker};
 * we render our full marker vocabulary here so every {@link EdgeHead} variant has a matching symbol.
 *
 * Markers use explicit `orient` angles from handle sides (not `orient="auto"`), because step paths
 * can end with degenerate segments that yield a wrong tangent.
 *
 * @see https://reactflow.dev/learn/troubleshooting/migrate-to-v10#9-arrowheadtype---markertype
 */

const VB = "-10 -10 24 24";

/** Degrees: outward normal from the node for this handle side; `role` flips for markerEnd (into node). */
function markerAngle(side: Position, role: "start" | "end"): number {
  const out =
    side === Position.Right ? 0 : side === Position.Left ? 180 : side === Position.Top ? -90 : 90;
  return role === "start" ? out : out + 180;
}

function safeMarkerFragment(edgeId: string): string {
  return edgeId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function diagramMarkerEndId(edgeId: string): string {
  return `autodraw-me-${safeMarkerFragment(edgeId)}`;
}

export function diagramMarkerStartId(edgeId: string): string {
  return `autodraw-ms-${safeMarkerFragment(edgeId)}`;
}

function markerUrl(id: string): string {
  return `url(#${id})`;
}

/** `markerEnd` / `markerStart` attribute values for {@link BaseEdge}. */
export function diagramMarkerUrls(
  edgeId: string,
  head: EdgeHead,
  tail: EdgeHead | undefined,
): { markerEnd?: string; markerStart?: string } {
  const endId = diagramMarkerEndId(edgeId);
  const startId = diagramMarkerStartId(edgeId);
  return {
    markerEnd: head === "none" ? undefined : markerUrl(endId),
    markerStart: !tail || tail === "none" ? undefined : markerUrl(startId),
  };
}

type Props = {
  edgeId: string;
  head: EdgeHead;
  tail: EdgeHead | undefined;
  stroke: string;
  /** Line width the edge path uses; marker strokes scale slightly with it. */
  strokeWidth: number;
  /** Handle side at source (outward normal); drives markerStart away from source. */
  startSide?: Position;
  /** Handle side at target (outward normal); drives markerEnd into target. */
  endSide?: Position;
};

/**
 * Render-time marker symbols for the canvas (React Flow `<defs>`). All shapes are centered on
 * the origin (viewBox `-10 -10 24 24`) with the tip at `x=0`, `y=0`, pointing to the right
 * (i.e. into the target node for `markerEnd`).
 */
function HeadSymbol({
  kind,
  stroke,
  strokeWidth,
}: {
  kind: Exclude<EdgeHead, "none">;
  stroke: string;
  strokeWidth: number;
}) {
  const sw = Math.max(1, Math.min(2.25, strokeWidth * 0.65));
  switch (kind) {
    case "lineArrow":
      return (
        <polyline
          points="-7,-4.25 0,0 -7,4.25"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    case "triangleArrow":
      return (
        <polygon
          points="0,0 -8.25,-5 -8.25,5"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case "triangleReversed":
      return (
        <polygon
          points="-8.25,0 0,-5 0,5"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    case "circle":
      return <circle cx="-4.5" cy="0" r="3.75" fill="none" stroke={stroke} strokeWidth={sw} />;
    case "diamond":
      return (
        <polygon
          points="0,0 -5,-4.25 -10,0 -5,4.25"
          fill="none"
          stroke={stroke}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
      );
    default:
      return null;
  }
}

function EdgeMarkerDefsInner({
  edgeId,
  head,
  tail,
  stroke,
  strokeWidth,
  startSide,
  endSide,
}: Props) {
  const endId = diagramMarkerEndId(edgeId);
  const startId = diagramMarkerStartId(edgeId);
  const showEnd = head !== "none";
  const showStart = tail && tail !== "none";
  if (!showEnd && !showStart) return null;

  const endOrient = endSide !== undefined ? markerAngle(endSide, "end") : "auto";
  const startOrient = startSide !== undefined ? markerAngle(startSide, "start") : "auto";

  const markerPropsBase = {
    markerUnits: "userSpaceOnUse" as const,
    refX: 0,
    refY: 0,
    markerWidth: 14,
    markerHeight: 14,
    viewBox: VB,
  };

  return (
    <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden>
      <defs>
        {showEnd ? (
          <marker id={endId} {...markerPropsBase} orient={endOrient}>
            <HeadSymbol kind={head} stroke={stroke} strokeWidth={strokeWidth} />
          </marker>
        ) : null}
        {showStart && tail ? (
          <marker id={startId} {...markerPropsBase} orient={startOrient}>
            <HeadSymbol kind={tail} stroke={stroke} strokeWidth={strokeWidth} />
          </marker>
        ) : null}
      </defs>
    </svg>
  );
}

export const DiagramEdgeMarkerDefs = memo(EdgeMarkerDefsInner);
