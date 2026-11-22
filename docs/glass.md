# Warm glass

The palette, the glass material and the rules that go with them. The owner chose this direction on 2026-11-22 ("halus"): a warm paper page with an ember accent and a touch of glass. Cocoa (`brand.950`) stays only in the product marks and the wordmark; no interface token points at it.

## Palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `ember.50` to `ember.700` | `#FCEEE4`, `#F7E6D6`, `#F2DCC4`, `#F2A36B`, `#B8491D`, `#A1401A` | ramp, same in both | Accent ramp: a deeper, livelier step of caramel |
| `sand.75`, `sand.150` | `#F6F4EF`, `#EDE6DA` | ramp | New paper stops |
| `surface.page` | `{sand.25}` | `#1C1814` | The page |
| `surface.card` | `#FFFFFF` | `#26201B` | Cards |
| `surface.brand` | `{ember.100}` | `#3A2418` | The warm band (was a cocoa slab); text on it is `text.on-brand` |
| `accent` | `{ember.600}` | `{ember.300}` | Primary actions |
| `text.link`, `focus.ring-color` | `{ember.700}` | `{ember.300}` | Links and focus |
| `field.0` to `field.3` | paper and three warm glows | dark paper and three warm glows | The field behind the page that glass blurs |

Shape: `radius.sm` to `xl` are 10, 16, 22 and 28 px. `weight.display` is 560, `tracking.display` -0.025em, `leading.tight` 1.1. Elevation is `shadow.sm`, `md`, `lg`: soft warm shadows in light, a 1 px `#3A322A` ring plus a black shadow in dark.

## One number: `glass.strength`

`glass.strength` is 0.33. Every material value is derived from it, so changing the strength is one edit:

| Token | Formula | At 0.33 (light / dark) | Use |
|---|---|---|---|
| `material.clear` | 1 − s × 0.58 | 0.8086 | Controls on a panel: theme switch, segmented control, search field |
| `material.regular` | 1 − s × 0.54 | 0.8218 | Cards and panels on the static field, no backdrop blur |
| `material.chrome` | 1 − s × 0.18 | 0.9406 | Bars that content scrolls under. As thick as a sheet at 0.33: muted and status text sit on bars too, over any content |
| `material.thick` | max(0.92, 1 − s × 0.18) / max(0.94, 1 − s × 0.16) | 0.9406 / 0.9472 | Sheets and popovers |
| `material.blur` | 12px + 16px × s | 17.28px | Backdrop blur of bars |
| `material.blur-thick` | fixed | 28px | Backdrop blur of sheets and popovers |
| `material.saturate` | 1 + 0.8 × s | 1.264 | Backdrop saturation |
| `material.edge`, `spec` | 0.75 or 0.95 × min(1, 1.6 s); dark 0.14 or 0.22 × … | 0.396, 0.5016 / 0.0739, 0.1162 | White rim and inner top highlight |
| `material.spec-low`, `sheen` | 0.35 or 0.55 × s; dark 0.05 or 0.1 × s | 0.1155, 0.1815 / 0.0165, 0.033 | Inner bottom highlight, diagonal sheen |
| `material.glow` | 0; dark 0.18 × s | 0 / 0.0594 | Accent glow around bars and sheets in dark |
| `material.tint` | colour | `#FFFDF9` / `#26201B` | The glass colour; the opacities above apply to it |
| `field.strength` | s | 0.33 | Opacity of the field glows |

In CSS the formulas stay live (`calc(1 - var(--glass-strength) * 0.58)`). In `tokens.js` and Swift they are evaluated to numbers; a number that differs in dark gets its own Swift constant (`GlamorTokens.Number.materialThickDark`).

## Fallbacks

Every material becomes solid (opacity 1, blur 0, saturate 1, sheen and glow 0) in three cases, emitted as mode blocks after the dark blocks so they win. The blocks select `:root`, `[data-theme="light"]` and `[data-theme="dark"]`, so a nested theme subtree turns solid too; the base block also selects `[data-theme="light"]`, so a light subtree inside a dark page gets the light values back:

| Mode | Web |
|---|---|
| `reduced-transparency` | `@media (prefers-reduced-transparency: reduce)` |
| `increased` | `@media (prefers-contrast: more)` |
| `no-backdrop` | `@supports not (backdrop-filter: blur(1px))` |

Forced colours are the component's job (Meridian): system colours, no blur, and a visible style for every selected or checked state.

## Rules for components

- Blur only what content scrolls under: bars, toolbars, the tab bar, sheets, popovers. Cards and panels use `material.regular` without a backdrop blur.
- At most four blurred surfaces on screen. Never nest a blurred surface in another: the outer one becomes the backdrop root and the inner one blurs nothing.
- Sheets and popovers never animate their opacity. An opacity entrance shows the text behind them for the length of the animation. Enter by transform only.
- Only `text.primary` sits on chrome glass; `text.secondary` sits on clear and thick glass, where the gate below proves it.
- Decorative text added in CSS gets empty alt text (`content: "On" / ""`).

## Contrast gate

`npm run contrast` (`scripts/check-contrast.mjs`, a CI job) checks every text and icon pair against the worst backdrop that can sit behind it: each field stop at its strength, the accent, the code block, a card and the band, under chrome, clear and thick glass, in light and dark. Text needs 4.5:1, focus rings 3:1. Backdrops include pure black and pure white, for content that is not a token (photos, video, a product's own art), and the bar is checked for primary, muted and status text. Disabled text is exempt: WCAG 1.4.3 does not apply to inactive controls. It also checks the sheet rule: text behind a sheet shows at most 1.25:1 before the blur. It fails the build on any miss. The solid pairs (text on every surface, status colours, both Increase contrast modes) stay in `tests/contrast.test.mjs`, which `npm test` runs.
