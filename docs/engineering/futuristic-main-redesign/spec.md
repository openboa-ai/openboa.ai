# OpenBoa main website redesign

Status: accepted, revision 1. User-approved visual and functional design baseline
established via interactive desktop and mobile preview review on 2026-11-25,
recorded before production repository edits. Local implementation and verification
proceed in an isolated worktree; push, merge, release and deployment remain
separate human decisions.

## Intent and baseline

Redesign `openboa.ai` from the ground up into a high-craft, interactive,
vision-first website powered by `@openboa/yogurt` (`0.2.0-local.1`), `@ui-sdk/react`,
Three.js, GSAP, and Lenis. Baseline `origin/main`:
`282db386730997f98e1bd76b0a41355735860625`.

The redesign retires the previous terracotta scale-field layout, legacy
`openboa-brand-system` token snapshot, Martian Grotesk font assets, `/about`
product-list presentation, and hidden `/pattern` study route. It establishes
OpenBoa's updated canonical vision messaging across three primary routes:

- `/` (**Home**): 3-act spatial narrative (`01 Threshold`, `02 Fracture`,
  `03 Horizon`) opening with `"Every limit has a shelf life."` and
  `"Nothing is permanently out of reach. OpenBoa exists to break what stands between imagination and reality."`
  Act 01 includes a minimal whisper-quiet `"Hold anywhere"` interaction cue and
  no duplicate navigation CTA. Act 02 links to `/approach`. Act 03 links to
  `/vision` and OpenBoa's GitHub organization (`https://github.com/openboa-ai`).
- `/approach` (**Approach**): `"How walls give way."` — four operational pillars
  paired with a dedicated rectilinear 3D breached-portal topology.
- `/vision` (**Vision**): `"Nothing is permanently out of reach."` — four core
  principles paired with a right-anchored 3D meridian sphere topology.

Existing inbound links to `/about` permanently redirect (`308`) to `/vision`.
No product showcase or catalog grid is presented on `openboa.ai`; repository
discovery links directly to GitHub (`https://github.com/openboa-ai`) and X
(`https://x.com/openboa_ai`).

## Authority, data and change boundary

- **Visual & Brand Assets**: Consume canonical `@openboa/yogurt@0.2.0-local.1`
  brand tokens (`slate.700` `#175174` light / `slate.300` `#79B3D6` dark,
  21x11 neutral/slate palette, Upright 9 symbol, inline theme-aware OpenBoa
  lockup, self-hosted variable `Rethink Sans` `.woff2` font with `OFL.txt`
  license notice). Paper Light is the default appearance with an interactive
  Dark polarity toggle.
- **Dependencies**: Vendor `@openboa/yogurt@0.2.0-local.1` at
  `vendor/openboa-yogurt-0.2.0-local.1.tgz` (built from `yogurt-repo@8c0de34ce2bcf795c44e28c406a6070fd1a4eaca`)
  and declare `@ui-sdk/react` (`0.1.0-beta.13`), `three`, `@types/three`, `gsap`,
  `@gsap/react`, and `lenis`. Keep all banned scaffold packages absent
  (`class-variance-authority`, `clsx`, `lucide-react`, `radix-ui`,
  `tailwind-merge`, `tw-animate-css`). Maintain `pnpm audit --audit-level=moderate`
  at zero advisories.
- **Security & CI Controls**: Preserve `next.config.ts` strict CSP
  (`default-src 'self'`, `connect-src 'self'`, `font-src 'self' data:`,
  `frame-ancestors 'none'`, `object-src 'none'`, no `'wasm-unsafe-eval'`, no
  `worker-src blob:`, no third-party CDN origins), `COOP: same-origin`, HSTS,
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, and `poweredByHeader: false`. Do not modify
  `.github/workflows/ci.yml`, `.github/workflows/dependency-review.yml`,
  `.github/dependabot.yml`, or weaken `scripts/check-repository-security.mjs`.
