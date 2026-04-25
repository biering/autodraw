import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Legal notice and service provider information for Autodraw (autodraw.ink).",
};

export default function ImprintPage() {
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
          Imprint
        </h1>
        <p className="mt-2 text-sm text-neutral-500">Legal notice</p>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">Service provider</h2>
          <p>
            Information under applicable law (for example, EU/EEA “Imprint” or provider identification
            requirements). Update this section with your legal name, registered address, and other details
            required in your jurisdiction.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">Contact</h2>
          <p>
            For legal notices and business inquiries, use the contact channel you publish for Autodraw (e.g. a
            support or legal email). Replace this paragraph once your contact information is final.
          </p>
        </section>

        <section className="mt-10 space-y-4 text-base leading-relaxed text-neutral-800">
          <h2 className="text-lg font-medium text-black">Liability for content</h2>
          <p>
            We make reasonable efforts to keep this website accurate. We are not liable for third-party content
            or links we do not control. External links are provided for convenience; the respective operators are
            responsible for their own sites.
          </p>
        </section>

        <p className="mt-16 text-sm text-neutral-500">
          <Link className="text-black underline underline-offset-4" href="/privacy">
            Privacy
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
    <Link
      href={href}
      className="text-sm font-normal text-neutral-600 hover:text-black"
    >
      {children}
    </Link>
  );
}
