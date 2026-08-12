# OpenBoa Responsive Composition Design

## Outcome

The landing page uses the whole viewport at every size while preserving the selected desktop reference, official brand tokens, typography, copy, navigation, and the single background scale-field image.

## Responsive composition

- Landscape desktop uses the viewport as the frame. The scale field is sized from viewport height and anchored to the right edge, keeping the text near the left edge instead of centering a fixed-ratio canvas.
- Portrait tablet and portrait desktop size the scale field from viewport width with a larger maximum so it visually connects to the hero instead of becoming isolated in the lower-right corner.
- Mobile keeps only Projects in the primary navigation, moves the scale field upward, and allows body copy to wrap naturally while preserving the one-screen composition.
- Short landscape keeps the compact composition, with the scale field anchored to the right and the hero compressed vertically.

## Constraints

- Do not alter `public/openboa-scale-field.png`; a single raster asset preserves the authored scale shapes, perspective, crop, and negative spaces.
- Do not change OpenBoa colors, fonts, copy, logo, or project links.
- Do not introduce scrolling or horizontal overflow at supported viewport sizes.
- Projects must remain discoverable and keyboard-operable at every viewport.

## Verification matrix

- Mobile: 360 x 800, 390 x 844, 430 x 932
- Tablet portrait: 768 x 1024, 820 x 1180
- Landscape: 844 x 390, 1024 x 768
- Desktop: 1440 x 900, 1728 x 900
- Portrait desktop: 1280 x 1319

Acceptance requires no document overflow, no text/image collision, a visible scale field that connects to the hero, working Projects disclosure links, no browser console errors, and a passing visual comparison at the 1487 x 1058 source viewport.
