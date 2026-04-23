import { Handle, Position, type NodeProps, useConnection } from "@xyflow/react";
import type { ConnectionState } from "@xyflow/system";
import { Link2 } from "lucide-react";
import type { CSSProperties } from "react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DIAGRAM_BODY_SOURCE_BUTTON_HANDLE,
  DIAGRAM_BODY_SOURCE_HANDLE,
  DIAGRAM_BODY_TARGET_HANDLE,
  type DiagramFlowNode,
} from "../flowAdapter.js";
import { useDocument } from "../../state/useDocument.js";

function diagramNodePropsAreEqual(
  prev: NodeProps<DiagramFlowNode>,
  next: NodeProps<DiagramFlowNode>,
): boolean {
  if (prev.id !== next.id || prev.selected !== next.selected || prev.dragging !== next.dragging)
    return false;
  const a = prev.data;
  const b = next.data;
  return (
    a.label === b.label &&
    a.w === b.w &&
    a.h === b.h &&
    a.styleId === b.styleId &&
    (a.shape ?? null) === (b.shape ?? null) &&
    a.resolvedStyle.fill === b.resolvedStyle.fill &&
    a.resolvedStyle.stroke === b.resolvedStyle.stroke &&
    a.resolvedStyle.defaultShape === b.resolvedStyle.defaultShape &&
    a.canvasTheme === b.canvasTheme
  );
}

const NODE_TITLE_PLACEHOLDER = "Untitled Element";

/**
 * Full-body target handle sits **behind** the node body so pointerdowns on the visible body start
 * a React Flow node drag; RF's drop hit-test still finds the target through the opaque body.
 * A full-body **source** handle stays mounted for edge anchoring only (`pointerEvents: "none"` so it
 * never steals drags). The visible Link2 button is a second source handle for drag-to-connect.
 */
const BODY_HANDLE_BASE: CSSProperties = {
  width: "100%",
  height: "100%",
  background: "transparent",
  border: 0,
  borderRadius: 10,
  transform: "none",
  top: 0,
  left: 0,
  position: "absolute",
  pointerEvents: "auto",
};

