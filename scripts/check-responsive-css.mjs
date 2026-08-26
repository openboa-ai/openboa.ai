import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const [
  css,
  page,
  layout,
  landing,
  experience,
  experienceContext,
  story,
  vision,
  about,
  aperture,
  experienceAperture,
  scaleField,
  patternPage,
  patternBehaviorStudy,
  sitemap,
] = await Promise.all([
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/layout.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/openboa-landing.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/openboa-experience.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/openboa-experience-context.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/use-openboa-story.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/openboa-vision.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/openboa-about.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/openboa/quiet-aperture.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/openboa/experience-aperture.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/openboa/scale-field.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/pattern/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/openboa/pattern-behavior-study.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/sitemap.ts", import.meta.url), "utf8"),
])

const mobileBlock = css.slice(css.indexOf("@media (max-width: 768px)"))
const checks = [
  ["landing owns the dynamic viewport", /\.landing\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100vh;[^}]*height:\s*100dvh;/s.test(css)],
  ["persistent shell owns the only WebGL canvas", experience.includes('<canvas id="field"') && !landing.includes("<canvas") && !vision.includes("<canvas") && !about.includes("<canvas")],
  ["WebGL field remains fixed across routes", /#field\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100dvh;/s.test(css)],
  ["root layout keeps one persistent experience shell", layout.includes("<OpenBoaExperience>{children}</OpenBoaExperience>")],
  ["primary navigation uses in-place experience links", experience.includes('href="/vision"') && experience.includes('href="/about"') && experience.includes("ExperienceLink")],
  ["route text exits before the visual scene changes", experienceContext.includes('setPhase("exiting")') && experienceContext.includes("}, 240)") && experienceContext.includes('setPhase("entering")')],
  ["fixed-ratio frame is absent", !css.includes("calc(100dvh * 1.405482)")],
  ["canonical 768px breakpoint is used", css.includes("@media (max-width: 768px)") && aperture.includes("mobileBreakpoint: 768")],
  ["mobile header separates logo and navigation", /\.brand\s*\{[^}]*top:\s*var\(--ob-space-16\);/s.test(mobileBlock) && /\.site-nav\s*\{[^}]*top:\s*52px;[^}]*right:\s*var\(--ob-space-20\);[^}]*left:\s*var\(--ob-space-20\);/s.test(mobileBlock)],
  ["mobile navigation keeps all three primary items", !/\.site-nav\s*>\s*a\s*\{[^}]*display:\s*none;/s.test(mobileBlock)],
  ["hero preserves the approved two-line message", /<span className="hero-line">Expanding the horizon of<\/span>(?:\s*\{" "\})?\s*<span className="hero-line">human possibility<\/span>/s.test(landing)],
  ["hero accessible text retains the line-break word boundary", /<\/span>\{" "\}\s*<span className="hero-line">human possibility<\/span>/s.test(landing)],
  ["mobile hero lines cannot wrap", /\.philosophy h1 \.hero-line\s*\{[^}]*display:\s*block;/s.test(css) && /\.philosophy h1 \.hero-line\s*\{[^}]*white-space:\s*nowrap;/s.test(mobileBlock) && /font-size:\s*min\(var\(--ob-type-hero-mobile-size\),\s*6\.65vw\);/.test(mobileBlock)],
  ["visible philosophy subcopy is punctuated", /<p\s+className="context"\s+data-landing-aperture>\s*OpenBoa explores this horizon through the Business of Agents\.\s*<\/p>/s.test(landing)],
  ["Escape focus return does not reopen Products", scaleField.includes("let suppressNextMenuFocusOpen = false") && scaleField.includes("if (suppressNextMenuFocusOpen)") && scaleField.includes("suppressNextMenuFocusOpen = true")],
  ["Products supports hover-capable pointers and click-to-pin on touch", scaleField.includes('event.pointerType !== "mouse"') && scaleField.includes("projectsMenuPinned = !projectsMenuPinned") && css.includes("@media (hover: hover) and (pointer: fine)") && /\.projects-menu\[open\] \.projects-popover\s*\{[^}]*visibility:\s*visible;/s.test(css)],
  ["header footer and social shell remain fixed across story routes", experience.includes('className="site-footnote"') && experience.includes('className="site-social"') && !experience.includes('aria-hidden={scene !== "landing"}') && /\.site-footnote\s*\{[^}]*position:\s*fixed;/s.test(css) && /\.site-social\s*\{[^}]*position:\s*fixed;/s.test(css)],
  ["products dropdown remains content-sized and label-aligned", /\.projects-popover\s*\{[^}]*left:\s*calc\(50% - 10px\);[^}]*width:\s*226px;/s.test(css)],
  ["Vision carries four semantic statements without slide counters", vision.includes("useOpenBoaStory(statements.length)") && vision.includes('behavior: "alignment"') && vision.includes('behavior: "relay"') && vision.includes('behavior: "synthesis"') && vision.includes('behavior: "horizon"') && !vision.includes("01 / 04") && !vision.includes("Latent alignment")],
  ["Vision aperture morphs organic reading fields into a horizon", experienceAperture.includes("sampleOrganicField") && experienceAperture.includes("sampleVisionChapter") && experienceAperture.includes("chapterPhase(storyProgress, 3)") && experienceAperture.includes("const halfHeight = mobile ? 0.245 : 0.255")],
  ["internal apertures merge terracotta scales continuously into off-white", scaleField.includes("scenePaperMix = landingPaperMix * (1.0 - internalSceneMix)") && scaleField.includes("landingNavPaperMix = v_nav_aperture * (1.0 - internalSceneMix)") && scaleField.includes("float warmBridge = smoothstep(0.02, 0.66, internalQuiet)") && scaleField.includes("float offWhiteMerge = smoothstep(0.16, 0.84, internalQuiet)") && !scaleField.includes("float contentCut = step") && !scaleField.includes("float navCut = step")],
  ["About uses the approved headline", about.includes("OpenBoa develops") && about.includes("<em>AI-native businesses</em>") && about.includes("and products.")],
  ["About uses formation, orbit, and loom material scenes", about.includes('data-behavior="formation"') && about.includes('data-behavior="orbit"') && about.includes('data-behavior="loom"') && scaleField.includes("formationFlow") && scaleField.includes("coilFlow") && scaleField.includes("loomFlow")],
  ["story apertures merge measured line fragments into compact organic fields", scaleField.includes("measureStoryTarget") && scaleField.includes("textFragmentBounds") && scaleField.includes("visionApertureBounds") && scaleField.includes("aboutApertureBounds") && vision.includes("data-aperture-copy") && about.includes("data-aperture-copy") && experienceAperture.includes("sampleInkFragment") && experienceAperture.includes("corePaddingX: mobile ? 14 : 20") && experienceAperture.includes("featherX: mobile ? 46")],
  ["Vision and About share the official landing scale field", scaleField.includes("sampleVisionAperture") && scaleField.includes("sampleAboutAperture") && scaleField.includes('/textures/openboa-scale-cutout-aa-1024.png')],
  ["scene-specific material flows are authored in the persistent field", scaleField.includes("alignmentFlow") && scaleField.includes("relayFlow") && scaleField.includes("confluenceFlow") && scaleField.includes("horizonFlow") && scaleField.includes("formationFlow") && scaleField.includes("coilFlow") && scaleField.includes("loomFlow")],
  ["scroll reorganizes one pinned material field instead of moving slides through the viewport", /\.story-page\s*\{[^}]*min-height:\s*calc\(var\(--story-scenes\) \* 100svh\);/s.test(css) && /\.story-stage\s*\{[^}]*position:\s*sticky;[^}]*height:\s*100svh;/s.test(css) && /\.story-scene\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0;/s.test(css)],
  ["story copy clears before the next statement enters", experienceContext.includes('setPhase("exiting")') && story.includes("index - 0.54 + enterOffset") && story.includes("index + 0.22 + exitOffset") && !story.includes("clipPath")],
  ["story copy motion is driven by the selected material behavior", story.includes('export type StoryMotion') && story.includes("storyMotionVector") && vision.includes("statement.behavior") && about.includes('"formation"') && about.includes('"orbit"') && about.includes('"loom"')],
  ["mobile story composition preserves readable single-column content", /\.story-scene\s*\{[^}]*padding:\s*116px var\(--ob-space-24\) var\(--ob-space-48\);/s.test(mobileBlock) && /\.about-product-list\s*\{[^}]*grid-template-columns:\s*1fr;/s.test(mobileBlock)],
  ["landscape height receives a compact composition", css.includes("@media (max-height: 500px) and (orientation: landscape)")],
  ["reduced motion has an explicit fallback", css.includes("@media (prefers-reduced-motion: reduce)")],
  ["page renders the interactive landing", page.includes("<OpenBoaLanding />")],
  ["pattern study remains available only by direct route", patternPage.includes("<OpenBoaVisionLab />") && experience.includes('pathname.startsWith("/pattern")')],
  ["pattern study stays out of navigation", !experience.includes('href="/pattern"')],
  ["pattern study asks search engines not to index or follow", patternPage.includes("robots: { index: false, follow: false }")],
  ["pattern study stays out of the public sitemap", !sitemap.includes("/pattern")],
  ["pattern behavior vocabulary preserves retained and parked studies", patternBehaviorStudy.includes("retainedPatternBehaviorNames") && patternBehaviorStudy.includes("parkedPatternBehaviorNames") && patternBehaviorStudy.includes('"Braided Bifurcation"') && patternBehaviorStudy.includes('"Peristaltic Transit"')],
]

const failures = checks.filter(([, passed]) => !passed)
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}
if (failures.length > 0) exit(1)
