import { styleById } from "@agentsdraw/core";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { CSSProperties } from "react";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { DiagramNodeData } from "../flowAdapter.js";
import { useDocument } from "../../state/useDocument.js";

const NODE_TITLE_PLACEHOLDER = "Untitled Element";

function DiagramNodeInner(props: NodeProps) {
  const data = props.data as DiagramNodeData;
  const { id, selected, dragging } = props;
  const diagram = useDocument(useShallow((s) => s.diagram));
  const editingNodeId = useDocument((s) => s.editingNodeId);
  const setEditingNodeId = useDocument((s) => s.setEditingNodeId);
  const updateNode = useDocument((s) => s.updateNode);

  const styleDef = useMemo(() => styleById(diagram, data.styleId), [diagram, data.styleId]);
  const shape = data.shape ?? styleDef?.shape ?? "roundedRect";
  const fill = styleDef
    ? `rgba(${Math.round(styleDef.fillRed * 255)},${Math.round(styleDef.fillGreen * 255)},${Math.round(styleDef.fillBlue * 255)},${styleDef.fillAlpha})`
    : "#eee";
  const stroke = styleDef
    ? `rgba(${Math.round(styleDef.strokeRed * 255)},${Math.round(styleDef.strokeGreen * 255)},${Math.round(styleDef.strokeBlue * 255)},${styleDef.strokeAlpha})`
    : "#444";

  const isEditing = editingNodeId === id;

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
    border: selected ? "2px solid #c41e6b" : `1.5px solid ${stroke}`,
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
          outline: "2px solid rgba(130, 175, 255, 0.85)",
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
        zIndex: selected ? 2 : dragging ? 3 : 0,
        transform: dragging ? "translateZ(0)" : undefined,
        WebkitTransform: dragging ? "translateZ(0)" : undefined,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        startEditing();
      }}
    >
      <Handle id="src" type="source" position={Position.Right} style={{ opacity: 0.35 }} />
      <Handle id="tgt" type="target" position={Position.Left} style={{ opacity: 0.35 }} />
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
        id="edge-out"
        type="source"
        position={Position.Right}
        style={{
          top: "50%",
          right: -10,
          background: "#0a84ff",
          width: 10,
          height: 10,
          borderRadius: 999,
          opacity: selected ? 1 : 0,
          pointerEvents: selected ? "auto" : "none",
          transition: "opacity 120ms ease",
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
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
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

export const DiagramNode = memo(DiagramNodeInner);
