import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const css = await readFile(new URL("../src/app/globals.css", import.meta.url), "utf8")
const page = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8")

const checks = [
  ["full viewport frame width", /\.landing-frame\s*\{[^}]*width:\s*100vw;/s.test(css)],
  ["full viewport frame height", /\.landing-frame\s*\{[^}]*height:\s*100dvh;/s.test(css)],
  ["fixed-ratio frame is removed", !css.includes("calc(100dvh * 1.405482)")],
  ["landscape field is right anchored", /\.scale-field\s*\{[^}]*right:\s*0;[^}]*height:\s*100%;/s.test(css)],
  ["portrait field can grow past 720px", /@media \(max-aspect-ratio:\s*1\s*\/\s*1\)[\s\S]*?\.scale-field\s*\{[^}]*width:\s*min\(94vw,\s*1080px\);/s.test(css)],
  ["mobile navigation keeps Projects as the primary item", /@media \(max-width:\s*720px\)[\s\S]*?\.site-nav\s*>\s*a\s*\{[^}]*display:\s*none;/s.test(css)],
  ["mobile copy wraps naturally", /@media \(max-width:\s*720px\)[\s\S]*?\.desktop-break\s*\{[^}]*display:\s*none;/s.test(css)],
  ["authored line breaks are marked", /<br className="desktop-break"\s*\/>/.test(page)],
]

const failures = checks.filter(([, passed]) => !passed)

for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}

if (failures.length > 0) {
  exit(1)
}
