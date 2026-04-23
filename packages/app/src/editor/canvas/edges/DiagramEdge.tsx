import type { EdgeRecord } from "@agentsdraw/core";
import type { InternalNode, Node } from "@xyflow/react";
import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useInternalNode,
  useStore,
  type EdgeProps,
} from "@xyflow/react";
import { memo, useCallback, useMemo } from "react";
import { floatingEdgeGeometry } from "../floatingEndpoints.js";
import type { DiagramFlowEdge, DiagramFlowNode } from "../flowAdapter.js";
import { clampedInsetEndpoints, computeEdgeInsetPx } from "./edgeHandleInset.js";
import { DiagramEdgeMarkerDefs, diagramMarkerUrls } from "./edgeMarkerDefs.js";

function rectFromInternal(n: InternalNode<Node>): {
  cx: number;
  cy: number;
  w: number;
  h: number;
} {
  const u = n.internals.userNode as DiagramFlowNode;
  const w =
    n.measured.width ??
    n.width ??
    (typeof u.style?.width === "number" ? u.style.width : undefined) ??
    u.data.w;
  const h =
    n.measured.height ??
    n.height ??
    (typeof u.style?.height === "number" ? u.style.height : undefined) ??
    u.data.h;
  const { x, y } = n.internals.positionAbsolute;
  return { cx: x + w / 2, cy: y + h / 2, w, h };
}

/**
 * Subscribe to node box changes so floating edges repaint while dragging; `useInternalNode` alone
 * can miss in-place store updates, so this key is merged into `floating` memo deps.
 */
function useFloatingNodeBoxKey(nodeId: string, enabled: boolean): string {
  return useStore(
    useCallback(
      (s) => {
        if (!enabled) return "";
        const n = s.nodeLookup.get(nodeId);
        if (!n) return "";
        const p = n.internals.positionAbsolute;
        const mw = n.measured.width ?? "";
        const mh = n.measured.height ?? "";
        const uw = n.width ?? "";
        const uh = n.height ?? "";
        return `${p.x},${p.y},${mw},${mh},${uw},${uh}`;
      },
      [nodeId, enabled],
    ),
  );
}

function diagramEdgePropsAreEqual(
  prev: EdgeProps<DiagramFlowEdge>,
  next: EdgeProps<DiagramFlowEdge>,
): boolean {
  if (
    prev.id !== next.id ||
    prev.selected !== next.selected ||
    prev.source !== next.source ||
    prev.target !== next.target ||
    (prev.sourceHandleId ?? null) !== (next.sourceHandleId ?? null) ||
    (prev.targetHandleId ?? null) !== (next.targetHandleId ?? null) ||
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
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    selected,
    data,
    source,
    target,
    sourceHandleId,
    targetHandleId,
  } = props;
  const edge = data as EdgeRecord | undefined;
  const strokeW = edge?.strokeWidth ?? 2;
  const dash = edge?.dash === "dashed" ? "7 5" : edge?.dash === "dotted" ? "2 5" : undefined;

  const routing = edge?.routing ?? "orthogonal";

  const useFloating = !sourceHandleId && !targetHandleId;
  const sourceInternal = useInternalNode(source);
  const targetInternal = useInternalNode(target);
  const srcKey = useFloatingNodeBoxKey(source, useFloating);
  const tgtKey = useFloatingNodeBoxKey(target, useFloating);

  const floating = useMemo(() => {
    if (!useFloating || !sourceInternal || !targetInternal) return null;
    if (srcKey.length === 0 || tgtKey.length === 0) return null;
    return floatingEdgeGeometry(rectFromInternal(sourceInternal), rectFromInternal(targetInternal));
  }, [useFloating, sourceInternal, targetInternal, srcKey, tgtKey]);

  const sx0 = floating ? floating.sx : sourceX;
  const sy0 = floating ? floating.sy : sourceY;
  const tx0 = floating ? floating.tx : targetX;
  const ty0 = floating ? floating.ty : targetY;
  const sourcePos = floating ? floating.sourcePosition : sourcePosition;
  const targetPos = floating ? floating.targetPosition : targetPosition;

  const [path, labelX, labelY] = useMemo(() => {
    const inset = computeEdgeInsetPx(strokeW);
    const { sx, sy, tx, ty } = clampedInsetEndpoints(
      sx0,
      sy0,
      tx0,
      ty0,
      sourcePos,
      targetPos,
      inset,
      inset,
    );
    if (routing === "straight") {
      const [p, lx, ly] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty });
      return [p, lx, ly] as const;
    }
    if (routing === "curved") {
      const [p, lx, ly] = getBezierPath({
        sourceX: sx,
        sourceY: sy,
        targetX: tx,
        targetY: ty,
        sourcePosition: sourcePos,
        targetPosition: targetPos,
      });
      return [p, lx, ly] as const;
    }
    const [p, lx, ly] = getSmoothStepPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: sourcePos,
      targetX: tx,
      targetY: ty,
      targetPosition: targetPos,
      borderRadius: 0,
      offset: 0,
    });
    return [p, lx, ly] as const;
  }, [routing, sx0, sy0, tx0, ty0, sourcePos, targetPos, strokeW]);

  const stroke = selected ? EDGE_STROKE_SELECTED : EDGE_STROKE;
  const strokeOpacity = selected ? 1 : 0.88;

  const head = edge?.head ?? "lineArrow";
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
        startSide={sourcePos}
        endSide={targetPos}
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
