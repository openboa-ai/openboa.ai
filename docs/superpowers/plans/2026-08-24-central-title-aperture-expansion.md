# Central Title Aperture Balance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set the centered title aperture feather to exactly 20% above its original baseline and expand its off-white core from `innerEdge: 0.45` to `0.55`, while preserving every other aperture.

**Architecture:** Keep the change inside the existing `QUIET_APERTURE` configuration so `sampleQuietAperture()` remains the single source of central-title geometry. Lock the six approved feather values and the unchanged core value in the design contract, then validate the production rendering separately.

**Tech Stack:** TypeScript, WebGL-backed Next.js 16 landing page, Node.js contract scripts, pnpm, in-app Browser visual QA

---

### Task 1: Lock and implement the final central aperture balance

**Files:**
- Modify: `scripts/check-design-token-contract.mjs`
- Modify: `src/lib/openboa/quiet-aperture.ts:19-30`

- [ ] **Step 1: Write the failing design-contract check**

Extend the existing file reads in `scripts/check-design-token-contract.mjs`:

```js
const [snapshot, generatedCss, generatedValues, globals, field, layout, quietAperture] = await Promise.all([
  read("src/design-system/openboa.tokens.json"),
  read("src/design-system/generated/openboa-tokens.css"),
  read("src/design-system/generated/openboa-token-values.ts"),
  read("src/app/globals.css"),
  read("src/lib/openboa/scale-field.ts"),
  read("src/app/layout.tsx"),
  read("src/lib/openboa/quiet-aperture.ts"),
])
```

Add this check after the background-flow checks:

```js
[
  "central title aperture uses 20 percent feather with expanded off-white core",
  [
    "innerEdge: 0.55",
    "featherXMin: 52.8",
    "featherXMax: 163.2",
    "featherXViewportRatio: 0.1275",
    "featherYMin: 69.6",
    "featherYMax: 110.4",
    "featherYViewportRatio: 0.08625",
  ].every((value) => quietAperture.includes(value)),
],
```

- [ ] **Step 2: Run the contract test and verify it fails**

Run:

```bash
node scripts/check-design-token-contract.mjs
```

Expected: exit code `1` with `FAIL: central title aperture uses 20 percent feather with expanded off-white core`. Existing checks must remain `PASS`.

- [ ] **Step 3: Apply the minimal aperture configuration change**

Replace only the six feather values in `src/lib/openboa/quiet-aperture.ts`:

```ts
export const QUIET_APERTURE = Object.freeze({
  innerEdge: 0.55,
  featherXMin: 52.8,
  featherXMax: 163.2,
  featherXViewportRatio: 0.1275,
  featherYMin: 69.6,
  featherYMax: 110.4,
  featherYViewportRatio: 0.08625,
  shapePower: 4,
  motionFloor: 0.74,
  colorMix: 1,
})
```

- [ ] **Step 4: Run the focused and composition checks**

Run:

```bash
node scripts/check-design-token-contract.mjs
pnpm test:responsive
```

Expected: every line begins with `PASS`, including the new 20% feather-expansion contract.

- [ ] **Step 5: Commit the tested implementation**

```bash
git add scripts/check-design-token-contract.mjs src/lib/openboa/quiet-aperture.ts
git commit -m "feat: widen central title aperture feather"
```

### Task 2: Verify and record the final composition

**Files:**
- Modify: `design-qa.md`
- Local evidence: `qa/token-integration/central-aperture-20-percent.jpg`
- Local evidence: `qa/token-integration/central-aperture-20-percent-dropdown.jpg`

- [ ] **Step 1: Run the complete static verification set**

Run:

```bash
pnpm tokens:check
pnpm lint
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Expected: token outputs current, lint and TypeScript exit `0`, the production build succeeds, and `git diff --check` prints no errors.

- [ ] **Step 2: Inspect the production build in the same browser viewport**

Serve the current build at `http://127.0.0.1:50834/`. Capture the closed and Products-open states to the two evidence paths above. Confirm all of the following:

- The completely off-white title core grows from 45% to 55% of the measured title bounds.
- The feather reaches 20% farther horizontally and vertically.
- The transition remains soft and does not read as a rectangle.
- Header, dropdown, footer, and social apertures are unchanged.
- The living-scale color flow and movement remain unchanged.
- Browser warning and error logs are empty.

- [ ] **Step 3: Record the visual QA result**

Append this focused result to `design-qa.md`:

```markdown
## Central title aperture follow-up

- The central title feather is expanded by exactly 20% at every responsive clamp state.
- The off-white core uses `innerEdge: 0.55`; contour shape, motion attenuation, colors, and all non-central apertures are unchanged.
- Closed and Products-open production captures are recorded at `qa/token-integration/central-aperture-20-percent.jpg` and `qa/token-integration/central-aperture-20-percent-dropdown.jpg`.
- Browser warning and error logs were empty.
```

- [ ] **Step 4: Commit the QA record**

```bash
git add design-qa.md
git commit -m "docs: record central aperture expansion QA"
```

- [ ] **Step 5: Confirm rollback points and clean status**

Run:

```bash
git status --short
git log --oneline --decorate -5
git branch --list 'backup/landing-v33-20260823' --format='%(refname:short) %(objectname:short)'
```

Expected: the working tree is clean, the implementation and QA commits are at the branch tip, pre-expansion commit `eb5c5a4` remains reachable, and rollback branch `backup/landing-v33-20260823` remains at `8bfc4d2`.
