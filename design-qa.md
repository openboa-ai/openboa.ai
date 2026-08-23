# Design QA — brand token integration

## Visual truth and rollback baseline

- Approved source: the last landing prototype served at `http://localhost:50833/`.
- Preserved rollback branch: `backup/landing-v33-20260823`.
- Preserved rollback commit: `8bfc4d2`.
- The archived source and assets are checksum-verified in `rollback/landing-v33/SHA256SUMS.txt` on that branch.
- Implementation under review: `codex/central-aperture-20`, served from the production build at `http://127.0.0.1:50834/`.

## Comparison evidence

- Same-viewport desktop reference: `qa/token-integration/reference-1280x720.png`.
- Same-viewport desktop implementation: `qa/token-integration/implementation-1280x720.png`.
- Same-viewport dropdown reference: `qa/token-integration/reference-dropdown-1280x720.png`.
- Same-viewport dropdown implementation: `qa/token-integration/implementation-dropdown-1280x720.png`.
- Combined 2 x 2 comparison: `qa/token-integration/comparison-2x2.png`.
- Mobile composition harness at 390 x 844: `qa/token-integration/reference-mobile-390x844.png` and `qa/token-integration/implementation-mobile-390x844.png`.
- Final background opt-out: `qa/token-integration/restored-background-947x1146.jpg`.
- Final background opt-out with Products open: `qa/token-integration/restored-background-dropdown-947x1146.jpg`.

The combined comparison documents why the tokenized scale palette was rejected: the approved reference is on the left and the quantized token experiment is on the right. The two final background-opt-out captures supersede the right-hand color treatment while retaining its UI token calibration and layout.

## Intentional calibration changes

- Expression text, body text, accent, type scale, spacing, icon size, motion timing, and breakpoint values resolve from the canonical OpenBoa token snapshot.
- The hero uses the canonical desktop `display-03` role and mobile `title-02` role. Its darker expression color and more decisive weight are therefore intentional.
- The living-scale background deliberately opts out of UI color tokens and restores the approved v33 continuous light-to-Terracotta field. This preserves its softer depth and natural macro flow.
- The approved composition, copy, logo placement, local apertures, scale overlap, ambient movement, cursor response, dropdown growth, and footer/social structure are preserved.

## Focused checks

- Typography: Martian Grotesk is the sole UI typeface. Korean-specific font assets were removed as requested. Hero, navigation, product metadata, and footer roles map to generated semantic aliases.
- Color: authored CSS contains no landing-specific hex values; generated token aliases provide semantic UI colors. The WebGL scale field carries its documented v33 art calibration separately.
- Assets: the canonical horizontal logo is reused at full opacity. Chevron, GitHub, X, and antialiased scale-cutout assets are local and resolve without browser errors.
- Interaction: Products opens on hover and click, remains open while the pointer moves into its links, closes with the intended dimming sequence, and closes on Escape. Cursor interaction and ambient scale movement remain active.
- Responsive behavior: desktop navigation separates left and right apertures; the mobile header composes into two rows. Hero type, local footer/social apertures, and dropdown sizing remain within the 390 x 844 mobile composition.
- Accessibility: semantic navigation and links remain keyboard-operable, visible focus treatment is present, reduced-motion handling is retained, and decorative canvases are excluded from pointer and accessibility semantics.
- Browser health: the production build reported no browser warning or error logs after load and dropdown interaction.

## Central title aperture follow-up

- The central title feather is expanded by exactly 20% at every responsive clamp state.
- The off-white core, contour shape, motion attenuation, colors, and all non-central apertures are unchanged.
- Closed and Products-open production captures are recorded at `qa/token-integration/central-aperture-20-percent.jpg` and `qa/token-integration/central-aperture-20-percent-dropdown.jpg`.
- The same-viewport before/after comparison is recorded at `qa/token-integration/central-aperture-comparison-947x1114.jpg`.
- Browser warning and error logs were empty.

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
