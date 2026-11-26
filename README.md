<img src="src/app/icon.svg" alt="OpenBoa mark" width="80">

# OpenBoa.ai

Every limit has a shelf life.

The official website for OpenBoa ([openboa.ai](https://openboa.ai)). Built with Next.js, React, `@openboa/yogurt`, Three.js, GSAP, and Lenis, the site pairs a persistent interactive 3D field of instanced Upright 9 marks with OpenBoa's vision and approach across `/`, `/approach`, and `/vision`.

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
pnpm test:repository-security
pnpm tokens:check
pnpm test:responsive
pnpm exec tsc --noEmit
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

Production deploys from protected `main`. Changes enter through a pull request after required checks pass.
