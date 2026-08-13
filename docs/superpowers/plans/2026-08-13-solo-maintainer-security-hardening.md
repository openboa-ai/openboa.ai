# OpenBoa Solo-Maintainer Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused UI scaffold without changing the rendered site, then make pull requests and automated security checks the mandatory path to `main` for a solo maintainer.

**Architecture:** Keep application source and GitHub control-plane changes separate. First preserve and commit the existing UI/dependency cleanup, then enforce repository YAML policy with a built-in Node contract test, deliver everything through one pull request, and finally activate the live GitHub ruleset and secret-scanning options after merge.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, pnpm 10, Node.js 24 in CI, GitHub Actions, Dependabot, Dependency Review, CodeQL default setup, GitHub repository rulesets, GitHub CLI.

## Global Constraints

- Preserve the current landing-page markup, styles, copy, navigation, assets, and responsive rendering.
- Remove `components.json`, the unused `src/components/ui/*` scaffold, `src/lib/landing-content.ts`, and `src/lib/utils.ts` without adding a replacement UI or icon library.
- Remove the direct dependencies `class-variance-authority`, `clsx`, `lucide-react`, `radix-ui`, `tailwind-merge`, and `tw-animate-css`.
- Keep GitHub Actions permissions read-only, disallow workflow PR approvals, keep selected-action restrictions, and pin every `uses:` reference to a full 40-character commit SHA.
- Require pull requests with zero approving reviews, no code-owner approval, no bypass actor, resolved conversations, checks `verify` and `dependency-review`, and CodeQL merge protection.
- Block default-branch deletion and non-fast-forward updates.
- Do not claim stale remote Dependabot alerts are resolved until the GitHub dependency graph reflects the merged lockfile.
- Do not stage, overwrite, or discard user changes outside the approved cleanup and security-hardening paths.

---

### Task 1: Isolate and commit the existing UI scaffold cleanup

**Files:**
- Delete: `components.json`
- Delete: `src/components/ui/badge.tsx`
- Delete: `src/components/ui/button.tsx`
- Delete: `src/components/ui/card.tsx`
- Delete: `src/components/ui/separator.tsx`
- Delete: `src/lib/landing-content.ts`
- Delete: `src/lib/utils.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: the existing working-tree cleanup and the rendered landing implementation in `src/app`.
- Produces: a feature branch that preserves both approved design/plan commits and a standalone cleanup commit with only the nine cleanup paths.

- [ ] **Step 1: Move the approved work to a feature branch and restore the local `main` ref**

Run:

```bash
git switch -c codex/solo-maintainer-security-hardening
git branch -f main origin/main
git status --short --branch
```

Expected: the current branch is `codex/solo-maintainer-security-hardening`; the design and plan commits remain reachable on it; local `main` points to `origin/main`; the nine cleanup paths remain unstaged.

- [ ] **Step 2: Prove the removed modules have no live application consumers**

Run:

```bash
rg -n '(@/components/ui|@/lib/utils|@/lib/landing-content|class-variance-authority|lucide-react|radix-ui|tailwind-merge|tw-animate-css)' src next.config.ts postcss.config.mjs tsconfig.json package.json
```

Expected: the only matches are the dependency names being removed from the working-tree version of `package.json`, or no matches. There must be no match under `src/app`.

- [ ] **Step 3: Verify the pruned lockfile and unchanged application behavior**

Run:

```bash
pnpm install --frozen-lockfile
pnpm audit --audit-level=moderate
pnpm test:responsive
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

Expected: every command exits 0; the audit reports no known vulnerabilities at or above moderate; Next.js generates all static routes.

- [ ] **Step 4: Commit only the cleanup paths**

Run:

```bash
git add components.json package.json pnpm-lock.yaml src/components/ui/badge.tsx src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/separator.tsx src/lib/landing-content.ts src/lib/utils.ts
git diff --cached --check
git diff --cached --name-status
git commit -m "refactor: remove unused UI scaffold"
```

Expected: the staged path list contains exactly the nine approved cleanup paths, and the commit succeeds without including workflow or application-rendering files.

---

### Task 2: Add a repository-security contract and harden checked-in policy

**Files:**
- Create: `scripts/check-repository-security.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/dependency-review.yml`
- Modify: `.github/dependabot.yml`

**Interfaces:**
- Consumes: repository-owned JSON and YAML configuration files.
- Produces: `pnpm test:repository-security`, which exits non-zero when the cleanup, workflow token handling, action pinning, type check, dependency-review scopes, or Dependabot grouping policy regresses.

