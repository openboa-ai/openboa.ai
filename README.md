# OpenBoa.ai

The official OpenBoa landing page: **Expanding the horizon of human possibility**.

The site consumes a pinned snapshot of the canonical
[`openboa-brand-system`](https://github.com/openboa-ai/openboa-brand-system)
tokens. Update the snapshot deliberately, then regenerate the site aliases with
`pnpm tokens:generate`.

## Local development

Requirements:

- Node.js 20.9 or newer
- pnpm 10.30.2

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Verification

```bash
pnpm audit --audit-level=moderate
pnpm tokens:check
pnpm test:responsive
pnpm lint
pnpm build
```

After building, start the production server and validate its response headers:

```bash
pnpm start
pnpm test:security
```

Pull requests run the same checks in GitHub Actions. Dependency changes also pass GitHub's dependency review before merge.

## Security

Report suspected vulnerabilities privately through the repository's **Security** tab. See the [security policy](.github/SECURITY.md) for details.

## Deployment

Production deploys from protected `main`. Changes should enter through a pull request after required checks pass.

The pre-token landing prototype is preserved on the local
`backup/landing-v33-20260823` branch. The active implementation branch is
`codex/landing-brand-token-pass`.
