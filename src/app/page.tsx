import Image from "next/image"
import Link from "next/link"

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
        "OpenBoa is an agent-native product organization building products for the Business of Agents.",
      sameAs: ["https://github.com/openboa-ai"],
    },
    {
      "@type": "WebSite",
      "@id": "https://www.openboa.ai/#website",
      url: "https://www.openboa.ai/",
      name: "OpenBoa",
      description:
        "OpenBoa builds products that let agents remember, evaluate, coordinate, and act.",
      publisher: { "@id": "https://www.openboa.ai/#organization" },
      inLanguage: "en",
    },
    {
      "@type": "WebPage",
      "@id": "https://www.openboa.ai/#webpage",
      url: "https://www.openboa.ai/",
      name: "OpenBoa — Business of Agents",
      isPartOf: { "@id": "https://www.openboa.ai/#website" },
      about: { "@id": "https://www.openboa.ai/#organization" },
      description:
        "Agents are becoming participants in business. OpenBoa builds the products that let them remember, evaluate, coordinate, and act.",
      inLanguage: "en",
    },
  ],
}

export default function Home() {
  return (
    <main className="landing-stage">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="landing-frame">
        <Image
          className="scale-field"
          src="/openboa-scale-field.png"
          width={1487}
          height={1058}
          alt=""
          aria-hidden="true"
          draggable={false}
          priority
          unoptimized
        />

        <header className="site-header">
          <Link className="brand" href="/" aria-label="OpenBoa home">
            <Image
              src="/openboa-logo-horizontal.png"
              width={320}
              height={79}
              alt="OpenBoa"
              priority
              unoptimized
            />
          </Link>

          <nav className="site-nav" aria-label="Primary navigation">
            <a href="#approach">Approach</a>
            <a href="#notes">Notes</a>
            <details className="projects-menu">
              <summary>Projects</summary>
              <div className="projects-popover">
                <a href="https://github.com/openboa-ai/coffee-chat">coffee-chat</a>
                <a href="https://github.com/openboa-ai/coffee-chat-eval">coffee-chat-eval</a>
              </div>
            </details>
            <a href="https://github.com/openboa-ai">GitHub</a>
          </nav>
        </header>

        <section className="hero" id="approach">
          <h1>Business of Agents</h1>
          <p>
            Agents are becoming participants in business.
            <br />
            OpenBoa builds the products that let them
            <br />
            remember, evaluate, coordinate, and act.
          </p>
          <a className="approach-link" href="#approach-note">
            Read our approach <span aria-hidden="true">→</span>
          </a>
        </section>

        <section className="sr-only" id="approach-note">
          <h2>Our approach</h2>
          <p>
            OpenBoa builds agent-native products around durable memory,
            evaluation, coordination, and action.
          </p>
        </section>
        <div className="sr-only" id="notes">OpenBoa notes</div>
      </div>
    </main>
  )
}
