import type { Metadata } from "next"
import localFont from "next/font/local"
import { OpenBoaExperience } from "@/components/openboa-experience"
import "@/design-system/generated/openboa-tokens.css"
import "./globals.css"

const martianGrotesk = localFont({
  src: "../../public/fonts/MartianGrotesk-wdth-wght.ttf",
  variable: "--font-martian-grotesk",
  display: "swap",
  weight: "100 1000",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.openboa.ai"),
  title: {
    default: "OpenBoa — Expanding the horizon of human possibility",
    template: "%s — OpenBoa",
  },
  description:
    "OpenBoa explores the horizon of human possibility through the Business of Agents.",
  applicationName: "OpenBoa",
  authors: [{ name: "OpenBoa", url: "https://www.openboa.ai" }],
  creator: "OpenBoa",
  publisher: "OpenBoa",
  category: "technology",
  keywords: [
    "OpenBoa",
    "Business of Agents",
    "agent-native business",
    "AI agents",
    "human possibility",
    "human creation",
  ],
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
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
    title: "OpenBoa — Expanding the horizon of human possibility",
    description:
      "OpenBoa explores this horizon through the Business of Agents.",
    url: "https://www.openboa.ai",
    siteName: "OpenBoa",
    locale: "en_US",
    images: [
      {
        url: "/openboa-open-graph.png",
        width: 1200,
        height: 630,
        alt: "OpenBoa — Expanding the horizon of human possibility",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenBoa — Expanding the horizon of human possibility",
    description:
      "OpenBoa explores this horizon through the Business of Agents.",
    images: ["/openboa-open-graph.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className={martianGrotesk.variable}>
        <OpenBoaExperience>{children}</OpenBoaExperience>
      </body>
    </html>
  )
}
