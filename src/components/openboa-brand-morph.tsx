"use client";

import { useEffect, useState } from "react";

type MorphPhase = "openboa" | "expanding" | "settled";

export function OpenBoaBrandMorph({
  code = "01",
  className = "",
  textShadow,
}: {
  code?: string;
  className?: string;
  textShadow?: string;
}) {
  const [phase, setPhase] = useState<MorphPhase>("openboa");
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const immediate = window.setTimeout(() => setPhase("settled"), 0);
      return () => window.clearTimeout(immediate);
    }

    const t1 = window.setTimeout(() => setPhase("expanding"), 1250);
    const t2 = window.setTimeout(() => setPhase("settled"), 2450);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  const visualPhase: MorphPhase = hovered && phase === "settled" ? "openboa" : phase;

  return (
    <span
      data-boa-morph=""
      data-phase={visualPhase}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`boa-eyebrow-morph mono-telemetry uppercase ${className}`.trim()}
      style={textShadow ? { textShadow } : undefined}
    >
      <span className="boa-eyebrow-code">{`${code}\u00A0//\u00A0`}</span>
      <span className="sr-only">OpenBoa — Business of Agents</span>
      <span aria-hidden="true" className="boa-eyebrow-word">
        <span className="boa-eyebrow-prefix">
          <span>OPEN</span>
        </span>
        <span className="boa-eyebrow-init">B</span>
        <span className="boa-eyebrow-tail" data-stagger="0">
          <span>{"USINESS\u00A0"}</span>
        </span>
        <span className="boa-eyebrow-init">O</span>
        <span className="boa-eyebrow-tail" data-stagger="1">
          <span>{"F\u00A0"}</span>
        </span>
        <span className="boa-eyebrow-init">A</span>
        <span className="boa-eyebrow-tail" data-stagger="2">
          <span>GENTS</span>
        </span>
      </span>
    </span>
  );
}
