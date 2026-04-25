import type { Metadata } from "next";
import "./globals.css";
import "@xyflow/react/dist/style.css";

const siteUrl = "https://autodraw.ink";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Autodraw — Diagram canvas for agents & teams",
    template: "%s · Autodraw",
  },
  description:
    "Ship clear architecture diagrams fast. Free web canvas at autodraw.ink; native Mac app with offline files and pro export (paid). CLI for agents and CI.",
  applicationName: "Autodraw",
  keywords: [
    "diagram",
    "architecture diagram",
    "flowchart",
    "React Flow",
    "agents",
    "CLI",
    "Autodraw",
    "adraw",
  ],
  authors: [{ name: "Autodraw" }],
  creator: "Autodraw",
  publisher: "Autodraw",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Autodraw",
    title: "Autodraw — Diagram canvas for agents & teams",
    description:
      "Free web diagram editor. Native Mac app for serious work. CLI for automation. Built for clarity, speed, and agents.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Autodraw — Diagram canvas for agents & teams",
    description:
      "Free web diagram editor. Native Mac app for serious work. CLI for automation. Built for clarity, speed, and agents.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Autodraw",
  url: siteUrl,
  applicationCategory: "DesignApplication",
  operatingSystem: "Web, macOS",
  description:
    "Diagram editor with a free web canvas and a paid native Mac app. Includes a CLI for agents and CI.",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      name: "Autodraw Web",
      description: "Free in-browser diagram canvas at /app.",
    },
    {
      "@type": "Offer",
      priceCurrency: "USD",
      name: "Autodraw for Mac",
      description: "Native desktop app with licensing — paid product.",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {children}
      </body>
    </html>
  );
}
