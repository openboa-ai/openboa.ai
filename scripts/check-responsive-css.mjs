import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const root = new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

const [
  css,
  layout,
  nextConfig,
  shell,
  stage,
  hud,
  homeView,
  approachView,
  visionView,
  holdControl,
  sitemap,
  llms,
] = await Promise.all([
  read("src/app/globals.css"),
  read("src/app/layout.tsx"),
  read("next.config.ts"),
  read("src/components/openboa-shell.tsx"),
  read("src/components/openboa-swarm-stage.tsx"),
  read("src/components/openboa-hud.tsx"),
  read("src/components/openboa-home-view.tsx"),
  read("src/components/openboa-approach-view.tsx"),
  read("src/components/openboa-vision-view.tsx"),
  read("src/components/vision-controls.tsx"),
  read("src/app/sitemap.ts"),
  read("public/llms.txt"),
])

const llmsCanonicalPaths = new Set(
  Array.from(llms.matchAll(/https:\/\/[^\s)]+/g), ([raw]) => {
    try {
      const parsed = new URL(raw)
      return parsed.origin === "https://www.openboa.ai" ? parsed.pathname : null
    } catch {
      return null
    }
  }).filter(Boolean),
)

const checks = [
  [
    "root layout mounts one persistent OpenBoa provider and shell",
    layout.includes("<OpenBoaProvider>") && layout.includes("<OpenBoaShell>{children}</OpenBoaShell>"),
  ],
  [
    "persistent shell mounts the single WebGL swarm stage outside route views",
    shell.includes("<OpenBoaSwarmStage />") &&
      !homeView.includes("<canvas") &&
      !approachView.includes("<canvas") &&
      !visionView.includes("<canvas"),
  ],
  [
    "persistent stage stays fixed and excluded from view-transition capture",
    /\.persistent-stage\s*\{[^}]*position:\s*fixed;[^}]*inset:\s*0;[^}]*view-transition-name:\s*none;/s.test(css),
  ],
  [
    "body prevents horizontal viewport overflow",
    /body\s*\{[^}]*overflow-x:\s*clip;/s.test(css),
  ],
  [
    "HUD exposes Home, Approach, and Vision across desktop and mobile navigation",
    hud.includes('href: "/"') &&
      hud.includes('href: "/approach"') &&
      hud.includes('href: "/vision"') &&
      hud.includes('aria-label="Primary"') &&
      hud.includes('aria-label="Primary mobile"') &&
      hud.includes("EXTERNAL_LINKS.github"),
  ],
  [
    "Home Act 01 uses responsive clamp display scale without duplicate Vision CTA",
    homeView.includes("clamp(3.15rem,9.4vw,8.7rem)") &&
      homeView.includes("<HoldToBreakControl />") &&
      !homeView.slice(0, homeView.indexOf("ACT 02")).includes('href="/vision"'),
  ],
  [
    "Home Act 02 connects to Approach and Act 03 connects to Vision and GitHub",
    homeView.includes('href="/approach"') &&
      homeView.includes('href="/vision"') &&
      homeView.includes("EXTERNAL_LINKS.github"),
  ],
  [
    "Hold control stays accessible with minimal chrome and keyboard support",
    holdControl.includes("aria-pressed={holding}") &&
      holdControl.includes('e.code === "Space"') &&
      holdControl.includes("bg-transparent border-0"),
  ],
  [
    "3D stage implements four distinct topologies including rectilinear Approach walls",
    stage.includes("aPosHome") &&
      stage.includes("aPosSphere") &&
      stage.includes("aPosHorizon") &&
      stage.includes("aPosApproach") &&
      stage.includes("portalGroup"),
  ],
  [
    "3D stage handles WebGL failure, context loss, hidden tabs, and reduced motion",
    stage.includes("webglcontextlost") &&
      stage.includes("webglcontextrestored") &&
      stage.includes("data-webgl-fallback") &&
      stage.includes("document.hidden") &&
      stage.includes("prefers-reduced-motion: reduce"),
  ],
  [
    "CSS provides explicit prefers-reduced-motion fallback",
    css.includes("@media (prefers-reduced-motion: reduce)"),
  ],
  [
    "legacy /about path redirects cleanly to /vision and retired /pattern route is absent",
    nextConfig.includes('source: "/about"') &&
      nextConfig.includes('destination: "/vision"') &&
      !existsSync(new URL("src/app/pattern/page.tsx", root)),
  ],
  [
    "sitemap covers /, /approach, and /vision without retired routes",
    sitemap.includes("/approach") &&
      sitemap.includes("/vision") &&
      !sitemap.includes("/about") &&
      !sitemap.includes("/pattern"),
  ],
  [
    "Home Act 01 renders the single first-entry OPENBOA -> BUSINESS OF AGENTS eyebrow morph while keeping header lockup uncluttered",
    homeView.includes("<OpenBoaBrandMorph") &&
      !hud.includes("<OpenBoaBrandMorph") &&
      css.includes(".boa-eyebrow-prefix") &&
      css.includes(".boa-eyebrow-tail"),
  ],
  [
    "Vision view includes the Open + Boa name-origin colophon",
    visionView.includes("openboa-name-origin") &&
      visionView.includes("OPENBOA_VISION.nameOrigin"),
  ],
  [
    "llms.txt publishes canonical vision, Business of Agents origin, and route directory",
    llms.includes("Every limit has a shelf life.") &&
      llms.includes("Business of Agents") &&
      llmsCanonicalPaths.has("/") &&
      llmsCanonicalPaths.has("/approach") &&
      llmsCanonicalPaths.has("/vision"),
  ],
]

const failures = checks.filter(([, passed]) => !passed)
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}
if (failures.length > 0) exit(1)
