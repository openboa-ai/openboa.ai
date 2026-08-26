**Comparison Target**

- Source visual truth: `/Users/sangjoon/.codex/generated_images/01a0275c-569f-7b60-a763-0b1d74eddd2e/exec-c30e48bf-e1d1-4646-b1f1-1c5b147529cf.png`
- Source pixels: `1487 × 1058`; three-panel conceptual art-direction board, approximately `495 × 1058` per scene.
- Browser-rendered implementation screenshots:
  - `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/final-vision-chapter-1-1440x1024.png`
  - `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/final-vision-chapter-2-1440x1024.png`
  - `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/final-about-hero-1440x1024.png`
  - `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/final-landing-390x844.png`
  - `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/final-vision-390x844.png`
  - `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/final-about-390x844.png`
- CSS viewports: desktop `1440 × 1024`; mobile `390 × 844`.
- Implementation pixels match the configured CSS viewport at device pixel ratio `1`.
- Density normalization: source and desktop implementation were compared at equal displayed height without stretching in the focused composites. The source is a conceptual portrait scene board rather than a pixel specification for the landscape desktop viewport, so the review evaluates composition and visual language rather than false pixel-level parity.
- States: Vision foundational belief, Vision Poiesis, About hero, landing, Products dropdown, and responsive mobile hero/scroll scenes.

**Full-view Comparison Evidence**

- Combined source and implementation: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/comparison.png`
- The implementation preserves the selected hierarchy: one persistent header, large off-white reading aperture, official overlapping scale pattern around the reading field, alternating Vision copy position, and the About diagonal current.
- The implementation intentionally retains the denser, animated landing scale field instead of simplifying it to the conceptual mock. This follows the approved requirement that Landing, Vision, and About share the same scale size, density, overlap, and movement.

**Focused Region Comparison Evidence**

- Vision: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/vision-focused.png`
- About: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/about-focused.png`
- These equal-height comparisons make the logo, navigation, display typography, eyebrow/index styling, product rows, aperture boundary, and scale edge quality readable. No additional crop was needed because the relevant elements are legible in these focused comparisons.

**Findings**

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: Martian Grotesk, weight hierarchy, compact tracking, headline wrapping, caption treatment, and muted body text preserve the selected direction. Mobile headline wrapping remains readable and does not clip.
- Spacing and layout rhythm: desktop copy alignment and scene alternation match the conceptual composition; mobile collapses to a stable single-column reading layout without header or copy overlap.
- Colors and visual tokens: UI copy uses the current OpenBoa semantic tokens; the living background intentionally keeps the approved non-tokenized terracotta tonal flow. Off-white cores remain visually distinct without introducing cards, glass, or borders.
- Image quality and asset fidelity: the shared field uses the official antialiased `openboa-scale-cutout-aa-1024.png` texture. No placeholder illustration, handcrafted SVG, emoji, or CSS-drawn substitute was introduced.
- Copy and content: Vision follows the approved human possibility, Poiesis, agents, Business of Agents, and mission sequence. About uses `OpenBoa develops AI-native businesses and products.` and concise product descriptions.
- Icons and interaction states: existing official logo, chevron asset, GitHub/X icons, hover/focus treatment, dropdown aperture expansion, and delayed close behavior remain intact.
- Accessibility: semantic headings and navigation are present, active routes use `aria-current`, hidden landing footer links leave the tab order, keyboard focus styles remain visible, and reduced-motion behavior is retained.

**Comparison History**

- [P2 resolved] About product rows initially used a longer Coffee Chat description and text-glyph arrows not present in the selected visual. Fixed by shortening the detail to `Reviewed judgment for people and agents.` and removing the arrows. Post-fix evidence: `final-about-hero-1440x1024.png` and `about-focused.png`.
- [P2 resolved] At `390 × 844`, the landing first line clipped at the right edge. Fixed by calibrating the mobile hero size from `7vw` to `6.65vw`. Post-fix evidence: `final-landing-390x844.png`.
- [P2 resolved] At `390 × 844`, Vision and About scales crossed important copy. Fixed by widening the Vision reading core and moving/narrowing the About diagonal current at the mobile breakpoint only. Post-fix evidence: `final-vision-390x844.png`, `final-about-390x844.png`, and `final-about-chapter-2-390x844.png`.

**Primary Interactions Tested**

- Products opens on hover, remains open while the pointer enters the dropdown, and completes its reverse dim/close sequence after Escape.
- Landing → Vision → About uses one persistent canvas and one persistent header; the field stays `ready` across route transitions.
- Vision and About scroll chapters pin correctly and replace copy while the shared pattern reorganizes.
- Desktop and mobile navigation, product links, active-route state, footer/social visibility, and responsive copy were inspected in the in-app browser.
- Production browser logs for `http://127.0.0.1:50836` were checked after the final render.