function DiagramNodeInner(props: NodeProps<DiagramFlowNode>) {
  const data = props.data;
  const { id, selected, dragging } = props;
  const isEditing = useDocument((s) => s.editingNodeId === id);
  const setEditingNodeId = useDocument((s) => s.setEditingNodeId);
  const updateNode = useDocument((s) => s.updateNode);

  const isConnectDropTarget = useConnection(
    useCallback(
      (c: ConnectionState) =>
        Boolean(
          c.inProgress &&
            c.toNode != null &&
            c.fromNode != null &&
            c.toNode.id === id &&
            c.fromNode.id !== id,
        ),
      [id],
    ),
  );

  const shape = data.shape ?? data.resolvedStyle.defaultShape;
  const fill = data.resolvedStyle.fill;
  const stroke = data.resolvedStyle.stroke;
  const isDarkCanvas = data.canvasTheme === "dark";
  const labelColor = isDarkCanvas ? "#ffffff" : "#111";
  const placeholderMuted = isDarkCanvas ? "rgba(255, 255, 255, 0.42)" : "rgba(17, 17, 17, 0.38)";

  const corner = Math.min(12, Math.min(data.w, data.h) * 0.2);
  /** Soft ring + light lift when selected (keeps blur modest for drag performance). */
  const selectedChrome =
    "0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.65) inset, 0 0 0 3px rgba(59, 130, 246, 0.35)";
  /** Large blurred shadows repaint badly in WebKit while the node transform-drags; strip them until drag ends. */
  const elevation = "0 1px 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.06)";
  const common: CSSProperties = {
    width: data.w,
    height: data.h,
    boxShadow: dragging ? "none" : isEditing ? elevation : selected ? selectedChrome : elevation,
    border: selected ? "2.5px solid rgba(59, 130, 246, 0.65)" : `2.5px solid ${stroke}`,
    background: fill,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    boxSizing: "border-box",
    color: labelColor,
    fontSize: 13,
    fontFamily: "system-ui, -apple-system, SF Pro Text, sans-serif",
    position: "relative",
    zIndex: 2,
    ...(dragging && selected && !isEditing
      ? {
          outline: "2px solid rgba(59, 130, 246, 0.55)",
          outlineOffset: 4,
        }
      : {}),
  };

  const clip: Record<string, CSSProperties> = {
    rectangle: { ...common, borderRadius: 0 },
    roundedRect: { ...common, borderRadius: corner },
    oval: { ...common, borderRadius: 9999 },
    circle: {
      ...common,
      borderRadius: "50%",
      aspectRatio: "1",
      width: data.h,
      height: data.h,
      margin: "0 auto",
    },
    diamond: {
      ...common,
      borderRadius: 4,
      transform: "rotate(45deg)",
      width: data.h * 0.85,
      height: data.h * 0.85,
      margin: "auto",
    },
    hexagon: {
      ...common,
      borderRadius: 6,
      clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
    },
    octagon: {
      ...common,
      borderRadius: 4,
      clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
    },
    parallelogram: { ...common, borderRadius: 4, transform: "skewX(-12deg)" },
  };

  const sx = clip[shape] ?? clip.roundedRect!;

  const startEditing = () => setEditingNodeId(id);

  const labelTransform =
    shape === "diamond" ? "rotate(-45deg)" : shape === "parallelogram" ? "skewX(12deg)" : undefined;

  const hasTitle = data.label.trim().length > 0;
  const showPlaceholder = !hasTitle && !selected;

  return (
    <div
      style={{
        position: "relative",
        width: data.w,
        height: data.h,
        zIndex: selected ? 2 : dragging ? 3 : isConnectDropTarget ? 2 : 0,
        transform: dragging ? "translateZ(0)" : undefined,
        WebkitTransform: dragging ? "translateZ(0)" : undefined,
        borderRadius: 10,
        outline: isConnectDropTarget ? "2px solid rgba(37, 99, 235, 0.85)" : undefined,
        outlineOffset: isConnectDropTarget ? 3 : undefined,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      {/*
       * Target handle fills the node so dropping a connection anywhere on the node is accepted.
       * React Flow's drop hit-test finds the handle through the opaque body above it.
       */}
      <Handle
        id={DIAGRAM_BODY_TARGET_HANDLE}
        type="target"
        position={Position.Left}
        style={{ ...BODY_HANDLE_BASE, zIndex: 0 }}
      />
      {/*
       * Always-mounted source anchor so edges render when this node is not selected (RF needs a
       * source Handle in the DOM). Not interactive — Link2 is the connect affordance.
       */}
      <Handle
        id={DIAGRAM_BODY_SOURCE_HANDLE}
        type="source"
        position={Position.Right}
        style={{ ...BODY_HANDLE_BASE, zIndex: 0, pointerEvents: "none" }}
      />

      <div style={sx}>
        {isEditing ? (
          <NodeLabelEditor
            initial={data.label}
            transform={labelTransform}
            onCommit={(value) => {
              const next = value.trim();
              if (next !== data.label) {
                updateNode(id, { text: next });
              }
              setEditingNodeId(null);
            }}
            onCancel={() => setEditingNodeId(null)}
          />
        ) : (
          <span
            style={{
              textAlign: "center",
              transform: labelTransform,
              ...(showPlaceholder
                ? {
                    color: placeholderMuted,
                    fontStyle: "italic",
                    userSelect: "none",
                  }
                : {}),
            }}
          >
            {showPlaceholder ? NODE_TITLE_PLACEHOLDER : hasTitle ? data.label : "\u00a0"}
          </span>
        )}
      </div>

      {selected && !isEditing ? (
        <Handle
          id={DIAGRAM_BODY_SOURCE_BUTTON_HANDLE}
          type="source"
          position={Position.Right}
          title="Drag to connect"
          aria-label="Connect to another element"
          style={{
            position: "absolute",
            top: 5,
            right: 5,
            left: "auto",
            transform: "none",
            width: 26,
            height: 26,
            minWidth: 26,
            minHeight: 26,
            borderRadius: 8,
            zIndex: 5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: isDarkCanvas ? "rgba(40, 44, 52, 0.96)" : "rgba(255, 255, 255, 0.98)",
            border: isDarkCanvas
              ? "1px solid rgba(148, 163, 184, 0.45)"
              : "1px solid rgba(15, 23, 42, 0.14)",
            color: isDarkCanvas ? "#e2e8f0" : "#334155",
            cursor: "crosshair",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
          }}
        >
          <Link2 size={13} strokeWidth={2.25} aria-hidden />
        </Handle>
      ) : null}
    </div>
  );
}

function NodeLabelEditor({
  initial,
  transform,
  onCommit,
  onCancel,
}: {
  initial: string;
  transform?: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  // Commit on outside pointerdown so that clicking elsewhere on the canvas
  // still ends the edit cleanly.
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as globalThis.Node)) {
        onCommit(value);
      }
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [value, onCommit]);

  return (
    <input
      ref={inputRef}
      className="nodrag nopan"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onCommit(value);
        } else if (e.key === "Escape") {
          e.preventDefault();
          onCancel();
        }
        e.stopPropagation();
      }}
      onBlur={() => onCommit(value)}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        width: "100%",
        textAlign: "center",
        background: "transparent",
        border: "none",
        outline: "none",
        boxShadow: "none",
        borderRadius: 3,
        color: "inherit",
        font: "inherit",
        padding: "2px 4px",
        transform,
      }}
    />
  );
}

export const DiagramNode = memo(DiagramNodeInner, diagramNodePropsAreEqual);
