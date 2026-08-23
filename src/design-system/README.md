# OpenBoa design-token snapshot

`openboa.tokens.json` is a committed downstream snapshot of the canonical
OpenBoa brand system. It is pinned to:

- repository: `openboa-ai/openboa-brand-system`
- commit: `e93f55cbfd90b668ef9d77875f71d8e53f7ceb4b`
- SHA-256: `63d0e9b046cedbd4ee062baac3f4972e2617c69ebdbd2c623c4bf9a4a8faa4b1`

Run `pnpm tokens:generate` after deliberately updating the snapshot. Site code
consumes only the generated semantic aliases; it does not depend on a sibling
checkout at build time.
