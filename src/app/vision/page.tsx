import type { Metadata } from "next";
import { OPENBOA_VISION } from "@/lib/brand";
import { OpenBoaVisionView } from "@/components/openboa-vision-view";

export const metadata: Metadata = {
  title: "Vision",
  description: `${OPENBOA_VISION.headline} ${OPENBOA_VISION.statement}`,
  alternates: {
    canonical: "/vision",
  },
  openGraph: {
    title: "Vision — OpenBoa",
    description: `${OPENBOA_VISION.headline} ${OPENBOA_VISION.statement}`,
    url: "/vision",
  },
};

export default function VisionPage() {
  return <OpenBoaVisionView />;
}