**Implementation Checklist**

- [x] Persistent WebGL field and header
- [x] Vision four-chapter semantic scroll narrative
- [x] About three-chapter scroll narrative
- [x] Route dim/morph/enter sequencing
- [x] Official scale asset and approved landing behavior retained
- [x] Desktop and mobile visual QA
- [x] Hover, keyboard, scroll, route, build, token, responsive, lint, and security checks

**Follow-up Polish**

- The implementation has more living texture than the conceptual target; this is an intentional consequence of preserving the approved landing field, not a fidelity defect.

final result: passed

## Vision and About Copy-Aperture Synchronization — 2026-08-26

**Scope**

- Preserved the approved final Vision Horizon field and composition exactly.
- Recalibrated Vision origin, relay, and synthesis plus all three About scenes.
- Preserved the landing-derived scale asset, density, overlap, terracotta range,
  field motion, fixed navigation, and fixed footer.

**Resolved structural mismatch**

- The copy layout and reading aperture previously used independent CSS and
  viewport-ratio coordinate systems, so their centers and dimensions could
  diverge by scene and viewport.
- Every non-Horizon story scene now exposes its line-level reading copy as a
  measurement target. The persistent field measures those untransformed glyph
  bounds and uses the result as the aperture source geometry.
- Each actual line fragment becomes a softly rounded ink pool. Adjacent pools
  merge continuously, so staggered line lengths and content groupings produce
  one asymmetric silhouette instead of a rectangular or circular scene mask.
- Low-frequency longitudinal and angular contour drift keeps the feather edge
  gently irregular while preserving a stable off-white reading core.
- The off-white core now includes only the measured copy plus compact optical
  padding. The translucent scale feather is capped to a much narrower pixel
  range instead of expanding with the former large viewport-relative radius.
- Desktop composition widths, indents, margins, and About content grouping were
  tightened so text and material read as one authored region rather than a text
  block floating inside a broad pale opening.
- Mobile retains a single-column reading order and receives its own compact
  core padding and feather dimensions.

**Verification**

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test:responsive`
- `git diff --check`
- `pnpm build`
- Development routes return HTTP 200 at `http://127.0.0.1:50837/vision` and
  `http://127.0.0.1:50837/about`.
- Local-browser automation remains blocked by the in-app URL policy, so this
  pass does not claim a new screenshot-based visual audit. The live preview is
  the review surface for final optical calibration.

final result: implementation passed; live visual review pending

## Story Typography and Transition Integration — 2026-08-26

**Scope**

- The approved landing-connected scale density, overlap, color calibration,
  off-white core, and feathered material boundaries are unchanged.
- Vision and About typography, composition, and scroll-linked copy timing are
  the only production-facing visual changes in this pass.

**Resolved findings**

- [P1 resolved] Whole-scene clipping made copy read as slides placed over the
  material field. Copy is now split into semantic lines and supporting units,
  and each unit follows the corresponding alignment, relay, synthesis,
  horizon, formation, orbit, or loom direction.
- [P1 resolved] Adjacent statements previously remained visible together at
  transition midpoints. The outgoing units now clear in sequence before the
  next units propagate into the re-formed reading field.
- [P2 resolved] About grouped every element into a conventional lower-left
  presentation block. The introduction now spans the open field, the system
  statement follows the orbital boundary, and the product pair occupies two
  loom endpoints.
- [P2 resolved] Vision statements now use controlled line offsets that follow
  each field gesture rather than repeating one rectangular text measure.

**Comparison and runtime evidence**

- Same-state About Products comparison:
  `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/text-background-integration-2026-08-26/comparison-about-products.png`
- In-app browser scroll checks covered Vision at progress `0`, `0.38`, `0.48`,
  `0.58`, `0.68`, `1`, `1.5`, `2`, `2.5`, and `3`; About at progress `0`,
  `0.3`, `0.5`, `0.7`, `1`, `1.5`, and `2`.
