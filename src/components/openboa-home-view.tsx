"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { Button } from "@openboa/yogurt";
import { EXTERNAL_LINKS, OPENBOA_VISION } from "@/lib/brand";
import { useOpenBoa } from "@/components/openboa-context";
import { OpenBoaBrandMorph } from "@/components/openboa-brand-morph";
import { HoldToBreakControl } from "@/components/vision-controls";

gsap.registerPlugin(ScrollTrigger, SplitText);

export function OpenBoaHomeView() {
  const scopeRef = useRef<HTMLDivElement>(null);
  const act1HeadingRef = useRef<HTMLHeadingElement>(null);
  const { appearance } = useOpenBoa();

  useGSAP(
    () => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;

      let split: SplitText | null = null;
      if (act1HeadingRef.current) {
        split = new SplitText(act1HeadingRef.current, {
          type: "lines,chars",
          mask: "lines",
        });
        gsap.from(split.chars, {
          yPercent: 112,
          opacity: 0,
          duration: 0.95,
          stagger: 0.016,
          ease: "power4.out",
        });
      }

      gsap.utils.toArray<HTMLElement>("[data-vision-reveal]").forEach((el) => {
        gsap.from(el, {
          y: 44,
          opacity: 0,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        });
      });

      return () => {
        split?.revert();
      };
    },
    { scope: scopeRef }
  );

  const textShadow =
    appearance === "dark"
      ? "0 2px 28px rgba(4, 6, 10, 0.9)"
      : "0 2px 24px rgba(247, 248, 250, 0.96)";

  const bodyInk = appearance === "dark" ? "#DDE4EC" : "#1F2933";
  const [act1, act2, act3] = OPENBOA_VISION.acts;

  return (
    <div ref={scopeRef} className="w-full">
      {/* ACT 01 — THRESHOLD */}
      <section
        id={`act-${act1.id}`}
        aria-label="OpenBoa statement"
        className="min-h-[100dvh] w-full flex flex-col justify-center px-5 sm:px-8 md:px-12 pt-36 md:pt-28 pb-24"
      >
        <div className="max-w-[1280px] w-full mx-auto">
          <div className="mb-4 sm:mb-5">
            <OpenBoaBrandMorph
              code={act1.code}
              className="text-[12px] sm:text-[13px]"
              textShadow={textShadow}
            />
          </div>

          <h1
            ref={act1HeadingRef}
            aria-label={OPENBOA_VISION.headline}
            className="display-headline tension-headline m-0 text-[clamp(3.15rem,9.4vw,8.7rem)] leading-[0.94] tracking-[-0.048em]"
            style={{ color: "var(--yg-text)", textShadow }}
          >
            {act1.headlineLines[0]}
            <br />
            {act1.headlineLines[1]}
          </h1>

          <p
            className="editorial-lead mt-7 sm:mt-9 mb-0 max-w-[680px] text-[clamp(1.12rem,1.85vw,1.62rem)] leading-[1.48]"
            style={{ color: bodyInk, textShadow }}
          >
            {act1.statement}
          </p>

          <div className="mt-8 sm:mt-10 flex items-center">
            <HoldToBreakControl />
          </div>
        </div>
      </section>

      {/* ACT 02 — FRACTURE */}
      <section
        id={`act-${act2.id}`}
        aria-label="Walls are inherited, never permanent"
        className="min-h-[100dvh] w-full flex flex-col justify-center px-5 sm:px-8 md:px-12 py-28"
      >
        <div className="max-w-[1280px] w-full mx-auto">
          <div data-vision-reveal="" className="max-w-[660px]">
            <div
              className="mb-4 sm:mb-5 mono-telemetry text-[11px] uppercase"
              style={{ color: "var(--yg-brand-ink)", textShadow }}
            >
              {`${act2.code} // ${act2.label}`}
            </div>

            <h2
              className="display-headline m-0 text-[clamp(2.65rem,6.4vw,5.75rem)] leading-[0.98] tracking-[-0.042em]"
              style={{ color: "var(--yg-text)", textShadow }}
            >
              {act2.headlineLines[0]}
              <br />
              <span style={{ color: "var(--yg-brand-ink)" }}>
                {act2.headlineLines[1]}
              </span>
            </h2>

            <p
              className="editorial-lead mt-7 sm:mt-8 mb-0 max-w-[580px] text-[clamp(1.08rem,1.65vw,1.45rem)] leading-[1.52]"
              style={{ color: bodyInk, textShadow }}
            >
              {act2.statement}
            </p>

            <div className="mt-9 sm:mt-11 flex items-center">
              <Link href="/approach" transitionTypes={["route-morph"]}>
                <Button emphasis="filled" size="regular" shape="pill">
                  Explore our Approach →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ACT 03 — HORIZON */}
      <section
        id={`act-${act3.id}`}
        aria-label="Imagination, without a ceiling"
        className="min-h-[100dvh] w-full flex flex-col justify-center px-5 sm:px-8 md:px-12 pt-28 pb-32"
      >
        <div className="max-w-[1280px] w-full mx-auto">
          <div data-vision-reveal="" className="max-w-[780px]">
            <div
              className="mb-4 sm:mb-5 mono-telemetry text-[11px] uppercase"
              style={{ color: "var(--yg-brand-ink)", textShadow }}
            >
              {`${act3.code} // ${act3.label}`}
            </div>

            <h2
              className="display-headline m-0 text-[clamp(2.85rem,7.2vw,6.4rem)] leading-[0.96] tracking-[-0.044em]"
              style={{ color: "var(--yg-text)", textShadow }}
            >
              {act3.headlineLines[0]}
              <br />
              {act3.headlineLines[1]}
            </h2>

            <p
              className="editorial-lead mt-7 sm:mt-8 mb-0 max-w-[620px] text-[clamp(1.08rem,1.7vw,1.5rem)] leading-[1.52]"
              style={{ color: bodyInk, textShadow }}
            >
              {act3.statement}
            </p>

            <div className="mt-10 sm:mt-12 flex flex-wrap items-center gap-4">
              <Link href="/vision" transitionTypes={["route-morph"]}>
                <Button emphasis="filled" size="regular" shape="pill">
                  Explore the Vision
                </Button>
              </Link>
              <a
                href={EXTERNAL_LINKS.github}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline"
              >
                <Button emphasis="soft" size="regular" shape="pill">
                  GitHub ↗
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
