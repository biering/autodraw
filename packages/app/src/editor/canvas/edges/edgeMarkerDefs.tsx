import type { EdgeHead } from "@agentsdraw/core";
import { memo } from "react";

/**
 * Custom SVG markers for diagram edges. React Flow resolves built-in heads via
 * {@link https://reactflow.dev/api-reference/types/marker-type MarkerType} on {@link EdgeMarker};
 * we render equivalent (and extended) shapes here so `arrowDouble` and `square` match our domain model.
 *
 * @see https://reactflow.dev/learn/troubleshooting/migrate-to-v10#9-arrowheadtype---markertype
 */

const VB = "-10 -10 24 24";

function safeMarkerFragment(edgeId: string): string {
  return edgeId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export function diagramMarkerEndId(edgeId: string): string {
  return `agentsdraw-me-${safeMarkerFragment(edgeId)}`;
}

export function diagramMarkerStartId(edgeId: string): string {
  return `agentsdraw-ms-${safeMarkerFragment(edgeId)}`;
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
};

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
    case "arrowOpen":
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
    case "arrowFilled":
      return <polygon points="1.25,0 -8.25,-5 -8.25,5" fill={stroke} stroke="none" />;
    case "arrowDouble":
      return (
        <g
          stroke={stroke}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <polyline points="-11,-3.5 -5,0 -11,3.5" />
          <polyline points="-5,-4.25 2,0 -5,4.25" />
        </g>
      );
    case "square":
      return (
        <rect
          x="-7.5"
          y="-4.5"
          width="9"
          height="9"
          rx="0.75"
          fill="none"
          stroke={stroke}
          strokeWidth={sw * 0.95}
        />
      );
    default:
      return null;
  }
}

function EdgeMarkerDefsInner({ edgeId, head, tail, stroke, strokeWidth }: Props) {
  const endId = diagramMarkerEndId(edgeId);
  const startId = diagramMarkerStartId(edgeId);
  const showEnd = head !== "none";
  const showStart = tail && tail !== "none";
  if (!showEnd && !showStart) return null;

  const markerProps = {
    orient: "auto" as const,
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
          <marker id={endId} {...markerProps}>
            <HeadSymbol kind={head} stroke={stroke} strokeWidth={strokeWidth} />
          </marker>
        ) : null}
        {showStart && tail ? (
          <marker id={startId} {...markerProps}>
            <HeadSymbol kind={tail} stroke={stroke} strokeWidth={strokeWidth} />
          </marker>
        ) : null}
      </defs>
    </svg>
  );
}

export const DiagramEdgeMarkerDefs = memo(EdgeMarkerDefsInner);
