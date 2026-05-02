"use client";

/**
 * Dark “terminal / matrix” panel: copyable rows for agent prompt, CLI, and MCP.
 * Self-contained styling so it reads clearly inside the onboarding dialog and on any canvas theme.
 */

import { Bot, Copy } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useState } from "react";
import * as SimpleIcons from "simple-icons";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

const siClaude = SimpleIcons.siClaude;
const siCursor = SimpleIcons.siCursor;

export type AgentGetStartedCopyRow = {
  id: string;
  text: string;
};

export type AgentGetStartedPanelProps = {
  className?: string;
  heading?: string;
  primaryLabel: string;
  primaryRow: AgentGetStartedCopyRow;
  orRunLabel?: string;
  orRunRows: AgentGetStartedCopyRow[];
  mcpLabel?: string;
  mcpRows?: AgentGetStartedCopyRow[];
  /** Rendered inside the card shell, bottom-right (e.g. Done). */
  footer?: ReactNode;
};

const shell = cn(
  "overflow-hidden rounded-2xl border shadow-lg",
  "border-emerald-800/55 bg-[#0c1412]",
  "ring-1 ring-emerald-500/10",
);

/** Faint green dot grid (matrix-style) */
const matrixDots: CSSProperties = {
  backgroundColor: "transparent",
  backgroundImage:
    "radial-gradient(circle at center, rgba(52, 211, 153, 0.14) 1px, transparent 1px)",
  backgroundSize: "14px 14px",
};

function SectionLabel({ children }: { children: string }) {
  return <p className="font-mono text-[13px] font-medium text-emerald-100/85">{children}</p>;
}

function SimpleIconGlyph({
  icon,
  className,
  style,
  "aria-label": ariaLabel,
}: {
  icon: { title: string; path: string };
  className?: string;
  style?: CSSProperties;
  "aria-label"?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      style={style}
      aria-label={ariaLabel ?? icon.title}
    >
      <title>{icon.title}</title>
      <path d={icon.path} fill="currentColor" />
    </svg>
  );
}

function WorksWithBar() {
  const pill = cn(
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5",
    "border-emerald-800/60 bg-black/50 font-mono text-[11px] font-medium text-emerald-50/95",
    "shadow-sm",
  );

  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-emerald-800/45 pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="shrink-0 font-mono text-[11px] text-emerald-200/65">Works with:</span>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        <span className={pill}>
          <SimpleIconGlyph
            icon={siClaude}
            className="size-4 shrink-0"
            style={{ color: `#${siClaude.hex}` }}
            aria-label="Claude"
          />
          Claude
        </span>
        <span className={pill}>
          <SimpleIconGlyph
            icon={siCursor}
            className="size-4 shrink-0 text-white"
            aria-label="Cursor"
          />
          Cursor
        </span>
        <span className={pill}>
          <Bot
            className="size-4 shrink-0 text-white"
            strokeWidth={2}
            aria-hidden
          />
          Other agents
        </span>
      </div>
    </div>
  );
}

function CopyableRow({ row }: { row: AgentGetStartedCopyRow }) {
  const [done, setDone] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(row.text).then(
      () => {
        setDone(true);
        toast.success("Copied");
        window.setTimeout(() => setDone(false), 1600);
      },
      () => toast.error("Could not copy"),
    );
  }, [row.text]);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-3 py-2.5 sm:px-3.5",
        "border-emerald-800/50 bg-black/45 shadow-inner",
      )}
    >
      <code className="min-w-0 flex-1 break-all font-mono text-[11px] leading-relaxed text-emerald-50/95 sm:text-xs">
        {row.text}
      </code>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors",
          "text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
        )}
        aria-label={done ? "Copied" : `Copy: ${row.id}`}
      >
        {done ? (
          <span className="font-mono text-[10px] font-medium uppercase tracking-wide text-emerald-400">
            Copied
          </span>
        ) : (
          <Copy className="size-4" strokeWidth={2.25} aria-hidden />
        )}
      </button>
    </div>
  );
}

export function AgentGetStartedPanel({
  className,
  heading = "Get started",
  primaryLabel,
  primaryRow,
  orRunLabel = "Or run:",
  orRunRows,
  mcpLabel,
  mcpRows,
  footer,
}: AgentGetStartedPanelProps) {
  return (
    <div className={cn(shell, "flex max-h-[min(88vh,760px)] flex-col", className)}>
      {heading ? (
        <div className="shrink-0 border-b border-emerald-800/50 bg-emerald-950/70 px-4 py-2.5">
          <p className="text-center font-sans text-xs font-medium tracking-wide text-emerald-100/90">
            {heading}
          </p>
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1 overflow-y-auto" style={matrixDots}>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/20 to-transparent"
        />
        <div className="relative space-y-4 px-4 py-4 md:px-5 md:py-5">
          <div className="space-y-2">
            <SectionLabel>{primaryLabel}</SectionLabel>
            <CopyableRow row={primaryRow} />
          </div>

          <div className="space-y-2">
            <SectionLabel>{orRunLabel}</SectionLabel>
            <div className="space-y-2">
              {orRunRows.map((row) => (
                <CopyableRow key={row.id} row={row} />
              ))}
            </div>
          </div>

          {mcpLabel && mcpRows?.length ? (
            <div className="space-y-2">
              <SectionLabel>{mcpLabel}</SectionLabel>
              <div className="space-y-2">
                {mcpRows.map((row) => (
                  <CopyableRow key={row.id} row={row} />
                ))}
              </div>
            </div>
          ) : null}

          <WorksWithBar />
        </div>
      </div>

      {footer ? (
        <div className="shrink-0 border-t border-emerald-800/45 bg-[#0a1210] px-4 py-3 md:px-5">
          <div className="flex justify-end">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}
