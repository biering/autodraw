"use client";

import type { NodeShape } from "@autodraw/core";
import { Check } from "lucide-react";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "../../components/ui/dropdown-menu";
import { CreationShapeGlyph, creationShapeToggleLabel } from "../CreationShapeChoice";

export type ColorChoice = {
  id: string;
  label: string;
  /** Background of the swatch dot. */
  fill: string;
  /** Optional 1-px inset border (handy for translucent / very light fills). */
  stroke?: string;
};

function Swatch({ fill, stroke }: { fill: string; stroke?: string }) {
  return (
    <span
      className="h-3 w-3 shrink-0 rounded-full"
      style={{
        backgroundColor: fill,
        boxShadow: stroke ? `inset 0 0 0 1px ${stroke}` : undefined,
      }}
      aria-hidden
    />
  );
}

type ColorChoiceSubmenuProps = {
  triggerLabel?: string;
  options: readonly ColorChoice[];
  activeId: string;
  onSelect: (id: string) => void;
};

/**
 * Submenu of color swatches reused by the frame and node context menus. The trigger row shows
 * the current color's swatch + label; the popup lists all options with a `Check` next to the
 * active one — matching the visual style of the frame's "Colour" sub.
 */
export function ColorChoiceSubmenu({
  triggerLabel = "Color",
  options,
  activeId,
  onSelect,
}: ColorChoiceSubmenuProps) {
  const active = options.find((o) => o.id === activeId);
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        {active ? <Swatch fill={active.fill} stroke={active.stroke} /> : null}
        {triggerLabel}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-[10rem]">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onSelect={() => {
              onSelect(opt.id);
            }}
          >
            <Swatch fill={opt.fill} stroke={opt.stroke} />
            <span>{opt.label}</span>
            {opt.id === activeId ? (
              <Check className="ml-auto h-4 w-4 shrink-0" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

type ShapeChoiceSubmenuProps = {
  triggerLabel?: string;
  shapes: readonly NodeShape[];
  activeShape: NodeShape;
  onSelect: (s: NodeShape) => void;
};

/**
 * Submenu of node shapes (e.g. rounded vs sharp rectangle) for the node context menu. Mirrors
 * {@link ColorChoiceSubmenu}'s structure so both choices feel cohesive in the same menu.
 */
export function ShapeChoiceSubmenu({
  triggerLabel = "Shape",
  shapes,
  activeShape,
  onSelect,
}: ShapeChoiceSubmenuProps) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="gap-2">
        <CreationShapeGlyph shape={activeShape} className="text-muted-foreground" />
        {triggerLabel}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="min-w-[10rem]">
        {shapes.map((sh) => (
          <DropdownMenuItem
            key={sh}
            onSelect={() => {
              onSelect(sh);
            }}
          >
            <CreationShapeGlyph shape={sh} className="text-muted-foreground" />
            <span>{creationShapeToggleLabel(sh)}</span>
            {sh === activeShape ? <Check className="ml-auto h-4 w-4 shrink-0" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
