import type { Metadata } from "next";
import localFont from "next/font/local";
import { OpenBoaProvider } from "@/components/openboa-context";
import { OpenBoaShell } from "@/components/openboa-shell";
import { EXTERNAL_LINKS, OPENBOA_VISION, SITE_URL } from "@/lib/brand";
import "@/design-system/generated/openboa-tokens.css";
import "./globals.css";

const rethinkSans = localFont({
  src: [
    {
      path: "../../public/fonts/rethink-sans/rethink-sans.woff2",
      weight: "400 800",
      style: "normal",
    },
    {
      path: "../../public/fonts/rethink-sans/rethink-sans-italic.woff2",
      weight: "400 800",
      style: "italic",
    },
  ],
  variable: "--font-rethink-sans",
  display: "swap",
});

const SITE_TITLE = `OpenBoa — ${OPENBOA_VISION.headline}`;
const SITE_DESCRIPTION = OPENBOA_VISION.statement;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s — OpenBoa",
  },
  description: SITE_DESCRIPTION,
  applicationName: "OpenBoa",
  authors: [{ name: "OpenBoa", url: SITE_URL }],
  creator: "OpenBoa",
  publisher: "OpenBoa",
  category: "technology",
  keywords: [
    "OpenBoa",
    "Business of Agents",
    "Every limit has a shelf life",
    "human imagination",
    "autonomous systems",
    "open source",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "OpenBoa",
    locale: "en_US",
    images: [
      {
        url: "/openboa-open-graph.png",
        width: 1200,
        height: 630,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/openboa-open-graph.png"],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "OpenBoa",
      knowsAbout: "Business of Agents",
      slogan: OPENBOA_VISION.headline,
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: SITE_DESCRIPTION,
      sameAs: [EXTERNAL_LINKS.github, EXTERNAL_LINKS.x],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "OpenBoa",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${rethinkSans.variable} yg-root`}
      data-appearance="light"
      suppressHydrationWarning
    >
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <OpenBoaProvider>
          <OpenBoaShell>{children}</OpenBoaShell>
        </OpenBoaProvider>
      </body>
    </html>
  );
}
