import type { ConnectionLineComponentProps } from "@xyflow/react";
import { getSmoothStepPath } from "@xyflow/react";
import { memo, useMemo } from "react";
import { clampedInsetEndpoints, computeEdgeInsetPx } from "./edges/edgeHandleInset.js";

const CONNECTION_PREVIEW_INSET = computeEdgeInsetPx(2);

/**
 * Connection preview uses the same step routing as {@link DiagramEdge} (`getSmoothStepPath`, sharp corners),
 * with the same handle outward inset when the target handle is known.
 */
function DiagramConnectionLineInner(props: ConnectionLineComponentProps) {
  const { fromX, fromY, toX, toY, connectionStatus, fromPosition, toPosition, toHandle } = props;
  const { path, endX, endY } = useMemo(() => {
    const targetInset = toHandle ? CONNECTION_PREVIEW_INSET : 0;
    const { sx, sy, tx, ty } = clampedInsetEndpoints(
      fromX,
      fromY,
      toX,
      toY,
      fromPosition,
      toPosition,
      CONNECTION_PREVIEW_INSET,
      targetInset,
    );
    const [d] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: fromPosition,
      targetX: tx,
      targetY: ty,
      targetPosition: toPosition,
      borderRadius: 0,
      offset: 0,
    });
    return { path: d, endX: tx, endY: ty };
  }, [fromX, fromY, toX, toY, fromPosition, toPosition, toHandle]);
  const ok = connectionStatus !== "invalid";
  const stroke = ok ? "rgba(37, 99, 235, 0.88)" : "rgba(220, 38, 38, 0.88)";
  return (
    <g className="agentsdraw-connection-line">
      <path
        fill="none"
        strokeWidth={2}
        stroke={stroke}
        d={path}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={endX} cy={endY} r={4} fill={stroke} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

export const DiagramConnectionLine = memo(DiagramConnectionLineInner);
