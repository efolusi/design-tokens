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

## Names

One token, one name per platform, derived by `scripts/build.mjs`:

| `tokens.json` path | CSS (Meridian) | Swift (Glamor) |
|---|---|---|
| `text.primary` | `--text-primary` | `GlamorTokens.Color.textPrimary` |
| `accent._` | `--accent` | `GlamorTokens.Color.accent` |
| `control.h-sm` | `--control-h-sm` | `GlamorTokens.Length.controlHSm` |
| `sand.25` | `--sand-25` | `GlamorTokens.Color.sand25` |

Swift groups by kind: `Color` (light/dark pair), `Length` (points), `Compact` (compact-density lengths), `Number`, `Em`, `Duration` (seconds), `Curve`. Font stacks and box-shadows are web-only and not in Swift.

## Modes

| Mode | Web | Swift |
|---|---|---|
| `dark` | `[data-theme="dark"]`, and `@media (prefers-color-scheme:dark)` unless `data-theme="light"`; sets `color-scheme` and `::selection` | `ColorPair.dark` |
| `compact` | `[data-density="compact"]` | `GlamorTokens.Compact` |
| `coarse` | `@media (pointer: coarse)` on `:root` and `[data-density="compact"]` | not emitted; touch devices use `GlamorTokens.Length.tapMin` |
| `increased` | `@media (prefers-contrast: more)` on `:root` | `ColorPair.increasedLight` |
| `increased-dark` | the same, on both dark selectors | `ColorPair.increasedDark` |

The blocks for each mode live in root `$extensions."com.efolusi.meridian".modes`. `color-scheme` and `::selection` are fixed extras there, not tokens, and go only into the CSS files that hold colors.

A token with an `increased` value must also have `increased-dark`; otherwise dark screens with more contrast would get the light value. In Swift, a missing increased value falls back to the normal one (`increased-dark` falls back to `dark`).

Product themes, such as Komando's grey palette, live in the product repo as an override file with the same role names and only values. This repo holds one Efolusi default.
