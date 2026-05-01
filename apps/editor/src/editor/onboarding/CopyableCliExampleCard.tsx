"use client";

import { Copy } from "lucide-react";
import { type ReactNode, useCallback, useState } from "react";
import { cn } from "../../lib/utils";

export type CopyableCliLine = { id: string; text: string };

export type CopyableCliExampleCardProps = {
  /** Screen-reader / section label; shown uppercase (e.g. EXAMPLE) */
  label?: string;
  lines: readonly CopyableCliLine[];
  /** Prose below the code block */
  footer?: ReactNode;
  className?: string;
  /**
   * `light` — marketing / neutral palette.
   * `embedded` — editor / shadcn tokens inside dialogs.
   */
  variant?: "light" | "embedded";
};

export function CopyableCliExampleCard({
  label = "Example",
  lines,
  footer,
  className,
  variant = "embedded",
}: CopyableCliExampleCardProps) {
  const isLight = variant === "light";

  return (
    <div
      className={cn(
        "rounded-xl border p-6 md:p-8",
        isLight
          ? "border-neutral-200 bg-neutral-50"
          : "border-border bg-muted/30 dark:bg-muted/20",
        className,
      )}
    >
      <p
        className={cn(
          "text-sm font-normal uppercase tracking-wide",
          isLight ? "text-neutral-500" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <div
        className={cn(
          "mt-4 divide-y overflow-hidden rounded-xl border font-mono text-sm leading-relaxed",
          isLight
            ? "divide-neutral-200 border-neutral-200 bg-white text-neutral-800"
            : "divide-border border-border bg-card text-foreground",
        )}
      >
        {lines.map((row) => (
          <CopyableCliLineRow key={row.id} line={row} variant={variant} />
        ))}
      </div>
      {footer ? <div className={cn("mt-4", isLight ? "text-sm text-neutral-600" : "text-sm text-muted-foreground")}>{footer}</div> : null}
    </div>
  );
}

function CopyableCliLineRow({
  line,
  variant,
}: {
  line: CopyableCliLine;
  variant: "light" | "embedded";
}) {
  const [copied, setCopied] = useState(false);
  const isLight = variant === "light";

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(line.text).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      },
      () => {
        /* ignore — no toast on marketing site */
      },
    );
  }, [line.text]);

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
      <code className="min-w-0 flex-1 whitespace-pre-wrap break-all text-[13px] sm:text-sm">{line.text}</code>
      <button
        type="button"
        onClick={copy}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-lg p-2 transition-colors",
          isLight
            ? "text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800"
            : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300",
        )}
        aria-label={copied ? "Copied" : `Copy line: ${line.id}`}
      >
        {copied ? (
          <span className="text-xs font-medium tabular-nums">Copied</span>
        ) : (
          <Copy className="size-4" strokeWidth={2} aria-hidden />
        )}
      </button>
    </div>
  );
}
