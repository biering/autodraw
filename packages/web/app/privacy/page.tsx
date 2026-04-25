import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Autodraw (autodraw.ink) handles data when you use the site and web app.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-full bg-white text-black">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="text-base font-medium tracking-tight">
            Autodraw
          </Link>
          <ButtonLink href="/">Home</ButtonLink>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-6 py-12 pb-24">
        <h1
          className="text-3xl font-medium tracking-tight"
          style={{
            fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, sans-serif",
          }}
        >
          Privacy
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Autodraw · autodraw.ink</p>

        <p className="mt-8 text-base leading-relaxed text-neutral-800">
          This is a high-level description of how the service may process data. Replace or extend it with a
          policy that matches your hosting, analytics, and payment setup. When in doubt, work with legal counsel
          for your country and the regions where you have users.
        </p>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">What this site is</h2>
          <p>
            The marketing site and the free in-browser editor at <code className="font-mono text-sm">/app</code> are
            designed so diagram content stays in your browser unless you export or copy it. The Mac app is a
            separate native product; its terms and data practices may differ (see app documentation and your
            purchase flow).
          </p>
        </section>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">Data we may process</h2>
          <ul className="list-inside list-disc space-y-2 pl-1">
            <li>
              <strong className="font-medium text-black">Server and hosting</strong> — The operator of this site
              may process technical data required to deliver pages and protect the service (for example, IP
              address, time, and request metadata), depending on your hosting provider.
            </li>
            <li>
              <strong className="font-medium text-black">Local storage</strong> — The web editor may use
              browser storage (such as <code className="font-mono text-sm">localStorage</code>) to remember
              settings like theme. Diagram files are not uploaded to us simply by using the free web canvas
              unless you choose a feature that explicitly sends data to a server.
            </li>
            <li>
              <strong className="font-medium text-black">Share links</strong> — Diagrams in share URLs
              (for example <code className="font-mono text-sm">?d=</code> on <code className="font-mono text-sm">/v</code> and{" "}
              <code className="font-mono text-sm">/app</code>) are encoded in the URL. Anyone with the link can
              view that payload; treat long URLs like sensitive content you choose to share.
            </li>
            <li>
              <strong className="font-medium text-black">Purchases and licensing</strong> — If you buy the Mac
              app or a license, payment and customer data are handled by the payment provider and tools you
              configure; describe those processors here when final.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">Your choices</h2>
          <p>
            You can clear site data in your browser settings, avoid sharing diagram URLs you consider sensitive,
            and use local files with the native app or CLI when you want workflows that stay on your machine.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">Contact</h2>
          <p>
            For privacy requests, add a contact point you monitor (e.g. privacy@your-domain). This placeholder
            should be updated before production use.
          </p>
        </section>

        <p className="mt-16 text-sm text-neutral-500">
          <Link className="text-black underline underline-offset-4" href="/imprint">
            Imprint
          </Link>
          {" · "}
          <Link className="text-black underline underline-offset-4" href="/">
            Home
          </Link>
        </p>
      </article>
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-sm font-normal text-neutral-600 hover:text-black">
      {children}
    </Link>
  );
}
