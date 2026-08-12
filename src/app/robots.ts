import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: ["GPTBot", "OAI-SearchBot", "ChatGPT-User"],
        allow: "/",
      },
    ],
    sitemap: "https://www.openboa.ai/sitemap.xml",
    host: "https://www.openboa.ai",
  }
}
