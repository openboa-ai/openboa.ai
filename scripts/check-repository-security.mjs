import { existsSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { exit } from "node:process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"

const root = process.env.REPOSITORY_SECURITY_ROOT
  ? pathToFileURL(`${resolve(process.env.REPOSITORY_SECURITY_ROOT)}/`)
  : new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

const [packageText, ci, dependencyReview, dependabot, workflowFiles] = await Promise.all([
  read("package.json"),
  read(".github/workflows/ci.yml"),
  read(".github/workflows/dependency-review.yml"),
  read(".github/dependabot.yml"),
  readdir(new URL(".github/workflows/", root), { withFileTypes: true }),
])
const workflows = await Promise.all(
  workflowFiles
    .filter((entry) => entry.isFile() && /\.ya?ml$/.test(entry.name))
    .map(async (entry) => ({
      name: entry.name,
      source: await read(`.github/workflows/${entry.name}`),
    })),
)

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

function topLevelBlock(source, key) {
  const lines = source.split("\n")
  const start = lines.findIndex((line) => line === key)

  if (start === -1) return ""

  let end = start + 1
  while (end < lines.length && (lines[end].trim() === "" || /^\s/.test(lines[end]))) end += 1

  return lines.slice(start, end).join("\n")
}

function actionReferences(source) {
  return [...source.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)(?:\s+#.*)?$/gm)].map((match) => match[1])
}

function activeUsesLines(source) {
  return source
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"))
    .filter((line) => /(?:^|[^A-Za-z0-9_])(?:uses|["']uses["'])\s*:/.test(line))
}

// Without a YAML parser, fail closed: active `uses` keys must use the canonical
// line-style scalar form. Flow mappings, quoted keys, and other forms are rejected.
function hasOnlyCanonicalPinnedActions(source) {
  return activeUsesLines(source).every((line) =>
    /^\s*(?:-\s*)?uses:\s*[^\s#]+@[0-9a-f]{40}\s*(?:#.*)?$/.test(line),
  )
}

function hasYamlValue(block, key, value) {
  return new RegExp(`^\\s*${key}:\\s*${value}\\s*(?:#.*)?$`, "m").test(block)
}

function listEquals(block, key, values) {
  const list = indentedBlock(block, `${key}:`)
  const activeLines = list
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))

  return JSON.stringify(activeLines) === JSON.stringify(values.map((value) => `- ${value}`))
}

function hasReadOnlyPermissions(source) {
  const activeLines = topLevelBlock(source, "permissions:")
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))

  return JSON.stringify(activeLines) === JSON.stringify(["contents: read"])
}

function hasNoIndentedPermissions(source) {
  return source
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"))
    .every((line) => !/^\s+permissions\s*:/.test(line))
}

function hasYamlKey(block, key) {
  return new RegExp(`^\\s*${key}:`, "m").test(block)
}

function hasExactlyTopLevelMappingKeys(block, expectedKeys) {
  const directLines = block
    .split("\n")
    .slice(1)
    .filter((line) => line.trim() !== "" && !line.trimStart().startsWith("#"))
    .filter((line) => /^ {2}\S/.test(line))
  // Trigger keys also use a deliberately narrow block form so unknown valid-YAML
  // alternatives cannot disappear from the exact-trigger comparison.
  const matches = directLines.map((line) => line.match(/^ {2}([A-Za-z0-9_-]+):\s*(?:#.*)?$/))

  if (matches.some((match) => match === null)) return false

  const keys = matches.map((match) => match[1])

  return JSON.stringify([...keys].sort()) === JSON.stringify([...expectedKeys].sort())
}

const ciCheckout = indentedBlock(ci, "- name: Check out repository")
const ciResponsive = indentedBlock(ci, "- name: Check responsive composition")
const ciTypeCheck = indentedBlock(ci, "- name: Type check")
const ciLint = indentedBlock(ci, "- name: Lint")
const ciVerify = indentedBlock(ci, "verify:")
const ciRepositorySecurity = indentedBlock(ciVerify, "- name: Check repository security contract")
const ciTriggers = topLevelBlock(ci, "on:")
const dependencyCheckout = indentedBlock(dependencyReview, "- name: Check out repository")
const dependencyAction = indentedBlock(dependencyReview, "- name: Review dependency changes")
const dependencyJob = indentedBlock(dependencyReview, "dependency-review:")
const dependencyTriggers = topLevelBlock(dependencyReview, "on:")
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

const repositorySecurityCommand =
  "node --test scripts/check-repository-security.test.mjs && node scripts/check-repository-security.mjs"

const actions = workflows.flatMap(({ source }) => actionReferences(source))
const allActiveUsesAreCanonicalAndPinned = workflows.every(({ source }) => hasOnlyCanonicalPinnedActions(source))
const allWorkflowPermissionsAreReadOnly = workflows.every(({ source }) => hasReadOnlyPermissions(source))
const workflowsHaveNoPermissionOverrides = workflows.every(({ source }) => hasNoIndentedPermissions(source))
const ciTypeCheckIsOrdered =
  hasYamlValue(ciResponsive, "run", "pnpm test:responsive") &&
  hasYamlValue(ciTypeCheck, "run", "pnpm exec tsc --noEmit") &&
  hasYamlValue(ciLint, "run", "pnpm lint") &&
  ci.indexOf("- name: Check responsive composition") < ci.indexOf("- name: Type check") &&
  ci.indexOf("- name: Type check") < ci.indexOf("- name: Lint")
const ciContractIsPreserved =
  hasYamlKey(ciTriggers, "pull_request") &&
  hasYamlKey(ciTriggers, "push") &&
  hasYamlKey(ciTriggers, "merge_group") &&
  listEquals(indentedBlock(ciTriggers, "push:"), "branches", ["main"]) &&
  hasYamlValue(ciVerify, "name", "verify") &&
  hasYamlValue(ciVerify, "timeout-minutes", "15")
const dependencyReviewContractIsPreserved =
  hasYamlKey(dependencyTriggers, "pull_request") &&
  hasYamlValue(dependencyJob, "name", "dependency-review") &&
  hasYamlValue(dependencyJob, "timeout-minutes", "10")
const ciHasExactlyApprovedTriggers =
  hasExactlyTopLevelMappingKeys(ciTriggers, ["pull_request", "push", "merge_group"]) &&
  listEquals(indentedBlock(ciTriggers, "push:"), "branches", ["main"])
const dependencyReviewHasExactlyApprovedTriggers = hasExactlyTopLevelMappingKeys(dependencyTriggers, ["pull_request"])
const groupedUpdateTypes = (block) => listEquals(block, "update-types", ["minor", "patch"])
const hasGroupSemantics = (block, dependencyType) =>
  hasYamlValue(block, "dependency-type", dependencyType) && listEquals(block, "patterns", ['"*"'])

const checks = [
  ["unused direct dependencies are absent", removedDependencies.every((name) => !(name in directDependencies))],
  ["unused scaffold paths are absent", removedPaths.every((path) => !existsSync(new URL(path, root)))],
  [
    "package repository-security command runs fixtures and production checker",
    packageJson.scripts?.["test:repository-security"] === repositorySecurityCommand,
  ],
  ["all workflow actions use full commit SHAs", actions.length > 0 && actions.every((reference) => /@[0-9a-f]{40}$/.test(reference))],
  ["every active uses mapping is canonical and pinned to a full commit SHA", allActiveUsesAreCanonicalAndPinned],
  ["CI workflow permissions are read-only", hasReadOnlyPermissions(ci)],
  ["Dependency Review workflow permissions are read-only", hasReadOnlyPermissions(dependencyReview)],
  ["every workflow has explicit read-only permissions", allWorkflowPermissionsAreReadOnly],
  ["workflow jobs do not override permissions", workflowsHaveNoPermissionOverrides],
  ["CI retains its trigger, job, and timeout contract", ciContractIsPreserved],
  ["Dependency Review retains its trigger, job, and timeout contract", dependencyReviewContractIsPreserved],
  ["CI has exactly the approved triggers", ciHasExactlyApprovedTriggers],
  ["Dependency Review has exactly the approved triggers", dependencyReviewHasExactlyApprovedTriggers],
  ["CI checkout does not persist credentials", hasYamlValue(ciCheckout, "persist-credentials", "false")],
  [
    "CI runs the repository-security command in the verify job",
    hasYamlValue(ciRepositorySecurity, "run", "pnpm test:repository-security"),
  ],
  ["CI runs the TypeScript no-emit check after responsive composition and before lint", ciTypeCheckIsOrdered],
  ["Dependency Review checkout does not persist credentials", hasYamlValue(dependencyCheckout, "persist-credentials", "false")],
  ["Dependency Review blocks moderate and higher severity changes", hasYamlValue(dependencyAction, "fail-on-severity", "moderate")],
  ["Dependency Review blocks runtime and development scopes", hasYamlValue(dependencyAction, "fail-on-scopes", "runtime,development")],
  ["Dependency Review reports patched versions", hasYamlValue(dependencyAction, "show-patched-versions", "true")],
  ["Dependabot limits npm pull requests to five", hasYamlValue(npmUpdate, "open-pull-requests-limit", "5")],
  ["Dependabot production group keeps production wildcard semantics", hasGroupSemantics(productionGroup, "production")],
  ["Dependabot development group keeps development wildcard semantics", hasGroupSemantics(developmentGroup, "development")],
  ["Dependabot groups production minor and patch updates only", groupedUpdateTypes(productionGroup)],
  ["Dependabot groups development minor and patch updates only", groupedUpdateTypes(developmentGroup)],
]

const failures = checks.filter(([, passed]) => !passed)

for (const [name, passed] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${name}`)
}

if (failures.length > 0) exit(1)
