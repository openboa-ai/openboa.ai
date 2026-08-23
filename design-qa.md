# Design QA — brand token integration

## Visual truth and rollback baseline

- Approved source: the last landing prototype served at `http://localhost:50833/`.
- Preserved rollback branch: `backup/landing-v33-20260823`.
- Preserved rollback commit: `8bfc4d2`.
- The archived source and assets are checksum-verified in `rollback/landing-v33/SHA256SUMS.txt` on that branch.
- Implementation under review: `codex/landing-brand-token-pass`, served from the production build at `http://127.0.0.1:50834/`.

## Comparison evidence

- Same-viewport desktop reference: `qa/token-integration/reference-1280x720.png`.
- Same-viewport desktop implementation: `qa/token-integration/implementation-1280x720.png`.
- Same-viewport dropdown reference: `qa/token-integration/reference-dropdown-1280x720.png`.
- Same-viewport dropdown implementation: `qa/token-integration/implementation-dropdown-1280x720.png`.
- Combined 2 x 2 comparison: `qa/token-integration/comparison-2x2.png`.
- Mobile composition harness at 390 x 844: `qa/token-integration/reference-mobile-390x844.png` and `qa/token-integration/implementation-mobile-390x844.png`.

The combined comparison places the approved reference on the left and the token-integrated implementation on the right. Closed states are on the first row; Products-open states are on the second. All four desktop captures use the same 1280 x 720 viewport.

## Intentional calibration changes

- Background, expression text, body text, accent, type scale, spacing, icon size, motion timing, and breakpoint values now resolve from the canonical OpenBoa token snapshot rather than landing-specific literals.
- The hero uses the canonical desktop `display-03` role and mobile `title-02` role. Its darker expression color and more decisive weight are therefore intentional.
- Scale colors use discrete flat fills from the canonical Terracotta 50–500 palette. Broad spatial flow remains coherent, while the previous pink cast is reduced.
- The approved composition, copy, logo placement, local apertures, scale overlap, ambient movement, cursor response, dropdown growth, and footer/social structure are preserved.

## Focused checks

- Typography: Martian Grotesk is the sole UI typeface. Korean-specific font assets were removed as requested. Hero, navigation, product metadata, and footer roles map to generated semantic aliases.
- Color: authored CSS contains no landing-specific hex values; generated token aliases provide canvas, expression, primary, muted, accent, and scale-palette values.
- Assets: the canonical horizontal logo is reused at full opacity. Chevron, GitHub, X, and antialiased scale-cutout assets are local and resolve without browser errors.
- Interaction: Products opens on hover and click, remains open while the pointer moves into its links, closes with the intended dimming sequence, and closes on Escape. Cursor interaction and ambient scale movement remain active.
- Responsive behavior: desktop navigation separates left and right apertures; the mobile header composes into two rows. Hero type, local footer/social apertures, and dropdown sizing remain within the 390 x 844 mobile composition.
- Accessibility: semantic navigation and links remain keyboard-operable, visible focus treatment is present, reduced-motion handling is retained, and decorative canvases are excluded from pointer and accessibility semantics.
- Browser health: the production build reported no browser warning or error logs after load and dropdown interaction.

## Verification

- `pnpm tokens:check` — passed.
- `pnpm test:responsive` — passed.
- `pnpm lint` — passed.
- `pnpm exec tsc --noEmit` — passed.
- `pnpm build` — passed.
- `pnpm audit --audit-level=moderate` — no known vulnerabilities.
- `pnpm test:repository-security` — 18/18 fixture tests and all production contract checks passed.
- `BASE_URL=http://127.0.0.1:50834 pnpm test:security` — passed.
- `git diff --check` — passed.

## Evidence limits

- Screenshot review and semantic checks do not constitute full WCAG certification. Assistive-technology announcement behavior and a complete 200% zoom audit would require a separate accessibility pass.
- The mobile evidence is captured through an isolated 390 x 844 composition harness inside the fixed in-app Browser viewport; it validates layout and reflow, not mobile browser chrome.

final result: passed
