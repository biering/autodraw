import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { decodeDiagramSharePayload } from "@autodraw/editor/share-payload";
import { DiagramViewer } from "./DiagramViewer";

export const metadata: Metadata = {
  title: "View diagram · Autodraw",
  description: "Read-only Autodraw diagram from a share link.",
};

export default async function ViewDiagramPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const raw = d?.trim();

  if (!raw) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-neutral-800">
        <h1 className="text-2xl font-medium tracking-tight">Missing payload</h1>
        <p className="mt-3 text-neutral-600">
          Add query parameter <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">d</code> with a
          gzip+base64url-encoded diagram (see{" "}
          <Link className="text-black underline underline-offset-4" href="/spec">
            format spec
          </Link>
          ).
        </p>
        <p className="mt-6">
          <ButtonLink href="/">Home</ButtonLink>
        </p>
      </div>
    );
  }

  try {
    const diagram = decodeDiagramSharePayload(raw);
    return <DiagramViewer diagram={diagram} rawPayload={raw} />;
  } catch {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-neutral-800">
        <h1 className="text-2xl font-medium tracking-tight">Invalid diagram</h1>
        <p className="mt-3 text-neutral-600">The payload could not be decoded or is not valid diagram v1 JSON.</p>
        <p className="mt-6">
          <ButtonLink href="/spec">Format spec</ButtonLink>
        </p>
      </div>
    );
  }
}

function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-5 py-2 text-sm font-normal text-neutral-900 hover:bg-neutral-200"
    >
      {children}
    </Link>
  );
}
