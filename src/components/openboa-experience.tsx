"use client"

import Image from "next/image"
import { usePathname } from "next/navigation"
import { type PropsWithChildren, useEffect, useRef } from "react"
import { mountScaleField } from "@/lib/openboa/scale-field"
import { products } from "@/lib/openboa/site-content"
import {
  ExperienceLink,
  OpenBoaExperienceProvider,
  useOpenBoaExperience,
} from "./openboa-experience-context"

export function OpenBoaExperience({ children }: PropsWithChildren) {
  const pathname = usePathname()
  if (pathname.startsWith("/pattern")) return <>{children}</>

  return (
    <OpenBoaExperienceProvider>
      <OpenBoaExperienceShell>{children}</OpenBoaExperienceShell>
    </OpenBoaExperienceProvider>
  )
}

function OpenBoaExperienceShell({ children }: PropsWithChildren) {
  const pathname = usePathname()
  const { scene, phase, getExperienceState } = useOpenBoaExperience()
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const quietFieldRef = useRef<HTMLDivElement>(null)
  const brandLogoRef = useRef<HTMLImageElement>(null)
  const siteNavRef = useRef<HTMLElement>(null)
  const projectsMenuRef = useRef<HTMLDetailsElement>(null)
  const projectsSummaryRef = useRef<HTMLElement>(null)
  const projectsLabelRef = useRef<HTMLSpanElement>(null)
  const projectsPopoverRef = useRef<HTMLDivElement>(null)
  const contentRootRef = useRef<HTMLDivElement>(null)
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
      contentRoot: contentRootRef.current,
      siteFootnote: siteFootnoteRef.current,
      siteSocial: siteSocialRef.current,
    }
    if (Object.values(elements).some((element) => element === null)) return
    return mountScaleField({
      ...(elements as {
        root: HTMLElement
        canvas: HTMLCanvasElement
        quietField: HTMLElement
        brandLogo: HTMLImageElement
        siteNav: HTMLElement
        projectsMenu: HTMLDetailsElement
        projectsSummary: HTMLElement
        projectsLabel: HTMLElement
        projectsPopover: HTMLElement
        contentRoot: HTMLElement
        siteFootnote: HTMLElement
        siteSocial: HTMLElement
      }),
      getExperienceState,
    })
  }, [getExperienceState])

  return (
    <div
      id="top"
      className="experience"
      data-scene={scene}
      data-transition={phase}
      ref={rootRef}
    >
      <canvas id="field" ref={canvasRef} aria-hidden="true" />
      <div className="edge-veil" aria-hidden="true" />
      <div className="quiet-field" ref={quietFieldRef} aria-hidden="true" />

      <header className="site-header">
        <ExperienceLink className="brand" href="/" aria-label="OpenBoa home">
          <Image
            ref={brandLogoRef}
            src="/openboa-logo-horizontal.png"
            width={320}
            height={79}
            alt="OpenBoa"
            priority
            unoptimized
          />
        </ExperienceLink>

        <nav className="site-nav" ref={siteNavRef} aria-label="Primary navigation">
          <ExperienceLink
            href="/vision"
            aria-current={scene === "vision" ? "page" : undefined}
          >
            Vision
          </ExperienceLink>
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
          <ExperienceLink
            href="/about"
            aria-current={scene === "about" ? "page" : undefined}
          >
            About
          </ExperienceLink>
        </nav>
      </header>

      <div className="experience-content" ref={contentRootRef}>
        <div className="experience-view" key={pathname}>
          {children}
        </div>
      </div>

      <footer
        className="site-footnote"
        ref={siteFootnoteRef}
        aria-label="OpenBoa location and copyright"
      >
        <span>Seoul, Korea</span>
        <span>© 2026 OpenBoa</span>
      </footer>

      <nav
        className="site-social"
        ref={siteSocialRef}
        aria-label="OpenBoa social links"
      >
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
    </div>
  )
}
