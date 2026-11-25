import type { Metadata } from "next";
import { OPENBOA_VISION } from "@/lib/brand";
import { OpenBoaApproachView } from "@/components/openboa-approach-view";

export const metadata: Metadata = {
  title: "Approach",
  description: OPENBOA_VISION.approach.lead,
  alternates: {
    canonical: "/approach",
  },
  openGraph: {
    title: "Approach — OpenBoa",
    description: OPENBOA_VISION.approach.lead,
    url: "/approach",
  },
};

export default function ApproachPage() {
  return <OpenBoaApproachView />;
}
