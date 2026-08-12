# OpenBoa Responsive Composition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the OpenBoa landing composition use the full viewport and remain visually balanced from mobile portrait through wide desktop.

**Architecture:** Keep the page markup and the single authored scale-field image intact. Replace fixed-ratio frame sizing with viewport-anchored CSS and define three compositional states: landscape, portrait, and compact mobile/short-landscape.

**Tech Stack:** Next.js 16, React 19, CSS media queries, Chrome responsive viewport verification.

## Global Constraints

- Preserve OpenBoa brand tokens, Martian Grotesk/Pretendard fonts, copy, logo, project links, and the authored scale-field image.
- Keep the page to one viewport without horizontal or vertical document overflow.
- Keep Projects discoverable and keyboard-operable at all supported viewports.

---

### Task 1: Responsive composition contract

**Files:**
- Create: `scripts/check-responsive-css.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `src/app/globals.css` and `src/app/page.tsx`.
- Produces: `pnpm test:responsive`, which exits non-zero if the required full-viewport and responsive CSS contract is missing.

- [ ] **Step 1:** Write a contract test that requires a full-viewport frame, right-anchored landscape field, portrait field scaling beyond 720px, mobile navigation reduction, and mobile natural body-copy wrapping.
- [ ] **Step 2:** Run `pnpm test:responsive` and confirm it fails against the current fixed-ratio implementation.
- [ ] **Step 3:** Do not change production code in this task.

### Task 2: Full-viewport responsive CSS

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: the existing `.landing-frame`, `.scale-field`, `.site-header`, `.hero`, and navigation selectors.
- Produces: the three-state responsive composition defined in the design spec.

- [ ] **Step 1:** Set `.landing-frame` to `100vw` by `100dvh` and anchor the default scale field to the right with height-based sizing.
- [ ] **Step 2:** Tune header and hero sizing against viewport units with bounded `clamp()` values.
- [ ] **Step 3:** Increase portrait scale-field maximum size and align the field closer to the hero.
- [ ] **Step 4:** Mark authored desktop line breaks and disable them on mobile so body copy wraps naturally.
- [ ] **Step 5:** Tune compact mobile and short-landscape placements without changing the source asset.
- [ ] **Step 6:** Run `pnpm test:responsive`, `pnpm lint`, and `pnpm build` and require all three to pass.

### Task 3: Visual QA and deployment

**Files:**
- Modify: `design-qa.md`
- Create: `qa/responsive-2026-08-12/*.png`

**Interfaces:**
- Consumes: the local production build and the selected source image.
- Produces: a responsive screenshot matrix, comparison evidence, and a deployed `main` branch.

- [ ] **Step 1:** Run the local production build and capture the complete viewport matrix in Chrome.
- [ ] **Step 2:** Test Projects open/closed state, repository links, focusability, overflow, and console errors.
- [ ] **Step 3:** Create a normalized source/implementation comparison at 1487 x 1058 and inspect it as one image.
- [ ] **Step 4:** Record findings and iteration history in `design-qa.md`; fix all P0/P1/P2 findings until `final result: passed`.
- [ ] **Step 5:** Commit the implementation to `main`, push `origin/main`, wait for the connected deployment, and verify the live page in Chrome at desktop and mobile sizes.
