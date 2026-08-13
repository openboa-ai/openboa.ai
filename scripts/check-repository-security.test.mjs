import assert from "node:assert/strict"
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const repositoryRoot = fileURLToPath(new URL("../", import.meta.url))
const contract = join(repositoryRoot, "scripts/check-repository-security.mjs")

async function withFixture(mutate, check) {
  const fixture = await mkdtemp(join(tmpdir(), "openboa-repository-security-"))

  try {
    await cp(join(repositoryRoot, "package.json"), join(fixture, "package.json"))
    await cp(join(repositoryRoot, ".github"), join(fixture, ".github"), { recursive: true })
    await mutate(fixture)
    await check(fixture)
  } finally {
    await rm(fixture, { force: true, recursive: true })
  }
}

async function replace(fixture, path, from, to) {
  const target = join(fixture, path)
  const source = await readFile(target, "utf8")
  assert.ok(source.includes(from), `fixture source must include ${from}`)
  await writeFile(target, source.replace(from, to))
}

async function runContract(fixture) {
  try {
    const result = await execFileAsync(process.execPath, [contract], {
      env: { ...process.env, REPOSITORY_SECURITY_ROOT: fixture },
    })
    return { output: result.stdout, status: 0 }
  } catch (error) {
    return { output: error.stdout, status: error.code }
  }
}

test("rejects commented checkout and type-check controls", async () => {
  await withFixture(
    async (fixture) => {
      await replace(fixture, ".github/workflows/ci.yml", "persist-credentials: false", "# persist-credentials: false")
      await replace(fixture, ".github/workflows/ci.yml", "run: pnpm exec tsc --noEmit", "# run: pnpm exec tsc --noEmit")
      await replace(fixture, ".github/workflows/dependency-review.yml", "persist-credentials: false", "# persist-credentials: false")
    },
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: CI checkout does not persist credentials/)
      assert.match(result.output, /FAIL: CI runs the TypeScript no-emit check after responsive composition and before lint/)
      assert.match(result.output, /FAIL: Dependency Review checkout does not persist credentials/)
    },
  )
})

test("rejects an unpinned action in any workflow", async () => {
  await withFixture(
    (fixture) =>
      writeFile(
        join(fixture, ".github/workflows/future.yml"),
        "name: Future\non:\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  future:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@v7\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: all workflow actions use full commit SHAs/)
    },
  )
})

test("rejects missing read-only permissions and Dependency Review severity", async () => {
  await withFixture(
    async (fixture) => {
      await replace(fixture, ".github/workflows/dependency-review.yml", "permissions:\n  contents: read\n", "")
      await replace(fixture, ".github/workflows/dependency-review.yml", "          fail-on-severity: moderate\n", "")
    },
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: Dependency Review workflow permissions are read-only/)
      assert.match(result.output, /FAIL: Dependency Review blocks moderate and higher severity changes/)
    },
  )
})

test("rejects Dependabot groups with swapped semantics", async () => {
  await withFixture(
    async (fixture) => {
      await replace(fixture, ".github/dependabot.yml", "dependency-type: production", "dependency-type: development")
      await replace(fixture, ".github/dependabot.yml", "        patterns:\n          - \"*\"", "        patterns:\n          - \"react\"")
    },
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: Dependabot production group keeps production wildcard semantics/)
    },
  )
})
