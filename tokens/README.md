# Tokens exports

Root `../tokens.json` is the authored source.

| Path | Intended consumer |
|---|---|
| `web/` | Meridian: `tokens.css`, the same split into `colors`/`typography`/`spacing`/`effects.css`, `tokens.js` |
| `native/` | Glamor: `GlamorTokens.swift` |

`scripts/build.mjs` writes these files. Do not edit them by hand.
