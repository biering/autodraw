import type { ConnectionLineComponentProps, InternalNode, Node } from "@xyflow/react";
import { getSmoothStepPath, Position } from "@xyflow/react";
import { memo, useMemo } from "react";
import { clampedInsetEndpoints, computeEdgeInsetPx } from "./edges/edgeHandleInset.js";
import { floatingEdgeGeometry, rectFloatingEndpoint } from "./floatingEndpoints.js";

const CONNECTION_PREVIEW_INSET = computeEdgeInsetPx(2);

type NodeRect = { cx: number; cy: number; w: number; h: number };

/** Derive a size-aware rect for floating geometry from an `InternalNode` during a live connection. */
function internalNodeRect(n: InternalNode<Node>): NodeRect | null {
  const w = n.measured.width ?? n.width ?? null;
  const h = n.measured.height ?? n.height ?? null;
  if (w == null || h == null) return null;
  const { x, y } = n.internals.positionAbsolute;
  return { cx: x + w / 2, cy: y + h / 2, w, h };
}

/**
 * Connection preview uses the same step routing as {@link DiagramEdge}, but routes from the
 * source node's floating edge to either the target node's floating edge (when hovering a node) or
 * to the cursor. This keeps the preview visually aligned with where the committed edge will sit,
 * regardless of which handle the drag started from.
 */
function DiagramConnectionLineInner(props: ConnectionLineComponentProps) {
  const { fromNode, toNode, fromX, fromY, toX, toY, connectionStatus, fromPosition, toPosition } =
    props;
  const { path, endX, endY } = useMemo(() => {
    const sourceRect = internalNodeRect(fromNode);
    const targetRect = toNode ? internalNodeRect(toNode) : null;

    let sx0: number;
    let sy0: number;
    let tx0: number;
    let ty0: number;
    let sPos: Position = fromPosition;
    let tPos: Position = toPosition;

    if (sourceRect && targetRect) {
      const f = floatingEdgeGeometry(sourceRect, targetRect);
      sx0 = f.sx;
      sy0 = f.sy;
      tx0 = f.tx;
      ty0 = f.ty;
      sPos = f.sourcePosition;
      tPos = f.targetPosition;
    } else if (sourceRect) {
      const src = rectFloatingEndpoint(
        sourceRect.cx,
        sourceRect.cy,
        sourceRect.w,
        sourceRect.h,
        toX,
        toY,
      );
      sx0 = src.x;
      sy0 = src.y;
      sPos = src.position;
      tx0 = toX;
      ty0 = toY;
    } else {
      sx0 = fromX;
      sy0 = fromY;
      tx0 = toX;
      ty0 = toY;
    }

    const targetInset = targetRect ? CONNECTION_PREVIEW_INSET : 0;
    const { sx, sy, tx, ty } = clampedInsetEndpoints(
      sx0,
      sy0,
      tx0,
      ty0,
      sPos,
      tPos,
      CONNECTION_PREVIEW_INSET,
      targetInset,
    );
    const [d] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sPos,
      targetX: tx,
      targetY: ty,
      targetPosition: tPos,
      borderRadius: 0,
      offset: 0,
    });
    return { path: d, endX: tx, endY: ty };
  }, [fromNode, toNode, fromX, fromY, toX, toY, fromPosition, toPosition]);
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
