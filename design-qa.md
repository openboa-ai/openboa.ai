# Design QA

## Source visual truth

- Selected reference: `/Users/sangjoon/.codex/generated_images/019ff4fd-04f7-7fc0-a507-3d70327e1775/exec-7e9b2b70-7df2-4b55-998c-c4ce98060c02.png`
- Source pixels and design viewport: 1487 x 1058 at 1x density
- State: landing page, Projects closed

## Implementation evidence

- Primary source-size capture: `qa/responsive-2026-08-12/11-reference-1487x1058.png`
- Source-size CSS viewport: 1487 x 1058 at 1x density
- Full-view side-by-side comparison: `qa/responsive-2026-08-12/14-reference-comparison.png`
- Mobile closed state: `qa/responsive-2026-08-12/12-mobile-final-390x844.png`
- Mobile Projects-open state: `qa/responsive-2026-08-12/13-mobile-projects-open-390x844.png`
- Responsive captures: 360 x 800, 390 x 844, 430 x 932, 768 x 1024, 820 x 1180, 844 x 390, 1024 x 768, 1440 x 900, 1728 x 900, 1280 x 1319, and 1487 x 1058.

## Full-view comparison

The reference and implementation were normalized to 743 x 529 each and composited into one 1486 x 529 image. At the reference viewport, scale crop, negative space, header hierarchy, hero placement, type hierarchy, color balance, and copy match the selected composition. Differences in letter shapes, supporting-copy color, and exact Terracotta rendering are intentional official brand-system corrections already accepted in the prior implementation.

## Focused checks

- Fonts and typography: Martian Grotesk variable font remains active, official weights are unchanged, heading stays on one line at supported widths, and mobile copy wraps in three semantic line groups.
- Spacing and layout rhythm: the fixed-ratio centered canvas was removed. Landscape anchors the scale field to the right by height; portrait sizes it by width; mobile and short-landscape use compact overrides. Every captured viewport has document dimensions equal to viewport dimensions.
- Colors and visual tokens: Carbon canvas/text, muted Carbon body copy, and Terracotta CTA/image treatments are unchanged.
- Image quality and asset fidelity: the existing 1487 x 1058 authored raster field is used unchanged. No CSS, SVG, gradient, or generated substitute was introduced.
- Copy and content: heading, paragraph, CTA, logo, navigation labels, and project links are unchanged.
- Interaction: Projects opens at 390 x 844 without covering the hero. `coffee-chat` and `coffee-chat-eval` point to the intended OpenBoa GitHub repositories.
- Browser health: Chrome reported no warning or error logs during responsive and menu-state checks.

## Comparison history

1. Baseline audit found a P1 responsive composition problem: the fixed 1.405482-ratio frame created side letterboxing on wide screens and reduced the scale field to 720px on tall portrait screens, leaving it isolated from the hero.
2. The frame was changed to the full viewport, the landscape field was right-anchored by height, and portrait maximum width was increased to 1080px. Post-fix evidence is captured in `08-desktop-1440x900.png`, `09-wide-1728x900.png`, and `10-portrait-1280x1319.png`.
3. First mobile implementation capture exposed a P2 copy-flow issue: removing `<br>` elements concatenated adjacent text nodes. Each sentence group was wrapped in a block span for mobile. Post-fix evidence is `12-mobile-final-390x844.png`.
4. Final matrix found no remaining actionable P0, P1, or P2 overflow, collision, hierarchy, asset, interaction, or responsive issues. Some hero and scale bounding boxes overlap geometrically because the transparent raster canvas covers the viewport; visual screenshots confirm the opaque scales do not collide with text.

## Evidence limits

- Screenshot review does not establish full WCAG compliance. Semantic navigation, link destinations, disclosure behavior, focus CSS, responsive reflow, and browser logs were checked; assistive-technology announcements and 200% browser zoom need separate testing if certification is required.
- Focused crops were not necessary because the source-size full-view comparison keeps the header, hero typography, CTA, and scale edges readable at 1:2 display, while full-resolution captures remain available for inspection.

## Final result

passed
