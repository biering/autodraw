import Image from "next/image";
import Link from "next/link";
import { Check, Command, Download, Heart, Layers, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroDiagramPreview } from "./components/HeroDiagramPreview";

/** Update when you ship a DMG or use a stable release asset URL. */
const MAC_DOWNLOAD_URL = "https://github.com/biering/autodraw/releases";

export default function Home() {
  return (
    <div className="flex min-h-full flex-col bg-white text-black">
      <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 text-lg font-medium tracking-tight">
            <Image
              src="/img/logo-autodraw.png"
              alt="autodraw logo"
              width={28}
              height={28}
              className="size-8 shrink-0 rounded-lg"
              priority
            />
            <span>Autodraw</span>
          </Link>
          <nav className="hidden items-center gap-8 text-base font-normal text-neutral-700 md:flex">
            <a className="hover:text-black" href="#features">
              Features
            </a>
            <a className="hover:text-black" href="#workflow">
              Workflow
            </a>
            <a className="hover:text-black" href="#pricing">
              Pricing
            </a>
            <Link className="hover:text-black" href="/spec">
              Spec
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <a href={MAC_DOWNLOAD_URL} rel="noopener noreferrer" target="_blank">
                Download for Mac
              </a>
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/app">Open in web</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center md:mb-8" aria-hidden>
              <Image
                src="/img/logo-autodraw.png"
                alt="autodraw logo"
                width={200}
                height={200}
                className="h-20 w-20 object-contain md:h-28 md:w-28 rounded-2xl"
                priority
              />
            </div>
            <h1
              className="text-balance text-5xl font-medium leading-none tracking-tight text-black md:text-7xl"
              style={{
                fontFamily:
                  "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
              }}
            >
              Autodraw
            </h1>
            <p className="mx-auto mt-8 max-w-xl text-balance text-lg font-normal leading-snug text-neutral-700 md:text-xl">
              Sketch the diagram. Hand off the <code className="font-mono text-base text-neutral-800">.adraw</code>{" "}
              file. Let agents and teammates follow along—that&apos;s it. That&apos;s the loop.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Button size="lg" className="gap-2 px-8" asChild>
                <a href={MAC_DOWNLOAD_URL} rel="noopener noreferrer" target="_blank">
                  <Download className="size-5 shrink-0" aria-hidden />
                  Download for Mac
                </a>
              </Button>
              <Button variant="secondary" size="lg" className="px-8" asChild>
                <Link href="/app">Open in web</Link>
              </Button>
            </div>
          </div>
        </section>

        <HeroDiagramPreview />

        <section id="features" className="bg-neutral-50 py-24 md:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-3 md:gap-10">
            {[
              {
                title: "Clarity by default",
                body: "Grayscale-first UI so your diagram stays the hero—no noisy chrome, no gradients.",
                icon: Layers,
              },
              {
                title: "Built for iteration",
                body: "Keyboard-first editing, snapping, and undo-friendly moves so you stay in flow.",
                icon: Command,
              },
              {
                title: "Agents + humans",
                body: "Pair the free canvas with the `autodraw` CLI for CI, bots, and repo-native diagrams.",
                icon: Sparkles,
              },
            ].map(({ title, body, icon: Icon }) => (
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
                From blank canvas to PR comment in minutes
              </h2>
              <ul className="mt-8 space-y-4 text-base leading-relaxed text-neutral-700">
                {[
                  "Drop nodes, connect edges, name what matters—no diagram gymnastics.",
                  "Export or script with the CLI when you need SVG/PNG/PDF in CI.",
                  "Mac app adds native open/save, offline work, and pro export paths.",
                ].map((t) => (
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
                Same `.adraw` format in the web canvas, desktop app, and CLI—no lock-in.
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
                Simple pricing story
              </h2>
              <p className="mt-4 text-lg text-neutral-600">
                The web app stays free forever. The Mac app is a paid product for professionals who want native
                performance and file workflows.
              </p>
            </div>
            <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
              <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-8">
                <h3 className="text-xl font-medium">Web</h3>
                <p className="mt-2 text-4xl font-medium tracking-tight">$0</p>
                <p className="mt-2 text-neutral-600">Full canvas in your browser. Great for sharing and quick drafts.</p>
                <Button className="mt-8" size="lg" asChild>
                  <Link href="/app">Open /app</Link>
                </Button>
              </div>
              <div className="flex flex-col rounded-xl border border-neutral-200 bg-white p-8">
                <h3 className="text-xl font-medium">Mac</h3>
                <p className="mt-2 text-4xl font-medium tracking-tight">Paid</p>
                <p className="mt-2 text-neutral-600">
                  Native app with licensing, disk workflows, and export paths tuned for daily use.
                </p>
                <Button variant="outline" className="mt-8 gap-2" size="lg" asChild>
                  <a href={MAC_DOWNLOAD_URL} rel="noopener noreferrer" target="_blank">
                    <Download className="size-5 shrink-0" aria-hidden />
                    Download for Mac
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-neutral-200 bg-white py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-8 px-6 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <Image
                src="/img/logo-autodraw.png"
                alt=""
                width={28}
                height={28}
                className="size-7 shrink-0 rounded-lg"
              />
              <p className="text-base font-medium text-black">Autodraw</p>
            </div>
            <p className="mt-1 text-sm text-neutral-600">Diagram canvas · autodraw.ink</p>
            <p className="mt-3 flex max-w-md items-center gap-1 text-sm text-neutral-500">
              <span>Made with</span>
              <Heart className="size-4 fill-pink-400 text-pink-500" aria-hidden />
              <span>by</span>
              <a className="text-black underline underline-offset-4 hover:text-neutral-700" href="https://github.com/biering">
                Christoph Biering
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm text-neutral-600 md:items-end">
            <Link className="hover:text-black" href="/app">
              Web app
            </Link>
            <Link className="hover:text-black" href="/spec">
              .adraw spec
            </Link>
            <a className="hover:text-black" href="https://github.com/biering/autodraw" rel="noopener noreferrer">
              Source
            </a>
            <Link className="hover:text-black" href="/imprint">
              Imprint
            </Link>
            <Link className="hover:text-black" href="/privacy">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
