"use client";

import { DiagramCanvasPeek } from "@autodraw/editor";

/**
 * Reuses the same React Flow canvas, node, and edge components as `/app` with a local sample diagram.
 */
export function HeroDiagramPreview() {
  return (
    <section className="relative bg-white" aria-label="Product preview">
      <p className="px-6 pt-2 text-center font-mono text-xs leading-relaxed text-neutral-600 md:text-sm">
        macOS 14.6+ (Sonoma) · Apple Silicon recommended · Web canvas runs in any modern browser
      </p>

      <div className="relative mx-auto mt-8 max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-lg border border-neutral-200 pb-px">
          <div className="relative h-[200px] w-full sm:h-[240px]">
            <DiagramCanvasPeek className="absolute inset-0 h-full w-full [&_.react-flow\_\_pane]:cursor-default" />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-linear-to-b from-transparent to-white"
            aria-hidden
          />
        </div>
      </div>

      <div className="relative z-1 h-px w-screen max-w-none bg-[#e5e5e5] mx-[calc(50%-50vw)]" aria-hidden />
    </section>
  );
}
