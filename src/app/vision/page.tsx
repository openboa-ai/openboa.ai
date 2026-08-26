import type { Metadata } from "next"
import { OpenBoaVision } from "@/components/openboa-vision"

export const metadata: Metadata = {
  title: "Vision",
  description:
    "Humanity is defined not only by what it can understand, but by what it can imagine and realize.",
  alternates: { canonical: "/vision" },
}

export default function VisionPage() {
  return <OpenBoaVision />
}
