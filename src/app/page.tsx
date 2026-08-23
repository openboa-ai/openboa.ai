import { OpenBoaLanding } from "@/components/openboa-landing"

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.openboa.ai/#organization",
      name: "OpenBoa",
      url: "https://www.openboa.ai/",
      logo: {
        "@type": "ImageObject",
        url: "https://www.openboa.ai/icon-512.png",
        width: 512,
        height: 512,
      },
      description:
        "OpenBoa explores the horizon of human possibility through the Business of Agents.",
      sameAs: [
        "https://github.com/openboa-ai",
        "https://x.com/openboa_ai",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.openboa.ai/#website",
      url: "https://www.openboa.ai/",
      name: "OpenBoa",
      description: "Expanding the horizon of human possibility.",
      publisher: { "@id": "https://www.openboa.ai/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": "https://www.openboa.ai/#webpage",
      url: "https://www.openboa.ai/",
      name: "OpenBoa — Expanding the horizon of human possibility",
      isPartOf: { "@id": "https://www.openboa.ai/#website" },
      about: { "@id": "https://www.openboa.ai/#organization" },
      description:
        "OpenBoa explores this horizon through the Business of Agents.",
      inLanguage: "en",
    },
  ],
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <OpenBoaLanding />
    </>
  )
}
