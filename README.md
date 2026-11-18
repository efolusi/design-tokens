# design-tokens

Shared design tokens for [Meridian](https://github.com/efolusi/meridian) (web) and [Glamor](https://github.com/efolusi/glamor) (native), by [Efolusi](https://efolusi.com).

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-7A4E2B.svg)](LICENSE)

Framework-agnostic JSON. Consumers map names into CSS, Swift, or other platforms. They should not invent a second set of color or space roles.

## What's here

| Path | What it is |
|---|---|
| `tokens.json` | Authored shared source, DTCG format |
| `tokens/` | Export dirs: `web/`, `native/` when generators exist |
| `docs/consumers.md` | How Meridian and Glamor use this repo |
| `scripts/build.mjs` | Builds `tokens/web/` and `tokens/native/` from `tokens.json` |
| `tests/` | Checks aliases, names, and that exports are up to date |

## Status

`tokens.json` is DTCG, copied from Meridian's generated `tokens.json` on 2026-11-18. Komando-only tokens (`term-*`, `ansi-*`, `tint-*`) live in `komando-apps/design/tokens.json`. 
## Build

Needs Node 20 or newer. No dependencies.

```bash
npm run build   # write tokens/web/ and tokens/native/
npm test        # aliases, names, stale exports, swiftc type-check
```

| Output | For | Names |
|---|---|---|
| `tokens/web/tokens.css` | Meridian | `--group-leaf`, same as Meridian's CSS |
| `tokens/web/tokens.js` | Meridian, scripts | `tokens["text-primary"]`, `modes.dark[...]` |
| `tokens/native/GlamorTokens.swift` | Glamor | `GlamorTokens.Color.textPrimary` (values only) |

## Ecosystem

| Repo | Role |
|---|---|
| **design-tokens** (this repo) | Shared tokens |
| [Meridian](https://github.com/efolusi/meridian) | Web design system |
| [Glamor](https://github.com/efolusi/glamor) | Native / SwiftUI design system |

See [docs/consumers.md](docs/consumers.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md). Security: [SECURITY.md](SECURITY.md).

## License

Apache License 2.0. See `LICENSE`.
