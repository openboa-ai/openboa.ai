import type { MetadataRoute } from "next";
import { OPENBOA_COLORS } from "@/design-system/generated/openboa-token-values";
import { OPENBOA_VISION } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `OpenBoa — ${OPENBOA_VISION.headline}`,
    short_name: "OpenBoa",
    description: OPENBOA_VISION.statement,
    start_url: "/",
    display: "standalone",
    background_color: OPENBOA_COLORS.surfaceLight,
    theme_color: OPENBOA_COLORS.brandInkLight,
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/maskable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
