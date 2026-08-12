import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OpenBoa — Business of Agents",
    short_name: "OpenBoa",
    description:
      "OpenBoa builds products that let agents remember, evaluate, coordinate, and act.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F8F5",
    theme_color: "#F8F8F5",
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
  }
}