- [ ] **Step 1: Write the failing repository-security contract**

Create `scripts/check-repository-security.mjs` with:

```js
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
```

- [ ] **Step 2: Run the contract and verify the RED state**

Run:

```bash
node scripts/check-repository-security.mjs
```

Expected: exit 1. It must fail specifically on the missing checkout credential controls, TypeScript CI step, Dependency Review options, five-PR limit, and minor/patch group restrictions. Cleanup and full-SHA checks should already pass.

- [ ] **Step 3: Add the package script and minimal CI controls**

Add this script to `package.json`:

```json
"test:repository-security": "node scripts/check-repository-security.mjs"
```

Add the following to the checkout step in both workflow files:

```yaml
with:
  persist-credentials: false
```

Add this CI step after the responsive check and before lint:

```yaml
- name: Type check
  run: pnpm exec tsc --noEmit
```

Expected: the existing job names `verify` and `dependency-review`, event triggers, read-only permissions, timeouts, and full-SHA action references remain unchanged.

- [ ] **Step 4: Strengthen Dependency Review**

Extend the existing action inputs to exactly:

```yaml
with:
  fail-on-severity: moderate
  fail-on-scopes: runtime,development
  show-patched-versions: true
```

Expected: vulnerable runtime or development dependency additions at moderate or above block the PR.

- [ ] **Step 5: Restrict Dependabot grouping to minor and patch npm updates**

Set:

```yaml
open-pull-requests-limit: 5
```

Add this list to both `production-dependencies` and `development-dependencies` groups, immediately after `dependency-type`:

```yaml
update-types:
  - minor
  - patch
```

Expected: npm major versions are not ignored; they are proposed as individual PRs. GitHub Actions grouping remains unchanged.

- [ ] **Step 6: Verify the GREEN state and commit the policy**

Run:

```bash
pnpm test:repository-security
pnpm exec tsc --noEmit
git diff --check
git diff -- .github package.json scripts/check-repository-security.mjs
git add .github/workflows/ci.yml .github/workflows/dependency-review.yml .github/dependabot.yml package.json scripts/check-repository-security.mjs
git diff --cached --check
git commit -m "ci: enforce solo-maintainer security gates"
```

Expected: all eleven contract checks pass; TypeScript exits 0; the commit contains exactly the five policy paths.

---

### Task 3: Run fresh local, visual, and security verification

**Files:**
- Inspect: all tracked repository files
- Inspect: desktop 1440 x 900 rendering
- Inspect: mobile 390 x 844 rendering

**Interfaces:**
- Consumes: the complete feature branch.
- Produces: fresh evidence that cleanup and policy changes preserve the application and contain no reportable source vulnerability.

- [ ] **Step 1: Run the complete non-server verification suite**

Run:

```bash
pnpm install --frozen-lockfile
pnpm audit --audit-level=moderate
pnpm audit --prod --audit-level=moderate --json
pnpm test:repository-security
pnpm test:responsive
pnpm exec tsc --noEmit
pnpm lint
pnpm build
git diff --check origin/main...HEAD
git status --short --branch
```

Expected: every command exits 0; both audits report zero qualifying vulnerabilities; repository and responsive contract checks pass; lint, type checking, and build pass; the working tree is clean.

- [ ] **Step 2: Test the built production server and headers**

Run:

```bash
pnpm start --hostname 127.0.0.1 --port 3000
```

In a second command session run:

```bash
BASE_URL=http://127.0.0.1:3000 pnpm test:security
```

Expected: every required response header passes and `x-powered-by` is absent. Keep the production server running through the browser verification in the next step.

- [ ] **Step 3: Perform browser visual regression checks**

Use the in-app browser against `http://127.0.0.1:3000` before stopping the server:

- capture the full page at 1440 x 900 and 390 x 844;
- compare the header, hero line breaks, navigation, logo, scale-field crop, viewport fit, and negative space with the pre-change baselines;
- confirm zero horizontal or vertical document overflow; and
- confirm the browser console has no errors.

Expected: no user-visible difference at either viewport. Any difference stops delivery and must be traced to an application-source change before proceeding.

Stop the local production server after the browser and console checks finish.

- [ ] **Step 4: Run a final standard Codex Security scan**

Run the `codex-security:security-scan` workflow against the complete feature branch, including `.github`, source, scripts, manifests, and lockfile.

Expected: complete coverage and zero validated reportable findings. Any validated finding is fixed and re-scanned before publishing.

---

### Task 4: Publish the verified branch and merge through GitHub

