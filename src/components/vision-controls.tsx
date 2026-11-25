"use client";

import { useOpenBoa } from "@/components/openboa-context";

/**
 * Whisper-quiet spatial cue beneath the Act 01 subtitle.
 * Zero box or border chrome at rest so display typography owns the frame;
 * quietly illuminates with live compression progress on hover or hold.
 */
export function HoldToBreakControl() {
  const { appearance, holding, setHolding } = useOpenBoa();

  const ringTrack =
    appearance === "dark"
      ? "rgba(221, 228, 236, 0.24)"
      : "rgba(31, 41, 51, 0.22)";

  const textShadow =
    appearance === "dark"
      ? "0 1px 14px rgba(4, 6, 10, 0.9)"
      : "0 1px 14px rgba(247, 248, 250, 0.96)";

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.stopPropagation();
        setHolding(true);
      }}
      onPointerUp={() => setHolding(false)}
      onPointerLeave={() => setHolding(false)}
      onBlur={() => setHolding(false)}
      onKeyDown={(e) => {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          setHolding(true);
        }
      }}
      onKeyUp={(e) => {
        if (e.code === "Space" || e.code === "Enter") {
          setHolding(false);
        }
      }}
      aria-pressed={holding}
      aria-label="Hold to compress and release the OpenBoa field"
      className={`group inline-flex items-center gap-2.5 bg-transparent border-0 p-0 cursor-pointer select-none transition-opacity duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 ${
        holding ? "opacity-95" : "opacity-45 hover:opacity-90"
      }`}
      style={{
        outlineColor: "var(--yg-brand-ink)",
      }}
    >
      <span className="relative flex items-center justify-center w-[18px] h-[18px] shrink-0 transition-transform duration-300 group-hover:scale-110">
        <svg
          width="18"
          height="18"
          viewBox="0 0 40 40"
          className="-rotate-90"
          aria-hidden="true"
        >
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke={ringTrack}
            strokeWidth="2.2"
          />
          <circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--yg-brand-ink)"
            strokeWidth="3.2"
            strokeLinecap="round"
            className="hold-ring-progress"
          />
        </svg>
        <span
          className="absolute w-[3px] h-[3px] rounded-full transition-transform duration-200 group-hover:scale-150"
          style={{
            backgroundColor: holding ? "var(--yg-brand-ink)" : "var(--yg-text)",
            transform: holding ? "scale(1.8)" : undefined,
          }}
        />
      </span>

      <span
        className="mono-telemetry text-[10px] uppercase tracking-[0.14em] transition-colors duration-200"
        style={{
          color: holding ? "var(--yg-text)" : "var(--yg-text-muted)",
          textShadow,
        }}
      >
        {holding ? "Releasing..." : "Hold anywhere"}
      </span>
    </button>
  );
}
