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

test("rejects a flow-style unpinned action", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "    steps:\n",
        "    steps:\n      - { uses: actions/checkout@v7 }\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: all workflow actions use full commit SHAs/)
    },
  )
})

test("rejects a quoted flow-style uses key", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "    steps:\n",
        "    steps:\n      - { \"uses\": actions/checkout@v7 }\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: all workflow actions use full commit SHAs/)
    },
  )
})

test("rejects a future workflow with write permissions", async () => {
  await withFixture(
    (fixture) =>
      writeFile(
        join(fixture, ".github/workflows/future.yml"),
        "name: Future\non:\n  workflow_dispatch:\npermissions:\n  contents: write\njobs:\n  future:\n    runs-on: ubuntu-latest\n    timeout-minutes: 5\n    steps:\n      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: every workflow has explicit read-only permissions/)
    },
  )
})

test("rejects a job-level permission override", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "  verify:\n    name: verify",
        "  verify:\n    permissions:\n      contents: write\n    name: verify",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: workflow jobs do not override permissions/)
    },
  )
})

test("rejects a quoted job-level permission override", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "  verify:\n    name: verify",
        "  verify:\n    \"permissions\":\n      contents: write\n    name: verify",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: workflow jobs do not override permissions/)
    },
  )
})

test("rejects permissions embedded in a flow-style job mapping", async () => {
  await withFixture(
    (fixture) =>
      writeFile(
        join(fixture, ".github/workflows/future.yml"),
        "name: Future\non:\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  future: { runs-on: ubuntu-latest, permissions: { contents: write }, steps: [{ run: \"true\" }] }\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: workflow jobs do not override permissions/)
    },
  )
})

test("rejects an escaped job-level permissions key", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "  verify:\n    name: verify",
        "  verify:\n    \"permiss\\u0069ons\":\n      contents: write\n    name: verify",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: workflow jobs do not override permissions/)
    },
  )
})

test("rejects an escaped flow-style uses key with an unpinned action", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "    steps:\n",
        "    steps:\n      - { \"u\\u0073es\": actions/checkout@v7 }\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: all workflow actions use full commit SHAs/)
    },
  )
})

test("rejects an unpinned action reached through an escaped key and alias", async () => {
  await withFixture(
    (fixture) =>
      writeFile(
        join(fixture, ".github/workflows/future.yml"),
        "name: Future\non:\n  workflow_dispatch:\npermissions:\n  contents: read\njobs:\n  future:\n    runs-on: ubuntu-latest\n    steps:\n      - &checkout\n        \"u\\u0073es\": actions/checkout@v7\n      - *checkout\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: all workflow actions use full commit SHAs/)
    },
  )
})

test("rejects a workflow with duplicate mapping keys", async () => {
  await withFixture(
    (fixture) => replace(fixture, ".github/workflows/ci.yml", "name: CI\n", "name: CI\nname: Duplicate CI\n"),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: workflow files parse as object mappings/)
    },
  )
})

test("rejects an extra pull_request_target trigger", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "  pull_request:\n",
        "  pull_request:\n  pull_request_target: {}\n",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: CI has exactly the approved triggers/)
    },
  )
})

test("rejects removal of the CI repository-security step", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        ".github/workflows/ci.yml",
        "      - name: Check repository security contract\n        run: pnpm test:repository-security\n\n",
        "",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: CI runs the repository-security command/)
    },
  )
})

test("rejects the repository-security step outside the verify job", async () => {
  await withFixture(
    async (fixture) => {
      const target = join(fixture, ".github/workflows/ci.yml")
      const source = await readFile(target, "utf8")
      assert.ok(source.includes("      - name: Check repository security contract\n        run: pnpm test:repository-security\n\n"))
      const withoutVerifyStep = source.replace(
        "      - name: Check repository security contract\n        run: pnpm test:repository-security\n\n",
        "",
      )
      await writeFile(
        target,
        withoutVerifyStep.replace(
          "jobs:\n",
          "jobs:\n  auxiliary:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Check repository security contract\n        run: pnpm test:repository-security\n\n",
        ),
      )
    },
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: CI runs the repository-security command in the verify job/)
    },
  )
})

test("rejects weakening the package repository-security command", async () => {
  await withFixture(
    (fixture) =>
      replace(
        fixture,
        "package.json",
        "node --test scripts/check-repository-security.test.mjs && ",
        "",
      ),
    async (fixture) => {
      const result = await runContract(fixture)
      assert.equal(result.status, 1)
      assert.match(result.output, /FAIL: package repository-security command runs fixtures and production checker/)
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
