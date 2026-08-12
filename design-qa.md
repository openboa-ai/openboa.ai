# Design QA

## Source visual

- Reference: `/Users/sangjoon/.codex/generated_images/019ff4fd-04f7-7fc0-a507-3d70327e1775/exec-7e9b2b70-7df2-4b55-998c-c4ce98060c02.png`
- Original dimensions: 1487 x 1058
- Target state: desktop landing page, Projects menu closed

## Implementation capture

- Chrome capture: `/Users/sangjoon/Coding/openboa.ai/qa/chrome-current.png`
- Primary browser viewport: 1280 x 1319
- Visible landing frame: 1280 x 911, centered without cropping
- Responsive captures: 390 x 844, 844 x 390, 768 x 1024, and 1440 x 900

## Full-view comparison

- Side-by-side comparison: `/Users/sangjoon/Coding/openboa.ai/qa/comparison-layered.png`
- Left: reference normalized to 1280 x 911
- Right: implementation frame at 1280 x 911

## Focused regions

1. Header and logo: checked official horizontal logo asset, navigation position, spacing, and project disclosure indicator.
2. Hero copy: checked heading origin, paragraph line breaks, CTA placement, and text hierarchy.
3. Scale field: checked crop, plate placement, inter-scale negative space, lower-edge lift, and shadow direction.
4. Brand rendering: checked Carbon canvas/text colors, official Terracotta treatment, Martian Grotesk product typography, and rasterized identity wordmark.

## Findings and iteration history

- Replaced the flattened reference screenshot with independently editable HTML for the navigation, heading, paragraph, and CTA.
- Replaced the flattened wordmark with the official transparent OpenBoa horizontal logo asset.
- Extracted a transparent, background-only scale field and recolored it with the official Terracotta token while preserving the selected source geometry and shading.
- Performed a second token audit after image correction: scale surfaces derive only from the official Terracotta 400/500/600/700 ramp and shadows use Blue Carbon 900 with alpha.
- Preserved the source composition inside a fixed-aspect responsive frame so the scale spacing and crop do not collapse at alternate viewport sizes.
- Verified portrait mobile, landscape mobile, tablet, and desktop viewports with no document overflow; small viewports use a full-height responsive composition, scale down and anchor the background asset independently, and progressively reduce navigation while keeping Projects available.
- Switched supporting copy to the official light-theme `text.muted` token, Carbon 500 (`#5D6A6E`), while retaining Carbon 900 for the headline and Terracotta 500 for the CTA.
- Corrected the implementation typography to the brand-system Martian Grotesk variable font; Pretendard is bundled as the Korean fallback.
- Verified the Projects disclosure and repository links in Chrome.
- Added official favicon, PWA icon, and Open Graph assets from the brand-system package and verified their source hashes.
- Added canonical metadata, crawl directives, sitemap, manifest, Organization/WebSite/WebPage JSON-LD, and `llms.txt` for machine-readable brand context.
- Matched canonical, sitemap, structured-data, and social-image URLs to the live `https://www.openboa.ai/` destination because the apex domain redirects there.
- Final visual comparison found no blocking layout, spacing, crop, typography, or asset mismatch. Small text-shape differences are intentional brand-system corrections from the generated reference.

## Final result

passed
