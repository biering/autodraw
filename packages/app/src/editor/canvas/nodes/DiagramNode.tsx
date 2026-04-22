import { Handle, Position, type NodeProps, useConnection } from "@xyflow/react";
import type { ConnectionState } from "@xyflow/system";
import type { CSSProperties } from "react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { DiagramFlowNode } from "../flowAdapter.js";
import { useDocument } from "../../state/useDocument.js";

function diagramNodePropsAreEqual(prev: NodeProps<DiagramFlowNode>, next: NodeProps<DiagramFlowNode>): boolean {
  if (prev.id !== next.id || prev.selected !== next.selected || prev.dragging !== next.dragging) return false;
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
    a.resolvedStyle.defaultShape === b.resolvedStyle.defaultShape
  );
}

const NODE_TITLE_PLACEHOLDER = "Untitled Element";

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
          c.fromNode.id !== id
        ),
      [id]
    )
  );

  const shape = data.shape ?? data.resolvedStyle.defaultShape;
  const fill = data.resolvedStyle.fill;
  const stroke = data.resolvedStyle.stroke;

  const corner = Math.min(12, Math.min(data.w, data.h) * 0.2);
  /** Magenta frame + soft periwinkle halo (matches desktop selection affordance). */
  const selectedChrome =
    "0 1.5px 4px rgba(0,0,0,0.14), 0 0 0 6px rgba(165, 195, 255, 0.62), 0 0 40px 4px rgba(110, 165, 255, 0.38)";
  /** Large blurred shadows repaint badly in WebKit while the node transform-drags; strip them until drag ends. */
  const elevation = "0 1.5px 3px rgba(0,0,0,0.12)";
  const common: CSSProperties = {
    width: data.w,
    height: data.h,
    boxShadow:
      dragging ? "none" : isEditing ? elevation : selected ? selectedChrome : elevation,
    border: selected ? "3.5px solid #c41e6b" : `3px solid ${stroke}`,
    background: fill,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    boxSizing: "border-box",
    color: "#111",
    fontSize: 13,
    fontFamily: "system-ui, -apple-system, SF Pro Text, sans-serif",
    ...(dragging && selected && !isEditing
      ? {
          outline: "2.5px solid rgba(130, 175, 255, 0.85)",
          outlineOffset: 5,
        }
      : {}),
  };

  const clip: Record<string, CSSProperties> = {
    rectangle: { ...common, borderRadius: 0 },
    roundedRect: { ...common, borderRadius: corner },
    oval: { ...common, borderRadius: 9999 },
    circle: { ...common, borderRadius: "50%", aspectRatio: "1", width: data.h, height: data.h, margin: "0 auto" },
    diamond: {
      ...common,
      borderRadius: 4,
      transform: "rotate(45deg)",
      width: data.h * 0.85,
      height: data.h * 0.85,
      margin: "auto",
    },
    hexagon: { ...common, borderRadius: 6, clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" },
    octagon: { ...common, borderRadius: 4, clipPath: "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)" },
    parallelogram: { ...common, borderRadius: 4, transform: "skewX(-12deg)" },
  };

  const sx = clip[shape] ?? clip.roundedRect!;

  const startEditing = () => setEditingNodeId(id);

  const labelTransform =
    shape === "diamond"
      ? "rotate(-45deg)"
      : shape === "parallelogram"
        ? "skewX(12deg)"
        : undefined;

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
        outline: isConnectDropTarget ? "3px solid rgba(10, 132, 255, 0.95)" : undefined,
        outlineOffset: isConnectDropTarget ? 2 : undefined,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      {/* Target handle: pointer-events none so the left edge selects the node in one click.
          Incoming links still land via loose connection mode + connectionRadius on the canvas. */}
      <Handle
        id="tgt"
        type="target"
        position={Position.Left}
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "#111",
          border: "2px solid #fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
          pointerEvents: "none",
        }}
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
                    color: "rgba(17, 17, 17, 0.38)",
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
      <Handle
        id="src"
        type="source"
        position={Position.Right}
        title="Drag to connect"
        style={{
          top: "50%",
          right: -4,
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "#111",
          border: "2px solid #fff",
          boxShadow: "0 0 0 1px rgba(0,0,0,0.12)",
        }}
      />
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
