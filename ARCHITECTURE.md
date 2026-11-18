# Architecture

Shape of this repo and the contract Meridian and Glamor rely on. Read before moving public paths.

## Layout

```
design-tokens/
├── tokens.json           # authored shared source (interim Glamor seed)
├── tokens/web/           # CSS / Style Dictionary / DTCG exports (later)
├── tokens/native/        # Swift / other native exports (later)
├── docs/                 # consumers.md
├── scripts/              # generators and checks (stubs for now)
└── README, ARCHITECTURE, CONTRIBUTING, SECURITY, …
```

## Rules

1. **Root `tokens.json` is the contract.** Do not bury it under a product folder.
2. **Keep exports shallow.** `tokens/web/` and `tokens/native/` only. No per-app nesting.
3. **Do not hand-edit generated files.** When generators exist, change the source and rebuild.

## Authored vs generated

| Path | Who writes it | Status |
|---|---|---|
| `tokens.json` | Authors | Interim seed, committed |
| `tokens/web/*` | Future generator | Empty destination |
| `tokens/native/*` | Future generator | Empty destination |

## Consumers

- **Meridian** maps tokens into CSS custom properties and related web artifacts. Today it still vendors its own `tokens.json`.
- **Glamor** maps the same roles into Swift (`K` / `MK`) and keeps a working root `tokens.json` until native exports land here.

Details: [docs/consumers.md](docs/consumers.md).

## Invariants

1. Token names and roles stay stable across platforms. Values may differ by theme or density; vocabularies should not fork.
2. No secrets, API keys, or `.env` files in this repository.
3. License stays Apache-2.0 unless the project explicitly relicenses.
