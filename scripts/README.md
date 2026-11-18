# Scripts

| Script | Input | Output |
|---|---|---|
| `build.mjs` | `tokens.json` | `tokens/web/tokens.css`, `tokens/web/{colors,typography,spacing,effects}.css`, `tokens/web/tokens.js`, `tokens/native/GlamorTokens.swift` |

`node scripts/build.mjs --check` exits 1 when an output is stale. CI (`.github/workflows/checks.yml`) runs `npm run check` and `npm test` with `REQUIRE_SWIFTC=1`, so the Swift type-check cannot be skipped.
