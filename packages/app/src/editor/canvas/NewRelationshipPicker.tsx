import type { EdgeHead } from "@agentsdraw/core";
import { ChevronDown } from "lucide-react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/** Options shown in the marker dropdown, in display order. `none` stays first for “no marker”. */
export const EDGE_MARKER_OPTIONS: readonly EdgeHead[] = [
  "none",
  "lineArrow",
  "triangleArrow",
  "triangleReversed",
  "circle",
  "diamond",
];

/** Menu + button labels for each marker kind. */
const EDGE_MARKER_LABELS: Record<EdgeHead, string> = {
  none: "No marker",
  lineArrow: "Line arrow",
  triangleArrow: "Triangle arrow",
  triangleReversed: "Reversed triangle",
  circle: "Circle",
  diamond: "Diamond",
};

type MarkerRole = "start" | "end";

/**
 * Short line + large marker preview. Mirrored for `role === "start"` so the head sits on the
 * left-hand side, matching how the marker will render at the start of an edge.
 */
function MarkerGlyph({ kind, role }: { kind: EdgeHead; role: MarkerRole }) {
  const stroke = "currentColor";
  const sw = 1.75;
  const cy = 14;
  const tipX = role === "end" ? 44 : 8;
  const flip = role === "start" ? -1 : 1;

  const lineFrom = role === "end" ? 10 : 42;
  const lineTo = role === "end" ? 30 : 22;
  const line = (
    <path
      d={role === "end" ? `M ${lineFrom} ${cy} H ${lineTo}` : `M ${lineTo} ${cy} H ${lineFrom}`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
    />
  );

  const lineArrow = (
    <path
      d={`M ${tipX - 9 * flip} ${cy - 5.5} L ${tipX} ${cy} L ${tipX - 9 * flip} ${cy + 5.5}`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );

  const triangleArrow = (
    <polygon
      points={`${tipX},${cy} ${tipX - 10 * flip},${cy - 6.5} ${tipX - 10 * flip},${cy + 6.5}`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  );

  const triangleReversed = (
    <polygon
      points={`${tipX - 10 * flip},${cy} ${tipX},${cy - 6.5} ${tipX},${cy + 6.5}`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  );

  const circleR = 5;
  const circleCx = tipX - circleR * flip;
  const circleGlyph = (
    <circle cx={circleCx} cy={cy} r={circleR} fill="none" stroke={stroke} strokeWidth={sw} />
  );

  const dSide = 5.5;
  const diamondCx = tipX - dSide * flip;
  const diamondGlyph = (
    <polygon
      points={`${tipX},${cy} ${diamondCx},${cy - dSide} ${diamondCx - dSide * flip},${cy} ${diamondCx},${cy + dSide}`}
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinejoin="round"
    />
  );

  return (
    <svg width="52" height="26" viewBox="0 0 52 28" aria-hidden className="shrink-0">
      {line}
      {kind === "lineArrow" ? lineArrow : null}
      {kind === "triangleArrow" ? triangleArrow : null}
      {kind === "triangleReversed" ? triangleReversed : null}
      {kind === "circle" ? circleGlyph : null}
      {kind === "diamond" ? diamondGlyph : null}
    </svg>
  );
}

export type EdgeMarkerDropdownProps = {
  role: MarkerRole;
  value: EdgeHead;
  onChange: (next: EdgeHead) => void;
  /** Optional short heading shown above the trigger (e.g. “Start marker”). */
  label?: string;
};

/**
 * Single-column shadcn dropdown listing all marker options. The trigger displays the current
 * marker's glyph + label with a caret, mirroring the “+ New”-style menu from the design.
 */
function EdgeMarkerDropdownInner({ role, value, onChange, label }: EdgeMarkerDropdownProps) {
  return (
    <div className="flex flex-col gap-1 px-2 pb-2">
      {label ? (
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" className="h-9 w-full justify-between gap-2 px-2">
            <span className="flex items-center gap-2">
              <MarkerGlyph kind={value} role={role} />
              <span className="text-sm">{EDGE_MARKER_LABELS[value]}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[14rem] p-1">
          {EDGE_MARKER_OPTIONS.map((kind) => {
            const active = value === kind;
            return (
              <DropdownMenuItem
                key={kind}
                onSelect={() => onChange(kind)}
                className={cn("gap-2 px-2 py-1.5", active && "bg-accent")}
              >
                <MarkerGlyph kind={kind} role={role} />
                <span>{EDGE_MARKER_LABELS[kind]}</span>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const EdgeMarkerDropdown = memo(EdgeMarkerDropdownInner);
