import type { Metadata } from "next";
import Link from "next/link";
import { defaultStyleId, emptyDiagram, relationshipPresets } from "@autodraw/core";
import { encodeDiagramSharePayload } from "@autodraw/editor/share-payload";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: ".adraw v1 spec · Autodraw",
  description: "Diagram file format, palettes, relationship presets, and share links for agents.",
};

const PALETTES = ["universal", "grayscale", "flowchart", "empty"] as const;

function buildDemoPayload(): string {
  const d = emptyDiagram("universal");
  d.name = "Agent demo";
  d.nodes.push({
    id: "demo-node-1",
    text: "Start here",
    x: 220,
    y: 220,
    w: 160,
    h: 72,
    styleId: defaultStyleId(d.palette),
    shape: "roundedRect",
  });
  d.nodes.push({
    id: "demo-node-2",
    text: "Next step",
    x: 480,
    y: 240,
    w: 160,
    h: 72,
    styleId: defaultStyleId(d.palette),
  });
  d.edges.push({
    id: "demo-edge-1",
    from: "demo-node-1",
    to: "demo-node-2",
    routing: "orthogonal",
    dash: "solid",
    head: "lineArrow",
    tail: "none",
    label: "",
    strokeWidth: 1,
    relationshipPreset: 1,
  });
  return encodeDiagramSharePayload(d);
}