- Header, footer, social links, one fixed WebGL field, and the direct-access
  Pattern study remain unchanged.

**Verification**

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test:responsive`
- `git diff --check`

final result: passed

## Connected Vision and About Story QA — 2026-08-25

**Correction applied**

- The gray-looking semi-transparent scale ring and the binary cut at the
  reading boundary were removed. Internal pages now keep the landing
  terracotta endpoints and overlap density, bridge through pale terracotta,
  and merge fully into the same approved off-white canvas.
- Vision and About keep one pinned scale field. Scroll changes the selected
  material behavior and its reading aperture; content is no longer moved
  through the viewport as a stack of document sections.
- Text reveal direction is selected by the same semantic behavior as the
  material field: alignment and relay reveal laterally, synthesis and horizon
  open from the center, formation resolves downward, and coil/loom reveal in
  the direction of their current.
- The persistent header, location/copyright footer, and social links remain
  fixed and do not participate in story transitions.

**Visual evidence**

- Landing density/color baseline:
  `.codex/design-qa/vision-rework-2026-08-25/100-landing-density-baseline.png`.
- Vision chapter and transition sequence:
  `.codex/design-qa/vision-rework-2026-08-25/110-vision-connected-0.png`
  through `113-vision-connected-3.png`, including half-step captures.
- About chapter and transition sequence:
  `.codex/design-qa/vision-rework-2026-08-25/90-about-connected-0.png`
  through `92-about-connected-2.png`, including half-step captures.
- Connected text/material midpoint:
  `.codex/design-qa/vision-rework-2026-08-25/130-about-transition-connected.png`.
- Mobile fixed-shell evidence:
  `.codex/design-qa/vision-rework-2026-08-25/120-about-mobile-connected-0.png`,
  `121-about-mobile-connected-1.png`,
  `122-about-mobile-connected-2.png`, and
  `131-about-mobile-smooth-scroll-shell.png`.

**Observed result**

- No gray scale layer is used on Vision or About.
- The off-white boundary is a multi-row color merge, not a hard alpha cut.
- Header and footer remain stable during an actual smooth mobile scroll.
- Desktop and mobile retain the official antialiased scale asset and the
  landing page's light-to-terracotta material rhythm.

final result: connected implementation ready for direct review

## Semantic Pattern Narrative Redesign — 2026-08-25

**Scope**

- Vision is rebuilt as four connected material states: Latent Alignment, Relay
  Propagation, Coordinated Synthesis, and Horizon Unfurl.
- About is rebuilt as three material states: Inward Formation, Orbital System,
  and Edge Loom.
- Landing, the persistent header, the official scale asset, the approved
  terracotta/off-white material calibration, and the direct-access `/pattern`
  study remain unchanged.

**Narrative and interaction**

- Each chapter has one message, one supporting statement, and one named field
  behavior. The behavior label describes the material logic without turning
  the page into a technical demo.
- Vision moves from latent possibility to collective propagation, then to
  coordinated business formation and an opening horizon.
- About moves from agents entering the business premise, to a native operating
  system, to two projects woven from the same premise.
- Text scenes now overlap through a full-distance cubic crossfade. The previous
  midpoint where both scenes could disappear is removed.
- CPU aperture fields and GPU displacement use the same chapter progress, so
  reading space, material density, direction, rotation, and scale response
  morph as one state.

**Responsive material coverage**

- Desktop Vision retains roughly 44–46% fully material field through the first
  three chapters; Horizon deliberately opens the largest paper region.
- Mobile About keeps roughly 29–32% fully material field in every chapter,
  avoiding the nearly blank mobile states produced by the first orbital/loom
  draft.
- Mobile copy remains a single reading column while the orbital and loom fields
  reform as living upper and lower boundaries.

**Verification**

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test:responsive`
- `pnpm build`
- `git diff --check`
- Production preview routes `/vision`, `/about`, and `/pattern` return `200`.

**Evidence limit**

- The in-app browser rejected navigation to the rebuilt local production URL,
  so this pass does not claim a new screenshot-based visual comparison. The
  production preview is kept running for direct review and the next visual
  calibration pass.

final result: implementation passed; visual calibration pending

## Vision Pattern Behavior Study QA — 2026-08-25

**Scope**

