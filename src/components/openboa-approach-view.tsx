"use client";

import Link from "next/link";
import { Button } from "@openboa/yogurt";
import { EXTERNAL_LINKS, OPENBOA_VISION } from "@/lib/brand";
import { useOpenBoa } from "@/components/openboa-context";

export function OpenBoaApproachView() {
  const { appearance } = useOpenBoa();
  const bodyInk = appearance === "dark" ? "#DDE4EC" : "#1F2933";
  const textShadow =
    appearance === "dark"
      ? "0 2px 24px rgba(4, 6, 10, 0.88)"
      : "0 2px 20px rgba(247, 248, 250, 0.95)";
  const { approach } = OPENBOA_VISION;

  return (
    <div className="max-w-[1280px] mx-auto px-5 sm:px-8 md:px-12 pt-40 md:pt-36 pb-32">
      <div className="max-w-[620px]">
        <div
          className="mono-telemetry text-[11px] uppercase"
          style={{ color: "var(--yg-brand-ink)", textShadow }}
        >
          {approach.eyebrow}
        </div>

        <h1
          className="display-headline mt-5 mb-0 text-[clamp(2.75rem,6.2vw,5.4rem)] leading-[0.98] tracking-[-0.044em]"
          style={{ color: "var(--yg-text)", textShadow }}
        >
          {approach.headline}
        </h1>

        <p
          className="editorial-lead mt-7 mb-0 text-[clamp(1.08rem,1.65vw,1.42rem)] leading-[1.54]"
          style={{ color: bodyInk, textShadow }}
        >
          {approach.lead}
        </p>

        <div className="mt-14 sm:mt-16 flex flex-col">
          {approach.pillars.map((item) => (
            <article
              key={item.code}
              className="py-7 sm:py-8 grid grid-cols-[36px_1fr] gap-4 sm:gap-5 items-start"
              style={{ borderTop: "1px solid var(--yg-border-subtle)" }}
            >
              <span
                className="mono-telemetry text-[11px] pt-1.5"
                style={{ color: "var(--yg-brand-ink)" }}
              >
                {item.code}
              </span>
              <div>
                <h2
                  className="m-0 text-[clamp(1.12rem,1.4vw,1.3rem)] leading-snug tracking-[-0.02em]"
                  style={{ fontWeight: 540, color: "var(--yg-text)", textShadow }}
                >
                  {item.title}
                </h2>
                <p
                  className="editorial-lead mt-2.5 mb-0 text-[clamp(0.96rem,1.1vw,1.06rem)] leading-[1.6]"
                  style={{ color: "var(--yg-text-muted)", textShadow }}
                >
                  {item.body}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div
          className="mt-4 pt-9 flex flex-wrap items-center gap-4"
          style={{ borderTop: "1px solid var(--yg-border-subtle)" }}
        >
          <Link href="/vision" transitionTypes={["route-morph"]}>
            <Button emphasis="filled" shape="pill" size="regular">
              Read the Vision →
            </Button>
          </Link>
          <a
            href={EXTERNAL_LINKS.github}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline"
          >
            <Button emphasis="soft" shape="pill" size="regular">
              GitHub ↗
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
