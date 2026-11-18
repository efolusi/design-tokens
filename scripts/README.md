# Scripts

| Script | Input | Output |
|---|---|---|
| `build.mjs` | `tokens.json` | `tokens/web/tokens.css`, `tokens/web/tokens.js`, `tokens/native/GlamorTokens.swift` |

`node scripts/build.mjs --check` exits 1 when an output is stale. CI should run `npm test`.
