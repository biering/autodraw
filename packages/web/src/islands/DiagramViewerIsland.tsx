import type { DiagramV1 } from "@autodraw/core";
import { DiagramCanvasPeek } from "@autodraw/editor";
import { decodeDiagramSharePayload } from "@autodraw/editor/share-payload";
import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ViewState =
	| { status: "loading" }
	| { status: "missing" }
	| { status: "invalid" }
	| { status: "ok"; diagram: DiagramV1; rawPayload: string };

function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			href={href}
			className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-5 py-2 text-sm font-normal text-neutral-900 hover:bg-neutral-200"
		>
			{children}
		</a>
	);
}

export function DiagramViewerIsland() {
	const [state, setState] = useState<ViewState>({ status: "loading" });

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const raw = params.get("d")?.trim();
		if (!raw) {
			setState({ status: "missing" });
			return;
		}
		try {
			const diagram = decodeDiagramSharePayload(raw);
			setState({ status: "ok", diagram, rawPayload: raw });
		} catch {
			setState({ status: "invalid" });
		}
	}, []);

	if (state.status === "loading") {
		return (
			<div className="mx-auto max-w-lg px-6 py-16 text-neutral-800">
				<p className="text-neutral-600">Loading…</p>
			</div>
		);
	}

	if (state.status === "missing") {
		return (
			<div className="mx-auto max-w-lg px-6 py-16 text-neutral-800">
				<h1 className="text-2xl font-medium tracking-tight">Missing payload</h1>
				<p className="mt-3 text-neutral-600">
					Add query parameter <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm">d</code>{" "}
					with a gzip+base64url-encoded diagram (see{" "}
					<a className="text-black underline underline-offset-4" href="/spec">
						format spec
					</a>
					).
				</p>
				<p className="mt-6">
					<ButtonLink href="/">Home</ButtonLink>
				</p>
			</div>
		);
	}

	if (state.status === "invalid") {
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

	const { diagram, rawPayload } = state;
	const appHref = `/app?d=${encodeURIComponent(rawPayload)}`;

	return (
		<div className="flex min-h-[100dvh] flex-col bg-white text-black">
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 px-4 md:px-6">
				<a href="/" className="text-base font-medium tracking-tight">
					Autodraw
				</a>
				<div className="flex items-center gap-2">
					<Button variant="secondary" size="sm" asChild>
						<a href="/spec">Format spec</a>
					</Button>
					<Button size="sm" asChild>
						<a href={appHref}>Open in editor</a>
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
