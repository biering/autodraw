import { Check, Command, Download, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
	{
		title: "Clarity by default",
		body: "Mostly grayscale so the diagram stays readable. Less chrome, fewer gradients, more of what you ship.",
		icon: Layers,
	},
	{
		title: "Built for iteration",
		body: "Keyboard-first edits, snapping, and undo-friendly moves. You stay in flow instead of fighting the UI.",
		icon: Command,
	},
	{
		title: "Agents and humans, same file",
		body: "Pair the web canvas with the `autodraw` CLI and MCP so bots and pipelines edit the same JSON the UI does.",
		icon: Sparkles,
	},
] as const;

const workflowBullets = [
	"Stop passing screenshots around. One `.adraw` in git is the source of truth for reviews and handoffs.",
	"When CI needs assets, export SVG, PNG, or PDF from the CLI, or script changes and open the result in `/app`.",
	"The Mac app will add native open/save, offline work, and export paths tuned for daily use.",
] as const;

export function HomeSections() {
	return (
		<>
			<section id="features" className="bg-neutral-50 py-24 md:py-28">
				<div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-3 md:gap-10">
					{features.map(({ title, body, icon: Icon }) => (
						<div key={title} className="rounded-xl border border-neutral-200 bg-white p-8">
							<div className="mb-4 flex size-11 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-black">
								<Icon className="size-5" strokeWidth={1.75} aria-hidden />
							</div>
							<h2 className="text-2xl font-medium leading-tight tracking-tight">{title}</h2>
							<p className="mt-3 text-base leading-relaxed text-neutral-600">{body}</p>
						</div>
					))}
				</div>
			</section>

			<section id="workflow" className="mx-auto max-w-6xl px-6 py-24 md:py-28">
				<div className="grid gap-14 md:grid-cols-2 md:items-center md:gap-20">
					<div>
						<h2
							className="text-3xl font-medium leading-tight tracking-tight md:text-4xl"
							style={{
								fontFamily:
									"ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
							}}
						>
							From sketch to a diagram in the repo
						</h2>
						<ul className="mt-8 space-y-4 text-base leading-relaxed text-neutral-700">
							{workflowBullets.map((t) => (
								<li key={t} className="flex gap-3">
									<span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-black">
										<Check className="size-3.5" strokeWidth={2.5} aria-hidden />
									</span>
									<span>{t}</span>
								</li>
							))}
						</ul>
					</div>
					<div className="rounded-xl border border-neutral-200 bg-neutral-50 p-6 md:p-8">
						<p className="text-sm font-normal uppercase tracking-wide text-neutral-500">Example</p>
						<pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-white p-4 font-mono text-sm leading-relaxed text-neutral-800">
							<code>
								{`pnpm exec autodraw init ./design.adraw --palette universal
pnpm exec autodraw add node ./design.adraw \\
  --text "API Gateway" --x 240 --y 200`}
							</code>
						</pre>
						<p className="mt-4 text-sm text-neutral-600">
							Same `.adraw` on the web canvas, in the desktop app, and from the CLI. If you outgrow
							the tool, you still own plain JSON.
						</p>
					</div>
				</div>
			</section>

			<section id="pricing" className="border-t border-neutral-200 bg-neutral-50 py-24 md:py-28">
				<div className="mx-auto max-w-6xl px-6">
					<div className="mx-auto max-w-3xl text-center">
						<h2
							className="text-3xl font-medium tracking-tight md:text-4xl"
							style={{
								fontFamily:
									"ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
							}}
						>
							Web or Mac
						</h2>
						<p className="mt-4 text-lg text-neutral-600">
							The browser canvas stays free. The Mac app is for people who want files on disk,
							offline work, and native export.
						</p>
					</div>
					<div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
						<div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-8">
							<h3 className="text-xl font-medium">Web</h3>
							<p className="mt-2 text-4xl font-medium tracking-tight">$0</p>
							<p className="mt-2 text-neutral-600">
								Full canvas in your browser. Share a link, drop a file, or paste a payload from the
								spec page.
							</p>
							<Button className="mt-8" size="lg" asChild>
								<a href="/app">Start free in browser</a>
							</Button>
						</div>
						<div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-8">
							<h3 className="text-xl font-medium">Mac</h3>
							<p className="mt-2 text-4xl font-medium tracking-tight">Coming soon</p>
							<p className="mt-2 text-neutral-600">
								Native app with licensing, real files on disk, offline edits, and export paths tuned
								for daily use. Paid when it launches.
							</p>
							<Button
								variant="outline"
								className="mt-8 gap-2"
								size="lg"
								disabled
								title="Coming soon"
							>
								<Download className="size-5 shrink-0" aria-hidden />
								Download for Mac
							</Button>
						</div>
					</div>
				</div>
			</section>
		</>
	);
}
