import { relationshipPresets } from "@agentsdraw/core";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function PresetThumb({ index }: { index: number }) {
  const stroke = "currentColor";
  const dash =
    index === 4 || index === 5 || index === 6 ? "4 3" : index === 7 ? "1.5 3" : undefined;
  const sw = index === 2 ? 2.2 : 1.2;
  const headOpen = (
    <path
      d="M 52 28 L 46 24 M 52 28 L 46 32"
      fill="none"
      stroke={stroke}
      strokeWidth={1.2}
      strokeLinecap="round"
    />
  );
  const headFilled = <path d="M 52 28 L 46 24 L 46 32 Z" fill={stroke} stroke="none" />;
  const headSquare = (
    <rect x="45" y="24" width="6" height="8" fill="none" stroke={stroke} strokeWidth={1.1} />
  );
  const tailSquare = (
    <rect x="10" y="24" width="7" height="8" fill="none" stroke={stroke} strokeWidth={1.1} />
  );
  const pathElbow = (
    <path
      d="M 14 28 H 34 V 28 H 46"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
    />
  );
  const pathStraight = (
    <path
      d="M 14 28 H 50"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeDasharray={dash}
    />
  );

  switch (index) {
    case 0:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathStraight}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 1:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 2:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 3:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          <path
            d="M 14 28 H 34 V 28 H 44"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 44 28 L 50 24 M 44 28 L 50 32"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <path
            d="M 44 28 L 38 24 M 44 28 L 38 32"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
          />
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 4:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 5:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {tailSquare}
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 6:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headSquare}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    case 7:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="currentColor" opacity={0.55}>
            Aa
          </text>
        </svg>
      );
    default:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headFilled}
        </svg>
      );
  }
}

export type RelationshipPresetGridProps = {
  onPick: (presetIndex: number) => void;
  /** When set, highlights the active preset (e.g. selected edge). */
  activePresetIndex?: number | null;
};

/** Light tile so line previews stay visible (app `:root` tokens are dark). */
const presetButtonClass = cn(
  "min-h-14 min-w-[4.5rem] flex-col rounded-lg border-zinc-200/90 bg-zinc-50 px-1 py-2 font-normal text-zinc-900 shadow-sm",
  "hover:bg-zinc-100 hover:text-zinc-950",
  "[&_svg]:pointer-events-auto [&_svg]:size-auto [&_svg]:h-auto [&_svg]:w-auto [&_svg]:max-w-none [&_svg]:shrink-0",
);

/** Centered preset thumbnails for relationship styling (new edge or edit existing). */
function RelationshipPresetGridInner({ onPick, activePresetIndex }: RelationshipPresetGridProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {relationshipPresets.map((presetId, idx) => {
        const isActive = activePresetIndex != null && activePresetIndex === idx;
        return (
          <Button
            key={presetId}
            type="button"
            variant="outline"
            title={presetId}
            aria-pressed={isActive}
            className={cn(
              presetButtonClass,
              isActive &&
                "border-primary bg-sky-50 text-zinc-950 ring-2 ring-primary/50 ring-offset-2 ring-offset-zinc-50",
            )}
            onClick={() => onPick(idx)}
          >
            <PresetThumb index={idx} />
          </Button>
        );
      })}
    </div>
  );
}

export const RelationshipPresetGrid = memo(RelationshipPresetGridInner);