export default function SpecPage() {
  const demoD = buildDemoPayload();
  const demoViewerHref = `/v?d=${encodeURIComponent(demoD)}`;
  const demoAppHref = `/app?d=${encodeURIComponent(demoD)}`;

  return (
    <div className="min-h-full bg-white text-black">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="text-base font-medium tracking-tight">
            Autodraw
          </Link>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" asChild>
              <Link href={demoViewerHref}>
                Demo <span className="hidden sm:inline">viewer</span>
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/app">Editor</Link>
            </Button>
          </div>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <h1
          className="text-4xl font-medium tracking-tight"
          style={{
            fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
          }}
        >
          .adraw diagram v1
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-neutral-600">
          UTF-8 JSON used by the web editor, Mac app, <code className="font-mono text-neutral-800">autodraw</code>{" "}
          CLI, and <code className="font-mono text-neutral-800">@autodraw/mcp</code>. Validated by{" "}
          <code className="font-mono text-neutral-800">parseDiagram</code> in{" "}
          <code className="font-mono text-neutral-800">@autodraw/core</code>.
        </p>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Top-level object</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-neutral-700">
            <li>
              <code className="font-mono text-sm">version</code> — must be <code className="font-mono">1</code>
            </li>
            <li>
              <code className="font-mono text-sm">name</code> — user-visible title (string, max 256 chars)
            </li>
            <li>
              <code className="font-mono text-sm">palette</code> — one of:{" "}
              {PALETTES.map((p) => (
                <code key={p} className="mr-1 font-mono text-sm">
                  {p}
                </code>
              ))}
            </li>
            <li>
              <code className="font-mono text-sm">canvas</code> —{" "}
              <code className="font-mono text-sm">{"{ showGrid, gridSpacing, zoom }"}</code>
            </li>
            <li>
              <code className="font-mono text-sm">nodes</code> — array of node records
            </li>
            <li>
              <code className="font-mono text-sm">edges</code> — array of edge records
            </li>
            <li>
              <code className="font-mono text-sm">customStyles</code> — optional array of style definitions (advanced)
            </li>
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Node record</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-neutral-800 md:text-sm">
            {`{
  "id": "string",
  "text": "string",
  "x": 0, "y": 0, "w": 160, "h": 72,
  "styleId": "yellow",
  "shape": "roundedRect"   // optional; one of:
  // rectangle | roundedRect | oval | circle | diamond | hexagon | octagon | parallelogram
}`}
          </pre>
          <p className="mt-3 text-sm text-neutral-600">
            <code className="font-mono">styleId</code> must exist in the resolved palette (built-in palette styles +{" "}
            <code className="font-mono">customStyles</code>).
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Edge record</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-neutral-800 md:text-sm">
            {`{
  "id": "string",
  "from": "sourceNodeId",
  "to": "targetNodeId",
  "routing": "orthogonal",  // straight | orthogonal | curved
  "dash": "solid",          // solid | dashed | dotted
  "head": "lineArrow",      // none | lineArrow | triangleArrow | triangleReversed | circle | diamond
  "tail": "none",
  "label": "",
  "strokeWidth": 1,
  "sourceHandle": "src",    // optional React Flow handle id
  "targetHandle": "tgt",
  "relationshipPreset": 1  // optional 0–7; aligns with editor presets
}`}
          </pre>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Relationship presets (0–7)</h2>
          <p className="mt-3 text-neutral-600">
            Use <code className="font-mono text-sm">relationshipPreset</code> or the CLI / MCP{" "}
            <code className="font-mono text-sm">--preset</code> / <code className="font-mono text-sm">preset</code>{" "}
            field. Each index maps to styling (routing, dash, markers, stroke width).
          </p>
          <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full min-w-lg text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 font-medium text-neutral-900">
                <tr>
                  <th className="px-4 py-2">Index</th>
                  <th className="px-4 py-2">Id</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                {relationshipPresets.map((id, i) => (
                  <tr key={id}>
                    <td className="px-4 py-2 font-mono">{i}</td>
                    <td className="px-4 py-2 font-mono text-xs md:text-sm">{id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Share links (inline payload)</h2>
          <p className="mt-3 text-neutral-600">
            Encode the full diagram JSON with <strong>gzip</strong>, then <strong>base64url</strong> (no padding). Pass
            the result as query param <code className="font-mono text-sm">d</code>:
          </p>
          <ul className="mt-3 list-inside list-disc space-y-2 text-neutral-700">
            <li>
              Read-only: <code className="font-mono text-sm">/v?d=…</code>
            </li>
            <li>
              Free editor: <code className="font-mono text-sm">/app?d=…</code> (payload is stripped after load)
            </li>
          </ul>
          <p className="mt-4 text-sm text-neutral-600">
            In TypeScript, use <code className="font-mono">encodeDiagramSharePayload</code> /{" "}
            <code className="font-mono">decodeDiagramSharePayload</code> from{" "}
            <code className="font-mono">@autodraw/editor</code>. Very large diagrams may exceed URL length limits in
            some browsers—then use a downloadable <code className="font-mono">.adraw</code> file instead.
          </p>
          <p className="mt-6">
            <Button asChild>
              <Link href={demoViewerHref}>Open demo in viewer</Link>
            </Button>
            <Button variant="secondary" className="ml-2" asChild>
              <Link href={demoAppHref}>Open demo in editor</Link>
            </Button>
          </p>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Minimal example (JSON)</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-xs leading-relaxed text-neutral-800 md:text-sm">
            {JSON.stringify(
              {
                version: 1,
                name: "Minimal",
                palette: "universal",
                canvas: { showGrid: true, gridSpacing: 16, zoom: 1 },
                nodes: [
                  {
                    id: "a",
                    text: "A",
                    x: 200,
                    y: 200,
                    w: 140,
                    h: 64,
                    styleId: "yellow",
                  },
                  {
                    id: "b",
                    text: "B",
                    x: 420,
                    y: 220,
                    w: 140,
                    h: 64,
                    styleId: "blue",
                  },
                ],
                edges: [
                  {
                    id: "e1",
                    from: "a",
                    to: "b",
                    routing: "orthogonal",
                    dash: "solid",
                    head: "lineArrow",
                    tail: "none",
                    label: "",
                    strokeWidth: 1,
                  },
                ],
              },
              null,
              2,
            )}
          </pre>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-medium tracking-tight">Cloud agent system prompt (SKILL)</h2>
          <p className="mt-3 text-neutral-600">
            Paste the block below into a Custom GPT, Claude Project, or similar. The model emits valid{" "}
            <code className="font-mono">.adraw</code> JSON; the user opens it in Autodraw or saves it as a file.
          </p>
          <pre className="mt-4 max-h-112 overflow-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-[11px] leading-relaxed text-neutral-800 md:text-xs">
            {`You are helping the user with Autodraw diagram files (.adraw v1).

OUTPUT RULES:
- When the user wants a diagram, output a SINGLE JSON object only (no markdown fences unless they ask).
- The object MUST satisfy diagram v1:
  - version: 1 (number)
  - name: short string (max 256 chars)
  - palette: one of "universal" | "grayscale" | "flowchart" | "empty"
  - canvas: { "showGrid": boolean, "gridSpacing": number, "zoom": number }
  - nodes: array of { id, text, x, y, w, h, styleId, shape? }
  - edges: array of { id, from, to, routing, dash, head, tail, label, strokeWidth?, sourceHandle?, targetHandle?, relationshipPreset? }

NODE shapes (optional): rectangle | roundedRect | oval | circle | diamond | hexagon | octagon | parallelogram

EDGE routing: straight | orthogonal | curved
EDGE dash: solid | dashed | dotted
EDGE head/tail: none | lineArrow | triangleArrow | triangleReversed | circle | diamond

For consistent relationship styling you MAY set relationshipPreset to an integer 0–7 instead of hand-picking routing/dash/head/tail:
0 straight solid open head
1 orthogonal solid open head
2 orthogonal bold open head
3 orthogonal double arrow
4 orthogonal dashed open head
5 dashed with diamond tail
6 orthogonal dashed diamond head
7 orthogonal dotted open head

STYLE IDs: for palette "universal", common styleIds include yellow, orange, pink, blue, green, lime, gray (see Autodraw spec page).

SHARING: After emitting JSON, tell the user they can:
- Save as file.adraw and open in the Autodraw Mac app or import in the web editor, OR
- Use Autodraw share encoding (gzip JSON + base64url) as query param d on https://autodraw.ink/v or /app if they have a tool that encodes it.

Never invent binary file contents; always use structured JSON for .adraw v1.`}
          </pre>
        </section>

        <p className="mt-16 text-sm text-neutral-500">
          <Link className="text-black underline underline-offset-4" href="/">
            ← Home
          </Link>
        </p>
      </article>
    </div>
  );
}
