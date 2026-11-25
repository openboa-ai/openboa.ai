"use client";

import type { CSSProperties } from "react";
import { OPENBOA_WORDMARK_PATH, UPRIGHT_9_PATH, UPRIGHT_9_VIEWBOX } from "@/lib/brand";

export function OpenBoaLockup({
  width = 110,
  className,
}: {
  width?: number;
  className?: string;
}) {
  const height = Math.round((width * 103.76667) / 518.11005);
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 518.11005 103.76667"
      width={width}
      height={height}
      role="img"
      aria-label="OpenBoa"
      className={className}
    >
      <title>OpenBoa</title>
      <g
        transform="translate(-20.21937 -11.87913) scale(1.00972)"
        style={{ fill: "var(--yg-brand-ink, var(--ob-color-brand-ink-light))" }}
      >
        <path d={UPRIGHT_9_PATH} />
      </g>
      <g
        transform="translate(106.50033 8.76667) scale(1)"
        style={{ fill: "var(--yg-text, var(--ob-color-ink-light))" }}
      >
        <path d={OPENBOA_WORDMARK_PATH} />
      </g>
    </svg>
  );
}

export function Upright9Mark({
  size = 44,
  className,
  style,
  strokeOnly = false,
}: {
  size?: number;
  className?: string;
  style?: CSSProperties;
  strokeOnly?: boolean;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={UPRIGHT_9_VIEWBOX}
      width={size}
      height={size}
      role="img"
      aria-label="OpenBoa Upright 9 symbol"
      className={className}
      style={style}
    >
      <title>OpenBoa Upright 9</title>
      <path
        d={UPRIGHT_9_PATH}
        fill={strokeOnly ? "none" : "currentColor"}
        stroke={strokeOnly ? "currentColor" : "none"}
        strokeWidth={strokeOnly ? 1.5 : 0}
      />
    </svg>
  );
}
