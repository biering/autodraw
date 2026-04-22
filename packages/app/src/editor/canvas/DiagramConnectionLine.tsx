import type { ConnectionLineComponentProps } from "@xyflow/react";
import { memo, useMemo } from "react";

/**
 * Connection preview uses the same sharp step routing as {@link DiagramEdge} (horizontal → vertical → horizontal).
 */
function DiagramConnectionLineInner(props: ConnectionLineComponentProps) {
  const { fromX, fromY, toX, toY, connectionStatus } = props;
  const path = useMemo(() => {
    const centerX = (fromX + toX) / 2;
    return `M ${fromX} ${fromY} L ${centerX} ${fromY} L ${centerX} ${toY} L ${toX} ${toY}`;
  }, [fromX, fromY, toX, toY]);
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
      <circle cx={toX} cy={toY} r={4} fill={stroke} stroke="#fff" strokeWidth={1.5} />
    </g>
  );
}

export const DiagramConnectionLine = memo(DiagramConnectionLineInner);
