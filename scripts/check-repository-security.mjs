import { existsSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { exit } from "node:process"

const root = new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

const [packageText, ci, dependencyReview, dependabot] = await Promise.all([
  read("package.json"),
  read(".github/workflows/ci.yml"),
  read(".github/workflows/dependency-review.yml"),
  read(".github/dependabot.yml"),
])

const packageJson = JSON.parse(packageText)
const directDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
}

function indentedBlock(source, key) {
  const lines = source.split("\n")
  const start = lines.findIndex((line) => line.trim() === key)

  if (start === -1) return ""

  const indentation = lines[start].match(/^\s*/)[0].length
  let end = start + 1

  while (end < lines.length) {
    const line = lines[end]
    if (line.trim() !== "" && line.match(/^\s*/)[0].length <= indentation) break
    end += 1
  }

  return lines.slice(start, end).join("\n")
}

function actionReferences(source) {
  return [...source.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)].map((match) => match[1])
}

const ciCheckout = indentedBlock(ci, "- name: Check out repository")
const dependencyCheckout = indentedBlock(dependencyReview, "- name: Check out repository")
const dependencyAction = indentedBlock(dependencyReview, "- name: Review dependency changes")
const productionGroup = indentedBlock(dependabot, "production-dependencies:")
const developmentGroup = indentedBlock(dependabot, "development-dependencies:")
const npmUpdate = indentedBlock(dependabot, "- package-ecosystem: npm")

const removedDependencies = [
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "radix-ui",
  "tailwind-merge",
  "tw-animate-css",
]

const removedPaths = [
  "components.json",
  "src/components/ui/badge.tsx",
  "src/components/ui/button.tsx",
  "src/components/ui/card.tsx",
  "src/components/ui/separator.tsx",
  "src/lib/landing-content.ts",
  "src/lib/utils.ts",
]

const actions = [...actionReferences(ci), ...actionReferences(dependencyReview)]
const groupedUpdateTypes = (block) =>
  /update-types:\s*\n\s+- minor\s*\n\s+- patch/.test(block) && !/\n\s+- major\s*(?:\n|$)/.test(block)

const checks = [
  ["unused direct dependencies are absent", removedDependencies.every((name) => !(name in directDependencies))],
  ["unused scaffold paths are absent", removedPaths.every((path) => !existsSync(new URL(path, root)))],
  ["all workflow actions use full commit SHAs", actions.length > 0 && actions.every((reference) => /@[0-9a-f]{40}$/.test(reference))],
  ["CI checkout does not persist credentials", /persist-credentials:\s*false/.test(ciCheckout)],
  ["CI runs the TypeScript no-emit check", /run:\s*pnpm exec tsc --noEmit/.test(ci)],
  ["Dependency Review checkout does not persist credentials", /persist-credentials:\s*false/.test(dependencyCheckout)],
  ["Dependency Review blocks runtime and development scopes", /fail-on-scopes:\s*runtime,development/.test(dependencyAction)],
  ["Dependency Review reports patched versions", /show-patched-versions:\s*true/.test(dependencyAction)],
  ["Dependabot limits npm pull requests to five", /open-pull-requests-limit:\s*5/.test(npmUpdate)],
  ["Dependabot groups production minor and patch updates only", groupedUpdateTypes(productionGroup)],
  ["Dependabot groups development minor and patch updates only", groupedUpdateTypes(developmentGroup)],
]

const failures = checks.filter(([, passed]) => !passed)

for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}

if (failures.length > 0) exit(1)
