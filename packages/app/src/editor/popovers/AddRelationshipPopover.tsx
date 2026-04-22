import { applyRelationshipPreset, relationshipPresets } from "@agentsdraw/core";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useDocument } from "../state/useDocument.js";

/** Simple preset picker when an edge is selected (toolbar-adjacent UX). */
export function AddRelationshipPopover() {
  const selection = useDocument(useShallow((s) => s.selection));
  const diagram = useDocument(useShallow((s) => s.diagram));
  const updateEdge = useDocument((s) => s.updateEdge);

  const edgeId = selection.edgeIds[0];
  const edge = useMemo(() => diagram.edges.find((e) => e.id === edgeId), [diagram.edges, edgeId]);

  if (!edge) return null;

  return (
    <div className="relationshipBar" role="region" aria-label="Relationship style">
      <div className="relationshipTitle">Relationship</div>
      <div className="presetRow">
        {relationshipPresets.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`presetBtn ${edge.relationshipPreset === idx ? "active" : ""}`}
            onClick={() => {
              const st = applyRelationshipPreset(idx);
              updateEdge(edge.id, {
                routing: st.routing,
                dash: st.dash,
                head: st.head,
                tail: st.tail,
                strokeWidth: st.strokeWidth,
                relationshipPreset: st.relationshipPreset,
              });
            }}
            title={`Preset ${idx}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
