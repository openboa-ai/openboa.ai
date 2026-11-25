"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Switch } from "@openboa/yogurt";
import { OpenBoaLockup } from "@/components/brand-marks";
import { useOpenBoa } from "@/components/openboa-context";
import { EXTERNAL_LINKS, OPENBOA_VISION } from "@/lib/brand";

export function OpenBoaHud() {
  const pathname = usePathname();
  const { appearance, setAppearance, activeAct, orbitDir } = useOpenBoa();

  const isHome = pathname === "/";
  const isApproach = pathname.startsWith("/approach");
  const isVision = pathname.startsWith("/vision");

  const inkBorder =
    appearance === "dark"
      ? "rgba(121, 179, 214, 0.24)"
      : "rgba(23, 81, 116, 0.22)";

  const mobileNavBg =
    appearance === "dark"
      ? "rgba(8, 12, 18, 0.72)"
      : "rgba(255, 255, 255, 0.78)";

  const scrollToAct = (idx: number) => {
    const act = OPENBOA_VISION.acts[idx];
    if (!act) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      document.getElementById(`act-${act.id}`)?.scrollIntoView({ behavior: "auto" });
      return;
    }
    window.dispatchEvent(
      new CustomEvent("openboa:scroll-to", { detail: `#act-${act.id}` })
    );
  };

  const currentActMeta = OPENBOA_VISION.acts[activeAct] ?? OPENBOA_VISION.acts[0];

  const navItems = [
    { code: "01", label: "Home", href: "/", active: isHome },
    { code: "02", label: "Approach", href: "/approach", active: isApproach },
    { code: "03", label: "Vision", href: "/vision", active: isVision },
  ];

  return (
    <>
      {/* Frameless Architectural Viewport Corner Reticles */}
      <div
        aria-hidden="true"
        data-agent-hidden=""
        className="fixed inset-3 sm:inset-4 z-20 pointer-events-none"
      >
        <span
          className="absolute top-0 left-0 w-2.5 h-2.5 sm:w-3 sm:h-3"
          style={{
            borderTop: `1px solid ${inkBorder}`,
            borderLeft: `1px solid ${inkBorder}`,
          }}
        />
        <span
          className="absolute top-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3"
          style={{
            borderTop: `1px solid ${inkBorder}`,
            borderRight: `1px solid ${inkBorder}`,
          }}
        />
        <span
          className="absolute bottom-0 left-0 w-2.5 h-2.5 sm:w-3 sm:h-3"
          style={{
            borderBottom: `1px solid ${inkBorder}`,
            borderLeft: `1px solid ${inkBorder}`,
          }}
        />
        <span
          className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3"
          style={{
            borderBottom: `1px solid ${inkBorder}`,
            borderRight: `1px solid ${inkBorder}`,
          }}
        />
      </div>

      {/* Responsive Top Spatial Perimeter Header */}
      <header className="fixed top-4 sm:top-6 inset-x-5 sm:inset-x-7 md:inset-x-10 z-30 flex flex-col gap-3 pointer-events-none">
        <div className="flex items-center justify-between w-full">
          <div className="pointer-events-auto flex items-center">
            <Link
              href="/"
              transitionTypes={["route-morph"]}
              aria-label="OpenBoa Home"
              className="flex items-center focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ outlineColor: "var(--yg-brand-ink)" }}
            >
              <span className="hidden sm:inline-flex">
                <OpenBoaLockup width={110} />
              </span>
              <span className="inline-flex sm:hidden">
                <OpenBoaLockup width={92} />
              </span>
            </Link>
          </div>

          {/* Desktop Center Navigation */}
          <nav
            aria-label="Primary"
            className="hidden md:flex pointer-events-auto items-center gap-8"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                transitionTypes={["route-morph"]}
                aria-current={item.active ? "page" : undefined}
                className="relative py-1 flex items-center gap-1.5 text-[12px] mono-telemetry uppercase transition-colors no-underline"
                style={{
                  color: item.active ? "var(--yg-text)" : "var(--yg-text-muted)",
                }}
              >
                <span
                  style={{
                    color: item.active
                      ? "var(--yg-brand-ink)"
                      : "var(--yg-text-muted)",
                    opacity: item.active ? 1 : 0.55,
                  }}
                >
                  {item.code}
                </span>
                <span>{item.label}</span>
                <span
                  className="absolute bottom-0 left-0 right-0 h-[1px] transition-transform duration-300 origin-left"
                  style={{
                    backgroundColor: "var(--yg-brand-ink)",
                    transform: item.active ? "scaleX(1)" : "scaleX(0)",
                  }}
                />
              </Link>
            ))}
          </nav>

          {/* Right Utilities: GitHub + X + Dark Switch */}
          <div className="pointer-events-auto flex items-center gap-3 sm:gap-5">
            <a
              href={EXTERNAL_LINKS.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] sm:text-[12px] mono-telemetry uppercase transition-opacity opacity-85 hover:opacity-100 no-underline"
              style={{ color: "var(--yg-text)" }}
            >
              GitHub ↗
            </a>
            <a
              href={EXTERNAL_LINKS.x}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline text-[12px] mono-telemetry uppercase transition-opacity opacity-65 hover:opacity-100 no-underline"
              style={{ color: "var(--yg-text-muted)" }}
            >
              X ↗
            </a>
            <span
              className="h-3.5 w-[1px]"
              style={{ backgroundColor: inkBorder }}
              aria-hidden="true"
            />
            <Switch
              label="Dark"
              checked={appearance === "dark"}
              onCheckedChange={(checked) => setAppearance(checked ? "dark" : "light")}
            />
          </div>
        </div>

        {/* Mobile Compact Pill Navigation (< 768px) */}
        <nav
          aria-label="Primary mobile"
          className="flex md:hidden pointer-events-auto items-center justify-center self-start gap-1 px-1.5 py-1 rounded-full"
          style={{
            backgroundColor: mobileNavBg,
            border: `1px solid ${inkBorder}`,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              transitionTypes={["route-morph"]}
              aria-current={item.active ? "page" : undefined}
              className="px-3 py-1 rounded-full text-[11px] mono-telemetry uppercase no-underline transition-colors"
              style={{
                backgroundColor: item.active ? "var(--yg-brand)" : "transparent",
                color: item.active ? "#FFFFFF" : "var(--yg-text-muted)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Bottom Spatial Instrument Strip */}
      <footer className="fixed bottom-4 sm:bottom-6 inset-x-5 sm:inset-x-7 md:inset-x-10 z-30 flex items-center justify-between pointer-events-none">
        <div
          className={`mono-telemetry text-[10px] sm:text-[11px] uppercase ${
            !isHome ? "px-3 py-1 rounded-full" : ""
          }`}
          style={{
            color: "var(--yg-text-muted)",
            ...(isHome
              ? {}
              : {
                  backgroundColor: mobileNavBg,
                  border: `1px solid ${inkBorder}`,
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }),
          }}
        >
          {isVision ? (
            <span>OPENBOA // VISION</span>
          ) : isApproach ? (
            <span>OPENBOA // APPROACH</span>
          ) : (
            <span>
              <span style={{ color: "var(--yg-brand-ink)" }}>
                {currentActMeta.code}
              </span>{" "}
              / {currentActMeta.label}
            </span>
          )}
        </div>

        {/* Interactive 3-Act Spatial Rail (Home only) */}
        {isHome ? (
          <nav
            aria-label="Vision chapters"
            className="pointer-events-auto flex items-center gap-1.5 sm:gap-3"
          >
            {OPENBOA_VISION.acts.map((act, idx) => {
              const active = activeAct === idx;
              return (
                <button
                  key={act.id}
                  type="button"
                  onClick={() => scrollToAct(idx)}
                  aria-label={`Jump to chapter ${act.code} ${act.label}`}
                  aria-current={active ? "step" : undefined}
                  className="group flex items-center gap-2 py-1.5 px-1.5 sm:px-2 bg-transparent border-0 cursor-pointer"
                >
                  <span
                    className="block h-[2px] rounded-full transition-all duration-300"
                    style={{
                      width: active ? "24px" : "10px",
                      backgroundColor: active
                        ? "var(--yg-brand-ink)"
                        : inkBorder,
                    }}
                  />
                  <span
                    className="hidden sm:inline mono-telemetry text-[11px] uppercase transition-colors"
                    style={{
                      color: active ? "var(--yg-text)" : "var(--yg-text-muted)",
                      opacity: active ? 1 : 0.55,
                    }}
                  >
                    {act.code}
                  </span>
                </button>
              );
            })}
          </nav>
        ) : (
          <div />
        )}

        <div
          className="mono-telemetry text-[10px] sm:text-[11px] uppercase flex items-center gap-2"
          style={{ color: "var(--yg-text-muted)" }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--yg-brand-ink)" }}
            aria-hidden="true"
          />
          <span>
            {isApproach
              ? orbitDir === "cw"
                ? "DEPTH ↗"
                : "DEPTH ↙"
              : orbitDir === "cw"
                ? "ORBIT ↻"
                : "ORBIT ↺"}
          </span>
        </div>
      </footer>
    </>
  );
}
