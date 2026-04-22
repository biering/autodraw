import { applyRelationshipPreset, relationshipPresets } from "@agentsdraw/core";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
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
          <Button
            key={idx}
            type="button"
            size="sm"
            variant={edge.relationshipPreset === idx ? "default" : "outline"}
            className="min-w-8 px-2"
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
            title={`Preset ${idx + 1}`}
          >
            {idx + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}
