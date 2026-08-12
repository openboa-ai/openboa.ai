import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://openboa.ai/",
      lastModified: new Date("2026-08-12T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 1,
      images: ["https://openboa.ai/openboa-open-graph.png"],
    },
  ]
}
