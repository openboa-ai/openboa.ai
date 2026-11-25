# OpenBoa design tokens

`src/design-system/openboa.tokens.json` pins the canonical palette, typography,
spacing, and radius tokens from `@openboa/yogurt@0.2.0-local.1`
(`yogurt-repo@8c0de34ce2bcf795c44e28c406a6070fd1a4eaca`).

Regenerate derived CSS and TypeScript aliases after an intentional token update:

```bash
pnpm tokens:generate
pnpm tokens:check
```
