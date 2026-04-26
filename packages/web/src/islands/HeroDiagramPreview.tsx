import type { DiagramV1 } from "@autodraw/core";
import { DiagramCanvasPeek } from "@autodraw/editor";
import { useEffect, useState } from "react";

const HERO_DIAGRAM_INITIAL: DiagramV1 = {
	version: 1,
	name: "Preview",
	palette: "universal",
	canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
	nodes: [
		{ id: "hero-left", text: "API", x: 64, y: 92, w: 132, h: 56, styleId: "hero-lime" },
		{ id: "hero-right", text: "Service", x: 320, y: 92, w: 132, h: 56, styleId: "hero-lime" },
	],
	edges: [
		{
			id: "hero-e1",
			from: "hero-left",
			to: "hero-right",
			routing: "orthogonal",
			dash: "solid",
			head: "lineArrow",
			tail: "none",
			label: "",
			strokeWidth: 1,
		},
	],
	customStyles: [
		{
			id: "hero-lime",
			fillRed: 0.8784313725,
			fillGreen: 0.937254902,
			fillBlue: 0.568627451,
			fillAlpha: 1,
			strokeRed: 0.8784313725,
			strokeGreen: 0.937254902,
			strokeBlue: 0.568627451,
			strokeAlpha: 1,
			shape: "roundedRect",
		},
	],
};

const HERO_THIRD_NODE_DELAY_MS = 2800;

function heroDiagramWithDownstream(d: DiagramV1): DiagramV1 {
	const gap = 24;
	const service = d.nodes.find((n) => n.id === "hero-right");
	const y = service ? service.y + service.h + gap : 172;
	const x = service?.x ?? 320;
	return {
		...d,
		nodes: [
			...d.nodes,
			{
				id: "hero-down",
				text: "Worker",
				x,
				y,
				w: 132,
				h: 56,
				styleId: "hero-lime",
			},
		],
		edges: [
			...d.edges,
			{
				id: "hero-e2",
				from: "hero-right",
				to: "hero-down",
				routing: "orthogonal",
				dash: "solid",
				head: "lineArrow",
				tail: "none",
				label: "",
				strokeWidth: 1,
			},
		],
	};
}

export function HeroDiagramPreview() {
	const [diagram, setDiagram] = useState<DiagramV1>(() => HERO_DIAGRAM_INITIAL);

	useEffect(() => {
		const id = window.setTimeout(() => {
			setDiagram((prev) => {
				if (prev.nodes.some((n) => n.id === "hero-down")) return prev;
				return heroDiagramWithDownstream(prev);
			});
		}, HERO_THIRD_NODE_DELAY_MS);
		return () => window.clearTimeout(id);
	}, []);

	return (
		<section className="relative bg-white" aria-label="Product preview">
			<p className="px-6 pt-2 text-center font-mono text-xs leading-relaxed text-neutral-600 md:text-sm">
				macOS 14.6+ (Sonoma) · Apple Silicon recommended · Web canvas runs in any modern browser
			</p>

			<div className="relative mx-auto mt-8 max-w-5xl px-4 sm:px-6">
				<div className="relative overflow-hidden rounded-t-lg border border-b-0 border-neutral-200 pb-px">
					<div className="relative h-[200px] w-full sm:h-[240px]">
						<div className="pointer-events-none h-full w-full">
							<DiagramCanvasPeek
								className="h-full w-full"
								canvasTheme="light"
								diagram={diagram}
								interactive={false}
							/>
						</div>
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
