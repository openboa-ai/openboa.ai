import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const root = new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")
const digest = async (path) =>
  createHash("sha256")
    .update(await readFile(new URL(path, root)))
    .digest("hex")

const [generatedCss, generatedValues, globals, layout, brand] = await Promise.all([
  read("src/design-system/generated/openboa-tokens.css"),
  read("src/design-system/generated/openboa-token-values.ts"),
  read("src/app/globals.css"),
  read("src/app/layout.tsx"),
  read("src/lib/brand.ts"),
])

const [snapshotHash, fontHash, iconHash] = await Promise.all([
  digest("src/design-system/openboa.tokens.json"),
  digest("public/fonts/rethink-sans/rethink-sans.woff2"),
  digest("src/app/icon.svg"),
])

const expectedCommit = "8c0de34ce2bcf795c44e28c406a6070fd1a4eaca"
const expectedLayerHeader =
  "@layer theme, base, ui-sdk, yg.tokens, yg.base, yg.components, yg.patterns, yg.utilities, components, utilities;"

const checks = [
  [
    "canonical Yogurt token snapshot hash is pinned",
    snapshotHash === "f42926bd163c21e0e8fc74f9924dfbae88ce23e5aee3edff843cd06a25564993",
  ],
  [
    "generated outputs retain @openboa/yogurt provenance",
    generatedCss.includes(expectedCommit) && generatedValues.includes(expectedCommit),
  ],
  [
    "canonical Ink Blue and neutral tokens are generated",
    [
      "--ob-color-brand-ink-light: #175174",
      "--ob-color-brand-ink-dark: #79B3D6",
      "--ob-color-canvas-light: #FFFFFF",
      "--ob-color-canvas-dark: #0A0A0D",
      '--ob-font-sans: "Rethink Sans"',
    ].every((value) => generatedCss.includes(value)),
  ],
  [
    "globals.css opens with canonical Tailwind v4 + Yogurt cascade order",
    globals.trimStart().startsWith(expectedLayerHeader) &&
      globals.includes('@import "@openboa/yogurt/styles.css";'),
  ],
  [
    "authored globals.css consumes aliases without raw hex colors",
    !/#[0-9a-f]{3,8}\b/i.test(globals) && globals.includes("var(--ob-stage-light)"),
  ],
  [
    "canonical self-hosted Rethink Sans variable font and OFL notice exist",
    fontHash === "e0da5e70471ac9d33fa63daa411dee915e2fcfdf0e7989a43227e070955b4598" &&
      existsSync(new URL("public/fonts/rethink-sans/OFL.txt", root)),
  ],
  [
    "canonical Upright 9 icon asset is exact",
    iconHash === "48f80de860ae85f0f2801fe91d02dde49d7ffd25b22c81061ad2c41ac43b5155",
  ],
  [
    "canonical vision statement is authored in brand module",
    brand.includes("Every limit has a shelf life.") &&
      brand.includes(
        "Nothing is permanently out of reach. OpenBoa exists to break what stands between imagination and reality.",
      ),
  ],
  [
    "English-only typography excludes Pretendard and retired font assets",
    !layout.includes("Pretendard") &&
      !existsSync(new URL("public/fonts/PretendardVariable.woff2", root)) &&
      !existsSync(new URL("public/fonts/MartianGrotesk-wdth-wght.ttf", root)),
  ],
]

const failures = checks.filter(([, passed]) => !passed)
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}
if (failures.length > 0) exit(1)
