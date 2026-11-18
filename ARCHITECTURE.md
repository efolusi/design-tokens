# Architecture

Shape of this repo and the contract Meridian and Glamor rely on. Read before moving public paths.

## Layout

```
design-tokens/
├── tokens.json           # authored shared source (DTCG)
├── tokens/web/           # tokens.css, 4 split .css, tokens.js (generated)
├── tokens/native/        # GlamorTokens.swift (generated)
├── docs/                 # consumers.md
├── scripts/              # build.mjs
├── tests/                # node --test
└── README, ARCHITECTURE, CONTRIBUTING, SECURITY, …
```

## Rules

1. **Root `tokens.json` is the contract.** Do not bury it under a product folder.
2. **Keep exports shallow.** `tokens/web/` and `tokens/native/` only. No per-app nesting.
3. **Do not hand-edit generated files.** Change `tokens.json`, run `npm run build`. `npm test` fails on stale exports.

## Authored vs generated

| Path | Who writes it | Status |
|---|---|---|
| `tokens.json` | Authors | Source, committed |
| `tokens/web/*` | `scripts/build.mjs` | Generated, committed |
| `tokens/native/*` | `scripts/build.mjs` | Generated, committed |

## Consumers

- **Meridian** maps tokens into CSS custom properties and related web artifacts. Today it still vendors its own `tokens.json`.
- **Glamor** maps the same roles into Swift (`K` / `MK`) and will consume `tokens/native/GlamorTokens.swift` and wrap the values in SwiftUI types.

Details: [docs/consumers.md](docs/consumers.md).

## Invariants

1. Token names and roles stay stable across platforms. Values may differ by theme or density; vocabularies should not fork.
2. No secrets, API keys, or `.env` files in this repository.
3. License stays Apache-2.0 unless the project explicitly relicenses.
