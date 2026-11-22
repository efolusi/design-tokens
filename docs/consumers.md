# Consumers

How Meridian and Glamor use this repo.

| Consumer | Runtime | Vendors | Pin and check |
|---|---|---|---|
| [Meridian](https://github.com/efolusi/meridian) | CSS, React, CDN / npm | `tokens.json`, `tokens/web/*.css` | `tokens/design-tokens.lock.json`; `scripts/sync_tokens.mjs --check` (upstream in CI) |
| [Glamor](https://github.com/efolusi/glamor) | SwiftUI | `tokens/native/GlamorTokens.swift` | `TOKENS_VERSION` and `TOKENS_COMMIT` in `scripts/vendor-tokens.sh`; `--check` |

## Shared rules

- Same token **names** and **roles** on web and native.
- Theme and density may change values; they should not invent parallel names for the same job.
- Product-only tokens stay out of this repo until a second product needs them.

## Releasing a new version

Web and native tokens stay identical only if both consumers move together:

1. Tag the new design-tokens version.
2. Re-vendor it in Meridian (`node scripts/sync_tokens.mjs <tag>`) and in Glamor (set `TOKENS_VERSION` and `TOKENS_COMMIT`, run `scripts/vendor-tokens.sh`), to the same tag.
3. Neither Meridian nor Glamor releases while it pins a different design-tokens version than the other.

A release that renames a token (0.4.0 renamed `dur.med`, `ease.out`, `ease.in-out` and `ease.spring`) lists every old and new name in its CHANGELOG and in [motion.md](motion.md); the consumer updates its callers in its own change, with no alias.

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

Swift groups by kind: `Color` (light/dark pair), `Length` (points), `Compact` (compact-density lengths), `Number`, `Em`, `Duration` (seconds), `Curve`. A number that differs in dark gets a second constant with `Dark` appended (`materialThickDark`). Values written as CSS math (`calc`, `min`, `max`, the glass material) stay live in CSS and are evaluated to numbers in `tokens.js` and Swift. Font stacks and box-shadows are web-only and not in Swift. A token can also be marked web-only in `tokens.json` (`"web-only": true` in its extension); `dur.long` is. The motion scale, its reduced-motion rule and the 0.4.0 renames are in [motion.md](motion.md).

## Modes

| Mode | Web | Swift |
|---|---|---|
| `dark` | `[data-theme="dark"]`, and `@media (prefers-color-scheme:dark)` unless `data-theme="light"`; sets `color-scheme` and `::selection` | `ColorPair.dark` |
| `compact` | `[data-density="compact"]` | `GlamorTokens.Compact` |
| `coarse` | `@media (pointer: coarse)` on `:root` and `[data-density="compact"]` | not emitted; touch devices use `GlamorTokens.Length.tapMin` |
| `increased` | `@media (prefers-contrast: more)` on `:root` and `[data-theme="light"]` | `ColorPair.increasedLight` |
| `increased-dark` | the same, on both dark selectors | `ColorPair.increasedDark` |
| `reduced-motion` | `@media (prefers-reduced-motion:reduce)` on `:root`, in `effects.css` only | not emitted; Glamor's `MotionToken.animation(reduceMotion:)` applies the rule |
| `reduced-transparency` | `@media (prefers-reduced-transparency: reduce)` on `:root`, `[data-theme="light"]` and `[data-theme="dark"]`: every material solid | not emitted; Glamor reads `accessibilityReduceTransparency` |
| `no-backdrop` | `@supports not (backdrop-filter: blur(1px))` on `:root`, `[data-theme="light"]` and `[data-theme="dark"]`: every material solid | not emitted |

The blocks for each mode live in root `$extensions."com.efolusi.meridian".modes`; a block has a `selector` and optionally a `media` or a `supports` condition. An alias whose target changes in a mode (`status.success.bg` is `{success.100}`, which turns dark) is declared again in that mode's block, so a nested `[data-theme="dark"]` subtree inside a light page resolves it to the dark value. `color-scheme` and `::selection` are fixed extras there, not tokens, and go only into the CSS files that hold colors.

A token with an `increased` value must also have `increased-dark`; otherwise dark screens with more contrast would get the light value. In Swift, a missing increased value falls back to the normal one (`increased-dark` falls back to `dark`).

Product themes, such as Komando's grey palette, live in the product repo as an override file with the same role names and only values. This repo holds one Efolusi default.
