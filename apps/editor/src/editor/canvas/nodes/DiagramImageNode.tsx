import type { NodeProps } from "@xyflow/react";
import { memo } from "react";
import type { DiagramImageFlowNode } from "../flowAdapter";

function DiagramImageNodeInner(props: NodeProps<DiagramImageFlowNode>) {
  const { data, selected } = props;
  const dark = data.canvasTheme === "dark";
  const border = dark ? "rgba(148, 163, 184, 0.4)" : "rgba(15, 23, 42, 0.12)";

  return (
    <div
      className="pointer-events-auto h-full w-full overflow-hidden rounded-md bg-white/90"
      style={{
        boxSizing: "border-box",
        border: `1.5px solid ${border}`,
        boxShadow: selected ? "0 0 0 2px rgba(59, 130, 246, 0.45)" : "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <img
        src={data.src}
        alt={data.alt ?? ""}
        className="h-full w-full object-contain"
        draggable={false}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

export const DiagramImageNode = memo(DiagramImageNodeInner);
