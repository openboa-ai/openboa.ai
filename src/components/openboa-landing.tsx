"use client"

import Image from "next/image"
import { useEffect, useRef } from "react"
import { mountScaleField } from "@/lib/openboa/scale-field"

const products = [
  {
    name: "Ouroboros",
    description: "An agent-native quantitative firm",
    href: "https://github.com/openboa-ai/ouroboros",
  },
  {
    name: "Coffee Chat",
    description: "Giving agents a sense of what matters to you",
    href: "https://github.com/openboa-ai/coffee-chat",
  },
]

export function OpenBoaLanding() {
  const rootRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const quietFieldRef = useRef<HTMLDivElement>(null)
  const brandLogoRef = useRef<HTMLImageElement>(null)
  const siteNavRef = useRef<HTMLElement>(null)
  const projectsMenuRef = useRef<HTMLDetailsElement>(null)
  const projectsSummaryRef = useRef<HTMLElement>(null)
  const projectsLabelRef = useRef<HTMLSpanElement>(null)
  const projectsPopoverRef = useRef<HTMLDivElement>(null)
  const philosophyRef = useRef<HTMLElement>(null)
  const siteFootnoteRef = useRef<HTMLElement>(null)
  const siteSocialRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const elements = {
      root: rootRef.current,
      canvas: canvasRef.current,
      quietField: quietFieldRef.current,
      brandLogo: brandLogoRef.current,
      siteNav: siteNavRef.current,
      projectsMenu: projectsMenuRef.current,
      projectsSummary: projectsSummaryRef.current,
      projectsLabel: projectsLabelRef.current,
      projectsPopover: projectsPopoverRef.current,
      philosophy: philosophyRef.current,
      siteFootnote: siteFootnoteRef.current,
      siteSocial: siteSocialRef.current,
    }
    if (Object.values(elements).some((element) => element === null)) return
    return mountScaleField(elements as {
      root: HTMLElement
      canvas: HTMLCanvasElement
      quietField: HTMLElement
      brandLogo: HTMLImageElement
      siteNav: HTMLElement
      projectsMenu: HTMLDetailsElement
      projectsSummary: HTMLElement
      projectsLabel: HTMLElement
      projectsPopover: HTMLElement
      philosophy: HTMLElement
      siteFootnote: HTMLElement
      siteSocial: HTMLElement
    })
  }, [])

  return (
    <main
      id="top"
      className="landing"
      aria-label="OpenBoa philosophy landing"
      ref={rootRef}
    >
      <canvas id="field" ref={canvasRef} aria-hidden="true" />
      <div className="edge-veil" aria-hidden="true" />
      <div className="quiet-field" ref={quietFieldRef} aria-hidden="true" />

      <header className="site-header">
        <a className="brand" href="#top" aria-label="OpenBoa home">
          <Image
            ref={brandLogoRef}
            src="/openboa-logo-horizontal.png"
            width={320}
            height={79}
            alt="OpenBoa"
            priority
            unoptimized
          />
        </a>

        <nav className="site-nav" ref={siteNavRef} aria-label="Primary navigation">
          <a href="#vision">Vision</a>
          <details className="projects-menu" ref={projectsMenuRef}>
            <summary ref={projectsSummaryRef}>
              <span ref={projectsLabelRef}>Products</span>
              <Image
                className="menu-chevron"
                src="/icons/chevron-down.svg"
                width={16}
                height={16}
                alt=""
                aria-hidden="true"
                unoptimized
              />
            </summary>
            <div className="projects-popover" ref={projectsPopoverRef}>
              {products.map((product) => (
                <a
                  key={product.name}
                  href={product.href}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <span className="product-name">{product.name}</span>
                  <span className="product-description">{product.description}</span>
                </a>
              ))}
            </div>
          </details>
          <a href="#about">About</a>
        </nav>
      </header>

      <section id="vision" className="philosophy" ref={philosophyRef}>
        <h1>
          Expanding the horizon of
          <br />
          human possibility
        </h1>
        <p className="context">
          OpenBoa explores this horizon through the Business of Agents
        </p>
      </section>

      <section id="about" className="sr-only" aria-labelledby="about-title">
        <h2 id="about-title">About OpenBoa</h2>
        <p>
          Agents are expanding the scope of human creation. OpenBoa explores
          this new horizon through the Business of Agents.
        </p>
      </section>

      <footer
        className="site-footnote"
        ref={siteFootnoteRef}
        aria-label="OpenBoa location and copyright"
      >
        <span>Seoul, Korea</span>
        <span>© 2026 OpenBoa</span>
      </footer>

      <nav className="site-social" ref={siteSocialRef} aria-label="OpenBoa social links">
        <a
          className="social-link--github"
          href="https://github.com/openboa-ai"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="OpenBoa on GitHub"
        >
          <span className="social-icon" aria-hidden="true" />
        </a>
        <a
          className="social-link--x"
          href="https://x.com/openboa_ai"
          target="_blank"
          rel="noreferrer noopener"
          aria-label="OpenBoa on X"
        >
          <span className="social-icon" aria-hidden="true" />
        </a>
      </nav>
    </main>
  )
}
