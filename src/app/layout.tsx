import type { Metadata } from "next"
import { Manrope, Space_Grotesk } from "next/font/google"

import "./globals.css"

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
})

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL("https://openboa.ai"),
  title: {
    default: "openboa - Business as Agent",
    template: "%s | openboa",
  },
  description:
    "openboa is an open-source runtime for Business as Agent (boa): durable business identity, evolvable agents, and governance-first autonomy.",
  openGraph: {
    type: "website",
    title: "openboa - Business as Agent",
    description:
      "A deployable business of agents with continuity, governance, and shared memory built in from day one.",
    url: "https://openboa.ai",
    siteName: "openboa",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "openboa - Business as Agent",
    description:
      "A deployable business of agents with governance-first autonomy.",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
