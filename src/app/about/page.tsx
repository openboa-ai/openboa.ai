import type { Metadata } from "next"
import { OpenBoaAbout } from "@/components/openboa-about"

export const metadata: Metadata = {
  title: "About",
  description: "OpenBoa develops AI-native businesses and products.",
  alternates: { canonical: "/about" },
}

export default function AboutPage() {
  return <OpenBoaAbout />
}
