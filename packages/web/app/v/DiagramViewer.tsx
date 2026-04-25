"use client";

import type { DiagramV1 } from "@autodraw/core";
import { DiagramCanvasPeek } from "@autodraw/editor";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  diagram: DiagramV1;
  /** Raw `d` query value for deep-linking to `/app`. */
  rawPayload: string;
};

export function DiagramViewer({ diagram, rawPayload }: Props) {
  const appHref = `/app?d=${encodeURIComponent(rawPayload)}`;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white text-black">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4 md:px-6">
        <Link href="/" className="text-base font-medium tracking-tight">
          Autodraw
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" asChild>
            <Link href="/spec">Format spec</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href={appHref}>Open in editor</Link>
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 p-3 md:p-4">
        <div className="mx-auto flex h-[min(85dvh,900px)] max-w-6xl flex-col overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50">
          <div className="border-b border-neutral-200 px-4 py-2">
            <h1 className="truncate text-sm font-medium text-neutral-800 md:text-base">{diagram.name}</h1>
            <p className="text-xs text-neutral-500">
              {diagram.nodes.length} nodes · {diagram.edges.length} edges · read-only
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <DiagramCanvasPeek diagram={diagram} canvasTheme="light" className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
