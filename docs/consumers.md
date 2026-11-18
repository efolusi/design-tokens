# Consumers

How Meridian and Glamor use this repo.

| Consumer | Runtime | Today | Target |
|---|---|---|---|
| [Meridian](https://github.com/efolusi/meridian) | CSS, React, CDN / npm | Own `tokens.json` in that repo | Import / generate from `tokens/web/` |
| [Glamor](https://github.com/efolusi/glamor) | SwiftUI seeds, HTML previews | Own root `tokens.json` (Komando seed) | Import / generate from `tokens/native/` |

## Shared rules

- Same token **names** and **roles** on web and native.
- Theme and density may change values; they should not invent parallel names for the same job.
- Product-only tokens stay out of this repo until a second product needs them.

## Format

Root `tokens.json` is DTCG (`$value`, `$type`, aliases as `{group.leaf}`, modes in `$extensions`). It was copied from Meridian on 2026-11-18. Glamor's names (`window`, `panel`, `text2`, …) still need a mapping to these roles.
