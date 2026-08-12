import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"

const martianGrotesk = localFont({
  src: "../../public/fonts/MartianGrotesk-wdth-wght.ttf",
  variable: "--font-martian-grotesk",
  display: "swap",
  weight: "100 1000",
})

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  display: "swap",
  weight: "45 920",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.openboa.ai"),
  title: {
    default: "OpenBoa — Business of Agents",
    template: "%s — OpenBoa",
  },
  description:
    "OpenBoa builds products that let agents remember, evaluate, coordinate, and act.",
  applicationName: "OpenBoa",
  authors: [{ name: "OpenBoa", url: "https://www.openboa.ai" }],
  creator: "OpenBoa",
  publisher: "OpenBoa",
  category: "technology",
  keywords: [
    "OpenBoa",
    "Business of Agents",
    "agent-native products",
    "AI agents",
    "agent memory",
    "agent evaluation",
    "agent coordination",
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
    title: "OpenBoa — Business of Agents",
    description:
      "Agents are becoming participants in business. OpenBoa builds the products that let them remember, evaluate, coordinate, and act.",
    url: "https://www.openboa.ai",
    siteName: "OpenBoa",
    locale: "en_US",
    images: [
      {
        url: "/openboa-open-graph.png",
        width: 1200,
        height: 630,
        alt: "OpenBoa — Business of Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenBoa — Business of Agents",
    description:
      "Agents are becoming participants in business. OpenBoa builds agent-native products.",
    images: ["/openboa-open-graph.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${martianGrotesk.variable} ${pretendard.variable}`}>
        {children}
      </body>
    </html>
  )
}