- Lab route: `http://127.0.0.1:50837/pattern`
- Thirty-two independent behavior studies use the official antialiased OpenBoa scale cutout, landing density, overlap, paper color, and terracotta endpoints.
- Production `/vision` remains unchanged by the lab-only behavior expansion.
- The lab exposes `Pattern` and `Meaning` views so material behavior can be judged both without and with the reading aperture.

**Comparison Evidence**

- Approved landing-connected baseline and all final field studies in one equal-size board: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/vision-behavior-32/final-comparison-32.png`
- Individual final captures: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/vision-behavior-32/final-01.png` through `final-32.png`
- Browser viewport: `1280 × 720`, device pixel ratio `1`.
- Runtime state: WebGL field `ready`, 32 behavior controls present, and zero document overflow on both axes.

**Behavior Coverage**

- Surface continuity: connected current, compression breath, peristaltic transit, counterflow shear.
- Direction and transport: serpentine ascent, relay wake, fountain rise, eruption plume, cross tide.
- Rotation and topology: coiling vortex, orbital globe, orbital rings, Möbius turn.
- Formation and collective order: inward formation, swarm alignment, cellular propagation, lattice nucleation, island synthesis.
- Material boundary and negative space: expanding void, spiral ingress, molting shear, gravity lens, boundary reform, horizon unfurl, perimeter circuit.
- Multi-current coordination: braided bifurcation, magnetic poles, edge loom, fracture healing, branching canopy.

**Resolved Findings**

- [P2 resolved] Rebound Wave initially separated adjacent rows and exposed hard white gaps. Radial displacement and angle amplitude were reduced; the signal now reads through subtle enlargement, orientation, and tonal propagation while overlap remains continuous.
- [P2 resolved] Spiral Ingress and Boundary Reform initially converted too much of the field to nearly blank off-white. Their paper contribution was reduced so pale scale texture remains visible through low-density regions.
- [P2 resolved] Möbius Turn did not read as a distinct topology against the shared macro color field. The surrounding scales now move toward paper while the figure-eight current retains terracotta contrast.
- [P2 resolved] Fracture Healing lacked a legible seam in still states. The living seam now carries a stronger but still scale-preserving paper transition.

**Verification**

- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm test:responsive`
- Pattern/Meaning toggle, 32 mode controls, pause/play, stage controls, and wheel/cursor inputs were checked in the in-app browser.
- Reduced-motion and responsive contracts remain covered by the existing design checks.

final result: passed

## Pattern Study Preservation and Unfurl QA — 2026-08-25

**Scope and source truth**

- The behavior lab is methodology source, not production page content.
- Thirty behaviors are recorded as retained vocabulary; Braided Bifurcation and
  Peristaltic Transit remain parked without being deleted.
- Before refinement: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/vision-behavior-32/final-30.png`.
- Refined implementation: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/vision-behavior-32/unfurl-refined-pattern-1280x720.png`.
- Combined comparison: `/Users/sangjoon/Coding/openboa.ai/.codex/design-qa/vision-behavior-32/unfurl-before-after.png`.
- Both sides of the combined board are normalized to `1280 × 720` at the same
  16:9 Pattern state. The refined browser capture was cropped to its rendered
  page region before normalization.

**Findings and comparison history**

- [P2 resolved] The previous Horizon Unfurl placed its upper and lower scale
  boundaries too close to the center and transitioned from terracotta to
  off-white through one high-contrast seam.
- Fix: increased the minimum off-white core, separated scale displacement from
  color feathering, reduced boundary displacement, and composed the paper color
  from a solid core plus a wider secondary feather.
- Post-fix evidence: the center reads as one continuous off-white horizon; pale
  intermediate scales now connect it to the terracotta field without a hard
  color break.
- Fonts and copy are unchanged. Spacing changes are restricted to the Unfurl
  material field. The official antialiased scale asset and approved landing
  palette remain unchanged.
- A focused crop was unnecessary because the full-view comparison exposes the
  complete upper boundary, center, and lower boundary at readable size.
- No actionable P0, P1, or P2 findings remain.

**Visibility and verification**

- `/pattern` is available only by direct URL, remains `noindex, nofollow`, and
  is absent from both site navigation and the public sitemap.
- Runtime state: WebGL `ready`, Unfurl marked `retained`, 32 studies available,
  and no document overflow.
- `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm test:responsive`, and
  `git diff --check` pass.

final result: passed
