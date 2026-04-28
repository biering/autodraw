import type { NodeProps } from "@xyflow/react";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useDocument } from "../../state/useDocument";
import type { DiagramTextLabelFlowNode } from "../flowAdapter";

function DiagramTextLabelNodeInner(props: NodeProps<DiagramTextLabelFlowNode>) {
  const { id, data, selected } = props;
  const dark = data.canvasTheme === "dark";
  const color = dark ? "#e8e8ec" : "#171717";
  const updateTextLabel = useDocument((s) => s.updateTextLabel);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.text);
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
    setDraft(data.text);
  }, [data.text]);

  const commit = useCallback(() => {
    const next = draft.trim();
    if (next !== data.text) {
      updateTextLabel(id, { text: next });
    }
    setEditing(false);
  }, [draft, data.text, id, updateTextLabel]);

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

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: double-click to edit free text
    <div
      className="pointer-events-auto flex h-full w-full items-start"
      style={{
        color,
        boxShadow: selected ? "0 0 0 2px rgba(59, 130, 246, 0.45)" : undefined,
        borderRadius: 4,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setEditing(true);
      }}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="nodrag nopan w-full rounded border border-border bg-background px-1 py-0.5 text-[13px] outline-none"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              setDraft(data.text);
              setEditing(false);
            }
            e.stopPropagation();
          }}
          onBlur={() => commit()}
        />
      ) : (
        <span className="nodrag text-[13px] leading-snug" style={{ wordBreak: "break-word" }}>
          {data.text || "\u00a0"}
        </span>
      )}
    </div>
  );
}

export const DiagramTextLabelNode = memo(DiagramTextLabelNodeInner);
