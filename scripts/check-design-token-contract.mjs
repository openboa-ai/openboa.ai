import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const root = new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")
const digest = async (path) => createHash("sha256")
  .update(await readFile(new URL(path, root)))
  .digest("hex")

const [snapshot, generatedCss, generatedValues, globals, field, layout, quietAperture] = await Promise.all([
  read("src/design-system/openboa.tokens.json"),
  read("src/design-system/generated/openboa-tokens.css"),
  read("src/design-system/generated/openboa-token-values.ts"),
  read("src/app/globals.css"),
  read("src/lib/openboa/scale-field.ts"),
  read("src/app/layout.tsx"),
  read("src/lib/openboa/quiet-aperture.ts"),
])

const [snapshotHash, logoHash, fontHash, textureHash] = await Promise.all([
  digest("src/design-system/openboa.tokens.json"),
  digest("public/openboa-logo-horizontal.png"),
  digest("public/fonts/MartianGrotesk-wdth-wght.ttf"),
  digest("public/textures/openboa-scale-cutout-aa-1024.png"),
])

const expectedSource = "e93f55cbfd90b668ef9d77875f71d8e53f7ceb4b"
const checks = [
  ["canonical token snapshot hash is pinned", snapshotHash === "63d0e9b046cedbd4ee062baac3f4972e2617c69ebdbd2c623c4bf9a4a8faa4b1"],
  ["generated outputs retain brand-system provenance", generatedCss.includes(expectedSource) && generatedValues.includes(expectedSource)],
  ["only current token language ships", !snapshot.includes("$deprecated")],
  ["semantic canvas, expression, muted, accent, and selection colors are generated", ["--ob-color-canvas: #F8F8F5", "--ob-color-text-expression: #090D12", "--ob-color-text-muted: #5D6A6E", "--ob-color-text-accent: #A64F3C", "--ob-color-selection-fill: #F1E5E0"].every((value) => generatedCss.includes(value))],
  ["approved semantic typography roles are generated", ["--ob-type-hero-size: 56px", "--ob-type-hero-mobile-size: 32px", "--ob-type-body-size: 14px", "--ob-type-label-size: 14px", "--ob-type-caption-size: 11px"].every((value) => generatedCss.includes(value))],
  ["authored landing CSS consumes aliases without raw hex colors", !/#[0-9a-f]{3,8}\b/i.test(globals) && globals.includes("var(--ob-color-text-expression)")],
  ["living-scale background is intentionally independent from UI color tokens", !field.includes("OPENBOA_COLORS") && field.includes("APPROVED_BACKGROUND_PAPER")],
  ["approved v33 background restores continuous tonal flow", field.includes("a_weight * 0.04") && field.includes("mix(terracotta100, terracotta500, tone)")],
  [
    "central title aperture uses the approved wide horizontal feather expansion",
    [
      "innerEdge: 0.45",
      "featherXMin: 79.2",
      "featherXMax: 244.8",
      "featherXViewportRatio: 0.19125",
      "featherYMin: 81.2",
      "featherYMax: 128.8",
      "featherYViewportRatio: 0.100625",
    ].every((value) => quietAperture.includes(value)),
  ],
  ["official 320px identity lockup is exact", logoHash === "4a012c596390ec582244b371d3dacc2019b56334e4e33cd5250101b951dbad59"],
  ["canonical Martian Grotesk font is exact", fontHash === "f81807163c34ff754e6d915b0b59f76cca88332b67c45cfc7453ace5751ae912"],
  ["approved antialiased scale cutout is exact", textureHash === "c48e949094ef64a11a376b4e19369380f52b5ba8f6102513f62ccb025fea4616"],
  ["English-only typography excludes Pretendard runtime assets", !layout.includes("Pretendard") && !existsSync(new URL("public/fonts/PretendardVariable.woff2", root))],
]

const failures = checks.filter(([, passed]) => !passed)
for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}
if (failures.length > 0) exit(1)
