# OpenBoa Solo-Maintainer Security Hardening Design

## Outcome

OpenBoa remains visually identical while unused UI scaffolding and its direct dependencies are removed. Repository operation is protected for a single maintainer by mandatory pull requests and automated security gates, without requiring a second person's approval.

## Scope and boundaries

- Preserve the current landing-page markup, styles, copy, navigation, assets, and responsive rendering.
- Retain the existing working-tree cleanup that deletes `components.json`, the unused `src/components/ui/*` scaffold, `src/lib/landing-content.ts`, and `src/lib/utils.ts`, and removes their unused direct dependencies from `package.json` and `pnpm-lock.yaml`.
- Do not add a replacement component library, icon package, custom CodeQL workflow, OpenSSF Scorecard workflow, application runtime feature, or visual refactor.
- Treat the current GitHub default CodeQL setup as the code-scanning authority. Avoid a duplicate workflow that would add maintenance and duplicate alerts.
- Do not claim remote Dependabot alerts are resolved until GitHub rebuilds the dependency graph after the cleanup reaches the default branch.

## Local repository controls

### CI workflow

The existing `verify` job remains the single required build gate on pull requests, pushes to `main`, and merge queue events. It will:

- check out source without persisting the workflow token in the local Git configuration;
- install exactly the frozen pnpm lockfile;
- run the moderate-or-higher dependency audit;
- run responsive composition checks;
- run an explicit TypeScript no-emit check;
- run ESLint and the production build;
- start the built application and verify the production security headers; and
- stop the local server even after an earlier failure.

The job keeps read-only `contents` permission and SHA-pinned third-party actions.

### Dependency Review workflow

Dependency Review remains a pull-request-only gate because the action receives the correct base and head commit context on that event. It will:

- check out source without persisting credentials;
- fail on moderate-or-higher vulnerable dependency additions;
- evaluate both runtime and development dependency scopes; and
- show patched versions in its report when GitHub advisory data provides them.

### Dependabot policy

Dependabot will keep weekly npm and GitHub Actions updates. For npm packages:

- production and development dependencies remain separated;
- only patch and minor updates are grouped;
- major updates remain individual pull requests so unrelated breaking upgrades cannot fail as a single opaque batch; and
- the open pull-request limit is reduced to five to control maintenance noise without disabling security updates.

The repository will have a `dependencies` label matching the Dependabot configuration. The obsolete UI-library update and the incompatible grouped development-major update will be closed after the replacement policy is present.

## GitHub protection model

The `main` ruleset will be active and target the default branch. It will have no bypass actor and will enforce:

- pull requests for changes to `main`;
- zero required approving reviews;
- deletion and non-fast-forward update protection;
- resolution of all pull-request conversations;
- successful required checks named `verify` and `dependency-review`; and
- CodeQL code-scanning merge protection for JavaScript/TypeScript findings at the repository's supported blocking threshold.

Zero approvals is intentional: the maintainer may merge their own pull request only after every automated gate succeeds. CODEOWNERS remains as ownership documentation and review routing, but code-owner approval is not a merge requirement.

GitHub Actions keeps read-only default token permissions, SHA pinning, and the current selected-actions allowlist. Workflows must not be allowed to approve pull requests.

Secret scanning and push protection remain enabled. Non-provider secret patterns and secret validity checks will be enabled when supported by the repository plan and API; an unavailable feature is reported as an external limitation rather than silently treated as configured.

## Delivery sequence

1. Preserve and audit the existing UI/dependency cleanup.
2. Add repository-level regression checks for the intended workflow and dependency policy, then update the YAML configurations to satisfy them.
3. Run the full local install, audit, responsive, type, lint, build, security-header, diff, and visual verification suite.
4. Create a dedicated branch, commit only the scoped changes, push it, and open a pull request.
5. Confirm the pull-request checks and CodeQL results, then merge through GitHub.
6. Activate the solo-maintainer `main` ruleset and enable the supported secret-scanning options.
7. Re-query Actions settings, rulesets, open pull requests, dependency alerts, code-scanning alerts, and secret-scanning alerts. Remote completion requires the default branch and GitHub security surfaces to reflect the intended state.

The ruleset is activated after the hardening change reaches `main`, avoiding a bootstrap deadlock while still leaving the default branch protected at handoff.

## Failure handling

- A local or GitHub check failure stops delivery and is diagnosed before merge.
- If a required check name differs from the emitted GitHub check name, the ruleset is not activated until the exact live name is confirmed.
- If branch-rule mutation, secret-scanning options, or dependency-graph refresh is unavailable, the repository changes remain intact and the precise unresolved GitHub control is reported.
- Existing user changes outside the approved cleanup and security-hardening paths are never staged, overwritten, or discarded.

## Verification and acceptance

Acceptance requires all of the following:

- `pnpm install --frozen-lockfile` succeeds;
- `pnpm audit --audit-level=moderate` reports no known vulnerability at or above the threshold;
- the production-only audit reports zero vulnerabilities;
- responsive checks, `tsc --noEmit`, ESLint, and the production build succeed;
- production security-header checks succeed against the built server;
- desktop 1440 x 900 and mobile 390 x 844 screenshots preserve the baseline layout;
- all workflow action references remain full-length commit SHAs;
- the pull request's required checks pass before merge;
- the active default-branch ruleset shows zero required approvals and the intended automated gates;
- CodeQL and secret-scanning show no open source or secret findings; and
- Dependabot alerts caused only by removed lockfile entries close after the dependency graph refresh, or any remaining alert is reconciled against the live default-branch manifest and advisory range.
