# Audited dependency refresh

Status: accepted, revision 1. The delegated work lead accepted this bounded
dependency-maintenance mechanism after independent security-boundary and
compatibility review on 2026-11-17, before package or lockfile edits. This accepts
local implementation and draft preparation; it is not human approval to merge,
release, deploy or change repository controls.

## Intent and baseline

Resolve the current published dependency advisories while preserving the existing
landing page, routes, brand assets and repository security checks. Baseline main:
`4cba071dbbab388c5bbce40eac2ab5b489736179`.

The 2026-11-17 GitHub inventory reports 21 open Dependabot alert entries covering
11 unique advisories: 20 entries for
Next.js across package.json and pnpm-lock.yaml and one for source-map-js in the
lockfile. These are affected-version findings; no production exploitation or
reachability of every advisory-specific prerequisite is asserted.

## Authority, data and change boundary

- Update Next.js 16.3.5 to the official patched same-major 16.4.5 release. Keep
  eslint-config-next on the matching 16.4.5 release for framework compatibility.
- Resolve every source-map-js occurrence to the official patched 1.2.2 release,
  using a targeted resolution or override only if the existing dependency graph
  otherwise keeps an affected copy. Regenerate the pnpm 10.30.2 lockfile.
- Ensure the selected Next.js graph includes sharp >=0.35.5, required by the
  published image optimization fix. Inspect all installed/locked copies.
- Include only the package manifest, regenerated lockfile and connected change
  specification/verification record. An additional dependency change requires a
  concrete advisory or compatibility dependency and review within this boundary.
- Use official package registry releases. No application source, UI, public
  content, routes, brand tokens, deployment, CI permission, audit severity,
  branch rule, secret, credential or security-setting changes are authorized.
- Prepare a draft PR with exact-head validation. Merge, release and deployment
  are separate human decisions. Never dismiss an alert as remediation.

## Security and compatibility requirements

| ID | Requirement | Acceptance evidence |
| --- | --- | --- |
| R1 | No known advisory remains in the candidate's resolved graph. | Frozen install; `pnpm audit --audit-level=low`; inspect all affected locked/installed versions. |
| R2 | The selected releases close every current advisory range. | Next.js 16.4.5, source-map-js >=1.2.2 and sharp >=0.35.5; compare the candidate with published patched ranges. |
| R3 | Ordinary pages and image delivery remain usable. | TypeScript no-emit, lint, build, local production route/image smoke checks and existing responsive/design checks. |
| R4 | Existing security policy remains effective. | Repository security contract tests and production response header checks pass; no control/configuration weakening in the diff. |
| R5 | Review evidence describes the actual final candidate. | Independent read-only candidate review, exact commit and local commands recorded, actual GitHub CI state recorded separately. |

## Failures, lifecycle and delivery

Stop and report an official package incompatibility, unavailable required check,
new unpatched advisory, unexpected manifest change or required scope expansion.
Do not rewrite the original branch, alter existing dependency PRs, weaken checks
or deploy to make verification pass. Preserve other work. Reconcile remote main
and existing PR state before publishing the independent candidate.

The dependency-version audit is the strongest focused substitute for triggering
framework RCE or cache-disclosure payloads; those payloads must not be sent to
production. Local route, image and response-header controls establish ordinary
behavior without asserting that all deployment-specific exploit conditions were
reproduced. A passing draft does not establish a patched production deployment.

## Public upstream evidence

- [Next.js typed-array cache advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr)
- [Next.js image optimization advisory](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw)
- [Next.js root-parameter cache advisory](https://github.com/vercel/next.js/security/advisories/GHSA-mfr8-8qww-v76h)
- [source-map-js advisory](https://github.com/advisories/GHSA-68fv-2mgg-jv7q)