**Files:**
- Publish: the complete `codex/solo-maintainer-security-hardening` branch
- Create: one GitHub pull request into `main`

**Interfaces:**
- Consumes: a clean feature branch and fresh Task 3 verification evidence.
- Produces: a merged default branch whose workflow files and dependency graph contain the approved hardening.

- [ ] **Step 1: Reconfirm commit and branch scope before publishing**

Run:

```bash
git status --short --branch
git log --oneline --decorate origin/main..HEAD
git diff --stat origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Expected: the branch contains the design, plan, UI cleanup, and security-policy commits; no unrelated file is present; the working tree is clean.

- [ ] **Step 2: Push and open the pull request using the GitHub publish workflow**

Use `github:yeet` with this title:

```text
security: harden solo-maintainer repository controls
```

The PR body must include:

```markdown
## What changed

- remove unused UI scaffolding and its six direct dependencies without changing the landing page
- add a repository-security contract, explicit type checking, and credential-safe checkout steps
- block moderate-or-higher runtime and development dependency introductions
- group only minor and patch npm updates so majors receive isolated review

## Verification

- `pnpm install --frozen-lockfile`
- `pnpm audit --audit-level=moderate`
- `pnpm audit --prod --audit-level=moderate --json`
- `pnpm test:repository-security`
- `pnpm test:responsive`
- `pnpm exec tsc --noEmit`
- `pnpm lint`
- `pnpm build`
- `pnpm test:security` against the production server
- desktop and mobile visual comparison
- final Codex Security scan: zero reportable findings
```

- [ ] **Step 3: Wait for every GitHub check and inspect failures instead of bypassing them**

Run:

```bash
gh pr checks --repo openboa-ai/openboa.ai --watch --interval 10
```

Expected: `verify`, `dependency-review`, `CodeQL`, Vercel, and Vercel Preview Comments complete successfully. Diagnose any failure through the appropriate GitHub CI workflow and push a verified fix before continuing.

- [ ] **Step 4: Merge and synchronize the local default branch**

Run:

```bash
gh pr merge --repo openboa-ai/openboa.ai --squash --delete-branch
git switch main
git pull --ff-only origin main
git status --short --branch
```

Expected: the PR is merged, the remote feature branch is deleted, local `main` is clean and exactly tracks `origin/main`.

---

### Task 5: Activate solo-maintainer GitHub security controls

**Files:**
- Update remotely: repository ruleset `13185348`
- Update remotely: repository security-and-analysis settings
- Create remotely: label `dependencies`
- Close remotely if still open: Dependabot PRs `#1` and `#2`

**Interfaces:**
- Consumes: merged workflow check names `verify` and `dependency-review`, existing CodeQL tool name `CodeQL`, and repository administrator access.
- Produces: an active no-bypass default-branch ruleset with zero human approvals and enabled supported secret-scanning enhancements.

- [ ] **Step 1: Confirm the exact live check and CodeQL names before mutation**

Run:

```bash
gh api repos/openboa-ai/openboa.ai/commits/main/check-runs --jq '.check_runs[] | [.name, .app.name, .conclusion] | @tsv'
gh api repos/openboa-ai/openboa.ai/code-scanning/default-setup
gh api repos/openboa-ai/openboa.ai/rulesets/13185348
```

Expected: the live job names include `verify` and `dependency-review`; CodeQL default setup is configured for JavaScript/TypeScript; ruleset 13185348 is still disabled. If names differ, use the exact emitted names in the next payload and re-run the read-only checks.

- [ ] **Step 2: Activate the default-branch ruleset**

Run:

```bash
gh api --method PUT \
  -H "Accept: application/vnd.github+json" \
  repos/openboa-ai/openboa.ai/rulesets/13185348 \
  --input - <<'JSON'
{
  "name": "main",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "required_reviewers": [],
        "require_code_owner_review": false,
        "dismissal_restriction": {
          "enabled": false,
          "allowed_actors": []
        },
        "require_last_push_approval": false,
        "required_review_thread_resolution": true,
        "allowed_merge_methods": ["squash", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [
          { "context": "verify" },
          { "context": "dependency-review" }
        ],
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false
      }
    },
    {
      "type": "code_scanning",
      "parameters": {
        "code_scanning_tools": [
          {
            "tool": "CodeQL",
            "security_alerts_threshold": "medium_or_higher",
            "alerts_threshold": "errors"
          }
        ]
      }
    }
  ]
}
JSON
```

Expected: HTTP 200 with `enforcement: active`, an empty bypass list, approval count 0, required conversation resolution, both required checks, and CodeQL thresholds.

