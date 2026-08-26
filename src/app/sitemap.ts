import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.openboa.ai/",
      lastModified: new Date("2026-08-24T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 1,
      images: ["https://www.openboa.ai/openboa-open-graph.png"],
    },
    {
      url: "https://www.openboa.ai/vision",
      lastModified: new Date("2026-08-24T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.openboa.ai/about",
      lastModified: new Date("2026-08-24T00:00:00.000Z"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ]
}
