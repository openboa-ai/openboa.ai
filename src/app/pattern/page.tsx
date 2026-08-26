import type { Metadata } from "next"
import { OpenBoaVisionLab } from "@/components/openboa-vision-lab"

export const metadata: Metadata = {
  title: "Pattern behavior study",
  robots: { index: false, follow: false },
}

export default function PatternPage() {
  return <OpenBoaVisionLab />
}
