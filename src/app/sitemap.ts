import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/brand";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-11-25T00:00:00.000Z");
  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${SITE_URL}/openboa-open-graph.png`],
    },
    {
      url: `${SITE_URL}/approach`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/vision`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
