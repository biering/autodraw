import { getSmoothStepPath, Position, type ConnectionLineComponentProps } from "@xyflow/react";
import { memo } from "react";

/**
 * Connection preview aligned with diagram edges (smooth-step) plus a clear drop
 * indicator, similar to the [Adding Interactivity](https://reactflow.dev/learn/concepts/adding-interactivity) examples.
 */
function DiagramConnectionLineInner(props: ConnectionLineComponentProps) {
  const { fromX, fromY, toX, toY, fromPosition, toPosition, connectionStatus } = props;
  const [path] = getSmoothStepPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition ?? Position.Left,
    borderRadius: 10,
  });
  const ok = connectionStatus !== "invalid";
  const stroke = ok ? "rgba(10, 132, 255, 0.92)" : "rgba(239, 68, 68, 0.92)";
  return (
    <g className="agentsdraw-connection-line">
      <path
        fill="none"
        strokeWidth={2.25}
        stroke={stroke}
        d={path}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={toX} cy={toY} r={5} fill={stroke} stroke="#fff" strokeWidth={2} />
    </g>
  );
}

export const DiagramConnectionLine = memo(DiagramConnectionLineInner);
