# OpenBoa main website redesign verification

Accepted specification: `docs/engineering/futuristic-main-redesign/spec.md`
(revision 1). Baseline `origin/main`:
`282db386730997f98e1bd76b0a41355735860625`.

## Observed result

- Implemented the redesigned OpenBoa site across `/`, `/approach`, and `/vision`
  powered by vendored `@openboa/yogurt@0.2.0-local.1`, `@ui-sdk/react@0.1.0-beta.13`,
  Three.js (`0.187.0`), GSAP (`3.15.1`), `@gsap/react` (`2.1.2`), and Lenis
  (`1.3.28`).
- Replaced retired terracotta scale-field assets, Martian Grotesk fonts, and
  legacy `/about` and `/pattern` routes with canonical Yogurt tokens, Upright 9
  icon/OG artwork, self-hosted variable `Rethink Sans` WOFF2 fonts, and a
  permanent `/about -> /vision` redirect (`308`).
- Built a persistent single-canvas 3D WebGL stage (`14,000` instanced 3D Upright
  9 micro-symbols + `32,000` luminous field sparks) with four distinct route/act
  topologies (Möbius wave, Meridian sphere, Open horizon, and `/approach`
  receding rectilinear breached portal walls), cursor interaction, whisper-quiet
  hold-to-break tension (`--boa-charge`), persistent directional scroll physics,
  `prefers-reduced-motion` support, and `webglcontextlost`/`webglcontextrestored`
  fallback resilience.

## Local acceptance evidence

Environment: macOS, pnpm 10.30.2, Next.js 16.4.5, React 19.3.0. All commands
below passed against the final candidate:

- **R1 (Security & Audit)**:
  - `pnpm install --frozen-lockfile`: passed.
  - `pnpm audit --audit-level=moderate`: `No known vulnerabilities found`.
  - `pnpm test:repository-security`: 18/18 fixture tests and 25/25 repository
    security checks passed without modifying CI or Dependabot contracts.
  - `pnpm test:security` against local production server: all 8 header checks
    passed (`CSP`, `COOP`, `Permissions-Policy`, `Referrer-Policy`, `HSTS`,
    `X-Content-Type-Options`, `X-Frame-Options`, `x-powered-by` hidden).
- **R2 (Design Tokens & Assets)**:
  - `pnpm tokens:check` and `scripts/check-design-token-contract.mjs`: 9/9
    checks passed (pinned Yogurt snapshot SHA-256, Ink Blue & neutral tokens,
    Tailwind v4 + Yogurt layer cascade order, zero raw hexes in `globals.css`,
    pinned self-hosted `Rethink Sans` WOFF2 + OFL notice, pinned Upright 9
    `icon.svg`, English-only).
- **R3 & R4 (Visual, Interactive & Responsive QA)**:
  - `scripts/check-responsive-css.mjs`: 14/14 structural and resilience checks
    passed.
  - Headless Chrome production verification on `1440x900` desktop and `390x844`
    mobile:
    - Desktop `H1 = 135.36px`, lead `25.92px`, `overflowX = false`, single
      `<canvas>`, self-hosted `Rethink Sans` loaded.
    - Mobile `H1 = 50.4px`, lead `17.92px`, `overflowX = false`.
    - Hold control `height = 18px`, live `--boa-charge = 0.928` on hold.
    - Persistent scroll direction verified: `cw -> ccw -> cw`.
    - `prefers-reduced-motion: reduce` verified (`rmCharge = 0`).
    - Zero external network requests (`[]`), zero console errors (`[]`), zero
      warnings (`[]`).
    - Desktop Light/Dark, `/approach`, `/vision`, and Mobile renders inspected
      directly.
- **R5 (WebMCP Contract)**:
  - `node --test scripts/check-webmcp-contract.test.mjs`: 4/4 tests passed
    (`@openboa/yogurt/agent` + `@ui-sdk/react/agent` exports, policy/SSR guard,
    `OpenBoaProvider` confirmation-gated registration + cleanup, and
    `data-agent-hidden` on decorative layers).
- **R6 (SEO, GEO & Compatibility)**:
  - Production HTTP responses verified: `200` for `/`, `/approach`, `/vision`,
    `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/llms.txt`,
    `/openboa-open-graph.png`, `/icon.svg`; `308 -> /vision` for `/about`;
    `Organization` + `WebSite` JSON-LD present on `/`.
- **R7 (Typecheck, Lint & Build)**:
  - `pnpm exec tsc --noEmit`, `pnpm lint`, and `pnpm build` all exited `0` with
    zero warnings or errors (`10/10` static routes generated).
- **R8 (Diff Hygiene)**:
  - `git diff --check` passed cleanly; reference privacy check passed on staged
    changes before commit.

Local test servers were stopped after verification.

## Delivery boundary

Local implementation and verification are complete on branch
`codex/futuristic-main-redesign`. Remote push, pull request publication, GitHub
CI observation, merge, and production deployment remain separate human
decisions.
