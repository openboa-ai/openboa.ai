import { existsSync } from "node:fs"
import { readFile, readdir } from "node:fs/promises"
import { exit } from "node:process"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { load as loadYaml } from "js-yaml"

const root = process.env.REPOSITORY_SECURITY_ROOT
  ? pathToFileURL(`${resolve(process.env.REPOSITORY_SECURITY_ROOT)}/`)
  : new URL("../", import.meta.url)
const read = (path) => readFile(new URL(path, root), "utf8")

const [packageText, dependabot, workflowFiles] = await Promise.all([
  read("package.json"),
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

function isMapping(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function parseWorkflow(workflow) {
  try {
    const document = loadYaml(workflow.source)

    return {
      ...workflow,
      document: isMapping(document) ? document : null,
      parsedAsMapping: isMapping(document),
    }
  } catch {
    return { ...workflow, document: null, parsedAsMapping: false }
  }
}

function mappingKeysEqual(value, expectedKeys) {
  if (!isMapping(value)) return false

  return JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expectedKeys].sort())
}

function collectMappingValues(node, key, values = [], seen = new WeakSet()) {
  if (node === null || typeof node !== "object" || seen.has(node)) return values

  seen.add(node)

  if (Array.isArray(node)) {
    for (const item of node) collectMappingValues(item, key, values, seen)
    return values
  }

  for (const [mappingKey, value] of Object.entries(node)) {
    if (mappingKey === key) values.push(value)
    collectMappingValues(value, key, values, seen)
  }

  return values
}

function isFullShaActionReference(reference) {
  if (typeof reference !== "string" || reference.length < 41) return false

  return reference.at(-41) === "@" && /^[0-9a-f]{40}$/.test(reference.slice(-40))
}

function hasReadOnlyPermissions(workflow) {
  const permissions = workflow?.permissions

  return mappingKeysEqual(permissions, ["contents"]) && permissions.contents === "read"
}

function hasNoJobPermissions(workflow) {
  if (!isMapping(workflow?.jobs)) return true

  return Object.values(workflow.jobs).every(
    (job) => !isMapping(job) || !Object.prototype.hasOwnProperty.call(job, "permissions"),
  )
}

function hasTriggerKeys(workflow, keys) {
  return isMapping(workflow?.on) && keys.every((key) => Object.prototype.hasOwnProperty.call(workflow.on, key))
}

function hasMainOnlyPushBranches(workflow) {
  return (
    isMapping(workflow?.on?.push) &&
    Array.isArray(workflow.on.push.branches) &&
    JSON.stringify(workflow.on.push.branches) === JSON.stringify(["main"])
  )
}

function workflowJob(workflow, name) {
  return isMapping(workflow?.jobs?.[name]) ? workflow.jobs[name] : null
}

function jobSteps(job) {
  return Array.isArray(job?.steps) ? job.steps.filter(isMapping) : []
}

function namedStep(job, name) {
  return jobSteps(job).find((step) => step.name === name)
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

const parsedWorkflows = workflows.map(parseWorkflow)
const workflowsParseAsMappings = parsedWorkflows.every(({ parsedAsMapping }) => parsedAsMapping)
const ciWorkflow = parsedWorkflows.find(({ name }) => name === "ci.yml")?.document
const dependencyReviewWorkflow = parsedWorkflows.find(({ name }) => name === "dependency-review.yml")?.document
const ciVerify = workflowJob(ciWorkflow, "verify")
const dependencyJob = workflowJob(dependencyReviewWorkflow, "dependency-review")
const ciCheckout = namedStep(ciVerify, "Check out repository")
const ciRepositorySecurity = namedStep(ciVerify, "Check repository security contract")
const dependencyCheckout = namedStep(dependencyJob, "Check out repository")
const dependencyAction = namedStep(dependencyJob, "Review dependency changes")
const actions = parsedWorkflows.flatMap(({ document }) => collectMappingValues(document, "uses"))
const allWorkflowPermissionsAreReadOnly = parsedWorkflows.every(({ document }) => hasReadOnlyPermissions(document))
const workflowsHaveNoPermissionOverrides = parsedWorkflows.every(({ document }) => hasNoJobPermissions(document))
const ciSteps = jobSteps(ciVerify)
const ciResponsiveIndex = ciSteps.findIndex(({ name }) => name === "Check responsive composition")
const ciTypeCheckIndex = ciSteps.findIndex(({ name }) => name === "Type check")
const ciLintIndex = ciSteps.findIndex(({ name }) => name === "Lint")
const ciTypeCheckIsOrdered =
  ciResponsiveIndex !== -1 &&
  ciSteps[ciResponsiveIndex].run === "pnpm test:responsive" &&
  ciTypeCheckIndex !== -1 &&
  ciSteps[ciTypeCheckIndex].run === "pnpm exec tsc --noEmit" &&
  ciLintIndex !== -1 &&
  ciSteps[ciLintIndex].run === "pnpm lint" &&
  ciResponsiveIndex < ciTypeCheckIndex &&
  ciTypeCheckIndex < ciLintIndex
const ciContractIsPreserved =
  hasTriggerKeys(ciWorkflow, ["pull_request", "push", "merge_group"]) &&
  hasMainOnlyPushBranches(ciWorkflow) &&
  ciVerify?.name === "verify" &&
  ciVerify?.["timeout-minutes"] === 15
const dependencyReviewContractIsPreserved =
  hasTriggerKeys(dependencyReviewWorkflow, ["pull_request"]) &&
  dependencyJob?.name === "dependency-review" &&
  dependencyJob?.["timeout-minutes"] === 10
const ciHasExactlyApprovedTriggers =
  mappingKeysEqual(ciWorkflow?.on, ["pull_request", "push", "merge_group"]) && hasMainOnlyPushBranches(ciWorkflow)
const dependencyReviewHasExactlyApprovedTriggers = mappingKeysEqual(dependencyReviewWorkflow?.on, ["pull_request"])
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
  ["workflow files parse as object mappings", workflowsParseAsMappings],
  ["all workflow actions use full commit SHAs", actions.length > 0 && actions.every(isFullShaActionReference)],
  ["CI workflow permissions are read-only", hasReadOnlyPermissions(ciWorkflow)],
  ["Dependency Review workflow permissions are read-only", hasReadOnlyPermissions(dependencyReviewWorkflow)],
  ["every workflow has explicit read-only permissions", allWorkflowPermissionsAreReadOnly],
  ["workflow jobs do not override permissions", workflowsHaveNoPermissionOverrides],
  ["CI retains its trigger, job, and timeout contract", ciContractIsPreserved],
  ["Dependency Review retains its trigger, job, and timeout contract", dependencyReviewContractIsPreserved],
  ["CI has exactly the approved triggers", ciHasExactlyApprovedTriggers],
  ["Dependency Review has exactly the approved triggers", dependencyReviewHasExactlyApprovedTriggers],
  ["CI checkout does not persist credentials", ciCheckout?.with?.["persist-credentials"] === false],
  [
    "CI runs the repository-security command in the verify job",
    ciRepositorySecurity?.run === "pnpm test:repository-security",
  ],
  ["CI runs the TypeScript no-emit check after responsive composition and before lint", ciTypeCheckIsOrdered],
  ["Dependency Review checkout does not persist credentials", dependencyCheckout?.with?.["persist-credentials"] === false],
  ["Dependency Review blocks moderate and higher severity changes", dependencyAction?.with?.["fail-on-severity"] === "moderate"],
  ["Dependency Review blocks runtime and development scopes", dependencyAction?.with?.["fail-on-scopes"] === "runtime,development"],
  ["Dependency Review reports patched versions", dependencyAction?.with?.["show-patched-versions"] === true],
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
