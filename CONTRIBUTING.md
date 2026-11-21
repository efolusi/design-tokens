# Contributing to design-tokens

Apache-2.0. Token changes here should stay usable by both Meridian (web) and Glamor (native).

## Layout

- Authored source: root `tokens.json`
- Exports (when they exist): `tokens/web/`, `tokens/native/`
- Consumer notes: `docs/consumers.md`; motion scale: `docs/motion.md`

Do not add a deep product-specific tree. Keep names and roles shared.

## Local checks

No generator or CI gate yet. Until scripts land:

1. Edit `tokens.json` (or a stub under `scripts/` you are adding).
2. Say in the PR which consumer you tested (Meridian path, Glamor path, or both).
3. Do not invent a second vocabulary for one platform.

## Rules

- Prefer additive tokens over renaming. Renames need a migration note in both consumer repos.
- No secrets or `.env` files.
- Keep Apache-2.0 unless the project relicenses.

## Before a PR

- [ ] Change is described in terms of token name / role / value
- [ ] Impact on Meridian and Glamor called out (even if only one is updated yet)
- [ ] No hand-patched export file that a generator should produce

## License

By contributing, you agree your contributions are licensed under the Apache License 2.0.
