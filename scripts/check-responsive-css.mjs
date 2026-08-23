import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const [css, page, landing, aperture, scaleField] = await Promise.all([
  readFile(new URL("../src/app/globals.css", import.meta.url), "utf8"),
  readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/components/openboa-landing.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/openboa/quiet-aperture.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/openboa/scale-field.ts", import.meta.url), "utf8"),
])

const mobileBlock = css.slice(css.indexOf("@media (max-width: 768px)"))
const checks = [
  ["landing owns the dynamic viewport", /\.landing\s*\{[^}]*width:\s*100vw;[^}]*height:\s*100vh;[^}]*height:\s*100dvh;/s.test(css)],
  ["WebGL field fills the landing", /#field\s*\{[^}]*inset:\s*0;[^}]*width:\s*100%;[^}]*height:\s*100%;/s.test(css)],
  ["fixed-ratio frame is absent", !css.includes("calc(100dvh * 1.405482)")],
  ["canonical 768px breakpoint is used", css.includes("@media (max-width: 768px)") && aperture.includes("mobileBreakpoint: 768")],
  ["mobile header separates logo and navigation", /\.brand\s*\{[^}]*top:\s*var\(--ob-space-16\);/s.test(mobileBlock) && /\.site-nav\s*\{[^}]*top:\s*52px;[^}]*left:\s*var\(--ob-space-20\);/s.test(mobileBlock)],
  ["mobile navigation keeps all three primary items", !/\.site-nav\s*>\s*a\s*\{[^}]*display:\s*none;/s.test(mobileBlock)],
  ["hero preserves the approved two-line message", /<span className="hero-line">Expanding the horizon of<\/span>(?:\s*\{" "\})?\s*<span className="hero-line">human possibility<\/span>/s.test(landing)],
  ["hero accessible text retains the line-break word boundary", /<\/span>\{" "\}\s*<span className="hero-line">human possibility<\/span>/s.test(landing)],
  ["mobile hero lines cannot wrap", /\.philosophy h1 \.hero-line\s*\{[^}]*display:\s*block;/s.test(css) && /\.philosophy h1 \.hero-line\s*\{[^}]*white-space:\s*nowrap;/s.test(mobileBlock) && /font-size:\s*min\(var\(--ob-type-hero-mobile-size\),\s*7vw\);/.test(mobileBlock)],
  ["About targets visible philosophy copy", /<p\s+id="about"\s+className="context"\s+tabIndex=\{-1\}>/s.test(landing) && !/<section\s+id="about"\s+className="sr-only"/s.test(landing)],
  ["visible philosophy subcopy is punctuated", /<p\s+id="about"\s+className="context"\s+tabIndex=\{-1\}>\s*OpenBoa explores this horizon through the Business of Agents\.\s*<\/p>/s.test(landing)],
  ["Escape focus return does not reopen Products", scaleField.includes("let suppressNextMenuFocusOpen = false") && scaleField.includes("if (suppressNextMenuFocusOpen)") && scaleField.includes("suppressNextMenuFocusOpen = true")],
  ["footer and social apertures remain local", landing.includes('className="site-footnote"') && landing.includes('className="site-social"')],
  ["products dropdown remains content-sized and label-aligned", /\.projects-popover\s*\{[^}]*left:\s*calc\(50% - 10px\);[^}]*width:\s*226px;/s.test(css)],
  ["landscape height receives a compact composition", css.includes("@media (max-height: 500px) and (orientation: landscape)")],
  ["reduced motion has an explicit fallback", css.includes("@media (prefers-reduced-motion: reduce)")],
  ["page renders the interactive landing", page.includes("<OpenBoaLanding />")],
]

const failures = checks.filter(([, passed]) => !passed)
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}
if (failures.length > 0) exit(1)
