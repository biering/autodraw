import { frameCanvasChrome } from "@autodraw/core";
import { type NodeProps, NodeResizer } from "@xyflow/react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDocument } from "../../state/useDocument";
import type { DiagramFrameFlowNode } from "../flowAdapter";

const PLACEHOLDER = "Untitled area";

function DiagramFrameNodeInner(props: NodeProps<DiagramFrameFlowNode>) {
  const { id, data, selected } = props;
  const readOnly = data.interactionDisabled === true;
  const dark = data.canvasTheme === "dark";
  const theme = dark ? "dark" : "light";
  const chrome = frameCanvasChrome(data.color, theme);
  const title = data.name?.trim() ?? "";
  const hasTitle = title.length > 0;

  const updateFrame = useDocument((s) => s.updateFrame);
  const editingFrameId = useDocument((s) => s.editingFrameId);
  const setEditingFrameId = useDocument((s) => s.setEditingFrameId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.name ?? "");
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!editing) return;
    const idRaf = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(idRaf);
  }, [editing]);

  useEffect(() => {
    setDraft(data.name ?? "");
  }, [data.name]);

  useEffect(() => {
    if (readOnly) return;
    if (editingFrameId === id) {
      setDraft(data.name ?? "");
      setEditing(true);
    }
  }, [editingFrameId, id, readOnly, data.name]);

  useEffect(() => {
    if (!editing) return;
    if (editingFrameId != null && editingFrameId !== id) {
      setEditing(false);
    }
  }, [editing, editingFrameId, id]);

  const commit = useCallback(() => {
    const next = draft.trim();
    const prev = (data.name ?? "").trim();
    if (next !== prev) {
      updateFrame(id, next === "" ? { name: undefined } : { name: next });
    }
    setEditing(false);
    setEditingFrameId(null);
  }, [draft, data.name, id, updateFrame, setEditingFrameId]);

  useEffect(() => {
    if (!editing) return;
    const onDown = (e: PointerEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as globalThis.Node)) {
        commit();
      }
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [editing, commit]);

  const startEditing = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (readOnly) return;
      setDraft(data.name ?? "");
      setEditing(true);
    },
    [data.name, readOnly],
  );

  const labelColor = dark ? "#94a3b8" : "#64748b";
  const placeholderMuted = dark ? "rgba(148, 163, 184, 0.55)" : "rgba(100, 116, 139, 0.65)";

  const resizeAccent = dark ? "rgba(96, 165, 250, 0.85)" : "rgba(59, 130, 246, 0.75)";

  return (
    <div
      className="pointer-events-auto relative h-full w-full rounded-xl px-2 py-1.5"
      style={{
        boxSizing: "border-box",
        border: `2px dashed ${chrome.border}`,
        background: chrome.fill,
        boxShadow: selected ? "0 0 0 2px rgba(59, 130, 246, 0.45)" : undefined,
      }}
    >
      {!readOnly && selected ? (
        <NodeResizer
          isVisible
          minWidth={80}
          minHeight={56}
          color={resizeAccent}
          lineClassName="!border-[1.5px]"
          lineStyle={{ borderColor: resizeAccent }}
          handleClassName="!h-2.5 !w-2.5 !rounded-sm !border !border-background !shadow-sm"
        />
      ) : null}
      {editing ? (
        <input
          ref={inputRef}
          className="nodrag nopan box-border w-full max-w-full rounded border border-border bg-background px-1 py-0.5 text-[11px] font-semibold uppercase tracking-wide outline-none"
          style={{ color: labelColor }}
          value={draft}
          aria-label="Frame title"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraft(data.name ?? "");
              setEditing(false);
              setEditingFrameId(null);
            }
            e.stopPropagation();
          }}
          onBlur={() => commit()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
      ) : (
        // biome-ignore lint/a11y/noStaticElementInteractions: double-click to rename frame (same pattern as text labels)
        <div
          className="nodrag nopan cursor-text select-none text-[11px] font-semibold uppercase tracking-wide"
          style={{
            color: hasTitle ? labelColor : placeholderMuted,
            fontStyle: hasTitle ? "normal" : "italic",
          }}
          title="Double-click to edit title"
          onDoubleClick={startEditing}
        >
          {hasTitle ? title : PLACEHOLDER}
        </div>
      )}
    </div>
  );
}

export const DiagramFrameNode = memo(DiagramFrameNodeInner);