- [ ] **Step 3: Enable supported secret-scanning enhancements**

Run:

```bash
gh api --method PATCH \
  -H "Accept: application/vnd.github+json" \
  repos/openboa-ai/openboa.ai \
  --input - <<'JSON'
{
  "security_and_analysis": {
    "secret_scanning_non_provider_patterns": {
      "status": "enabled"
    },
    "secret_scanning_validity_checks": {
      "status": "enabled"
    }
  }
}
JSON
```

Expected: HTTP 200 and both settings become `enabled`. If GitHub returns a plan or feature-availability error, preserve the existing secret scanning and push protection, record the exact response, and report that control as an external limitation.

- [ ] **Step 4: Align Dependabot repository metadata and close obsolete PRs**

Run:

```bash
gh label create dependencies --repo openboa-ai/openboa.ai --color 0366d6 --description "Pull requests that update dependencies" --force
gh pr view 1 --repo openboa-ai/openboa.ai --json state,title,url
gh pr view 2 --repo openboa-ai/openboa.ai --json state,title,url
```

If PR #1 remains open, close it with the comment `Removed dependencies are no longer present on main.` If PR #2 remains open, close it with the comment `Superseded by the minor/patch-only grouping policy; major upgrades will be reviewed individually.`

Expected: the `dependencies` label exists and neither obsolete grouped PR remains open.

---

### Task 6: Verify effective GitHub and live-site state

**Files:**
- Inspect remotely: `main`, Actions settings, ruleset, CodeQL, secret scanning, Dependabot alerts, dependency graph, open PRs, and production deployment

**Interfaces:**
- Consumes: the merged default branch and Task 5 GitHub settings.
- Produces: evidence-backed handoff of both checked-in code and effective remote controls.

- [ ] **Step 1: Verify the default branch and effective repository controls**

Run:

```bash
gh api repos/openboa-ai/openboa.ai/rulesets/13185348
gh api repos/openboa-ai/openboa.ai/rules/branches/main
gh api repos/openboa-ai/openboa.ai/actions/permissions
gh api repos/openboa-ai/openboa.ai/actions/permissions/workflow
gh api repos/openboa-ai/openboa.ai/code-scanning/default-setup
gh api repos/openboa-ai/openboa.ai/private-vulnerability-reporting
gh api repos/openboa-ai/openboa.ai --jq '{default_branch,security_and_analysis}'
```

Expected: the ruleset is active with no bypass, zero approvals, required conversations, `verify`, `dependency-review`, and CodeQL; Actions remains selected-only with SHA pinning; workflow permissions remain read-only and cannot approve PRs; private vulnerability reporting, secret scanning, and push protection remain enabled.

- [ ] **Step 2: Verify GitHub alert surfaces and current dependency graph**

Run:

```bash
gh api --paginate --slurp 'repos/openboa-ai/openboa.ai/code-scanning/alerts?state=open&per_page=100'
gh api --paginate --slurp 'repos/openboa-ai/openboa.ai/secret-scanning/alerts?state=open&per_page=100'
gh api --paginate --slurp 'repos/openboa-ai/openboa.ai/dependabot/alerts?state=open&per_page=100'
gh api repos/openboa-ai/openboa.ai/dependency-graph/sbom
gh pr list --repo openboa-ai/openboa.ai --state open --json number,title,headRefName,url
```

Expected: zero open code-scanning and secret-scanning alerts; the SBOM contains the merged three-package production manifest and none of the removed direct UI packages; PRs #1 and #2 are closed. Wait for GitHub's dependency-graph refresh and re-query Dependabot alerts until removed-lockfile alerts close. Reconcile any remaining alert against the live `main` manifest and the advisory's vulnerable/patched ranges rather than treating a stale alert as a current vulnerability.

- [ ] **Step 3: Verify the production deployment visually and operationally**

Use the in-app browser on `https://openboa.ai` at 1440 x 900 and 390 x 844. Confirm the same visual criteria as Task 3, check the response security headers, and verify the Projects links.

Expected: production matches the local baselines, has no browser console errors or overflow, and exposes the required security headers without `x-powered-by`.

- [ ] **Step 4: Record final evidence before claiming completion**

Run:

```bash
git status --short --branch
git log -3 --oneline --decorate
git diff --check origin/main...HEAD
```

Expected: local `main` is clean and matches `origin/main`. Report changed paths, relevant commits/PR, fresh command results, final scan artifacts, effective GitHub settings, closed obsolete PRs, and any GitHub-side asynchronous limitation that remains.
