# OpenBoa.ai

The official OpenBoa landing page for **Business of Agents**.

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