- **Allowed Behavior**:
  - Persistent single full-viewport WebGL `<canvas>` mounted in root shell
    across `/`, `/approach`, and `/vision`, rendering 14,000 instanced 3D
    `Upright 9` micro-symbols and 32,000 field sparks in two draw calls plus
    lightweight orbital/portal geometric accents.
  - Real-time cursor vortex/shear, click-and-hold harmonic compression synced to
    `--boa-charge` with release shockwave burst, and persistent scroll-direction
    momentum (`cw`/`ccw` orbital rotation on Home & Vision; forward/reverse
    Z-depth portal glide on Approach).
  - Strictly silent operation (zero audio contexts or sound playback).
  - English-only typography (no `Pretendard` assets).
  - Progressive WebMCP registration via `createYogurtAgent({ allow: (step) => !step.confirm })`
    and `registerTools(agent, { allow: () => true })`, marking the decorative
    WebGL stage and corner reticles with `data-agent-hidden=""` and
    `aria-hidden="true"`.
  - Complete SEO & GEO metadata: `layout.tsx` metadata, OpenGraph/Twitter cards
    with updated Upright 9 artwork, `Organization` + `WebSite` JSON-LD,
    `public/llms.txt`, `sitemap.ts`, `robots.ts`, `manifest.ts`, and SVG/PNG icons.
- **Prohibited Behavior**:
  - No external CDN font/script/asset requests at runtime or build time.
  - No WASM modules or blob Web Workers.
  - No audio playback or autoplay media.
  - No product catalog grids or third-party tracking scripts.

## Lifecycle failures and resilience

- **WebGL Unavailable or Context Loss**: If `WebGLRenderer` initialization throws
  or a `webglcontextlost` event occurs, prevent default browser failure, cancel
  the animation loop cleanly, display a crisp CSS-only ambient fallback surface
  preserving full content legibility and navigation, and restore cleanly on
  `webglcontextrestored`.
- **Reduced Motion**: Honor `(prefers-reduced-motion: reduce)` across CSS,
  GSAP reveal choreography, Lenis smooth scrolling, and WebGL animation loops
  (render a static composed frame without continuous orbital/tunnel drift or
  impulse bursts).
- **Background Tab Conservation**: Pause WebGL animation work whenever
  `document.hidden` is true and reset frame delta on resume.
- **Responsive Viewports**: Ensure zero horizontal overflow (`scrollWidth <= innerWidth`),
  readable responsive `clamp()` display/lead scales, adaptive 2-tier mobile HUD
  (`< 768px`), and centered narrow-screen 3D camera pullback (`< 860px`) across
  desktop (`1440x900`) and mobile (`390x844`).

## Requirements and acceptance evidence

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| R1 | Repository security, audit, and CSP contracts remain intact without weakening. | `pnpm audit --audit-level=moderate`, `pnpm test:repository-security`, `pnpm test:security` against local production build. |
| R2 | Canonical `@openboa/yogurt` tokens, Upright 9 mark, and self-hosted Rethink Sans font are pinned and English-only. | `pnpm tokens:check` and updated `scripts/check-design-token-contract.mjs` pass; `Pretendard` excluded. |
| R3 | Persistent single-canvas 3D stage renders distinct topologies across `/`, `/approach`, and `/vision` with cursor, hold, and scroll-direction physics. | Headless Chrome desktop (`1440x900`) and mobile (`390x844`) capture & interactive probe (`--boa-charge > 0.5`, `cw -> ccw -> cw`, `0` console/page errors) plus visual screenshot inspection. |
| R4 | Responsive composition and accessibility contracts hold on desktop and mobile. | Updated `scripts/check-responsive-css.mjs` passes; desktop & mobile `overflowX === false`; `prefers-reduced-motion` and WebGL fallback verified. |
| R5 | Progressive WebMCP tool registration executes cleanly without mutating confirmation-gated actions. | Automated Node/unit test verifying WebMCP registration contract (`createYogurtAgent` + `registerTools` + `data-agent-hidden` on decorative layers). |
| R6 | SEO, GEO, and legacy `/about` redirect are complete and accurate. | Production route checks for `/`, `/approach`, `/vision`, `/about` (`308 -> /vision`), `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, `/llms.txt`, and `/openboa-open-graph.png`. |
| R7 | TypeScript, ESLint, and production Next.js build pass cleanly. | `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm build` exit `0` with zero warnings/errors. |
| R8 | Reference privacy policy verified before staging/commit. | `python3 /Users/sangjoon/Coding/openboa-ai/.workspace/reference_guard.py staged` exits `0`. |
