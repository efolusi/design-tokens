# Warm glass

The palette, the glass material and the rules that go with them. The owner chose this direction on 2026-11-22 ("halus"): a warm paper page and a touch of glass. The accent was ember until 2026-11-27 and is now the owl's copper (DT15, see "The accent" below). Cocoa (`brand.950`) stays only in the product marks and the wordmark; no interface token points at it.

## Palette

| Token | Light | Dark | Use |
|---|---|---|---|
| `copper.300` to `copper.600` | `#E7B496`, `#DBA582`, `#CD8F69`, `#BD805A` | ramp, same in both | The accent ramp: the owl's copper at 500 |
| `sand.75`, `sand.150` | `#F6F4EF`, `#EDE6DA` | ramp | New paper stops |
| `surface.page` | `{sand.25}` | `#1C1814` | The page |
| `surface.card` | `#FFFFFF` | `#26201B` | Cards |
| `surface.brand` | `{brand.100}` | `#3A2418` | The warm band (was a cocoa slab); text on it is `text.on-brand` |
| `accent` | `{copper.500}` | `{copper.500}` | Primary actions: the fill, one hue in both themes |
| `accent.edge` | `{brand.600}` | `{copper.500}` | The 1px edge of a copper fill and the colour of a copper icon, line or thin fill on a light surface |
| `text.link`, `focus.ring-color` | `{brand.700}` | `{copper.400}` | Links and focus |
| `field.0` to `field.3` | paper and three warm glows | dark paper and three warm glows | The field behind the page that glass blurs |

## The accent

Copper is lighter than the ember it replaced, so the accent works as a fill and a label, not as a line or as text:

| Role | Token | Light | Dark | Needs |
|---|---|---|---|---|
| The fill (button, checked box, switch on) | `accent` | `#CD8F69` | `#CD8F69` | none alone; the label on it is `accent.contrast` (ink `#1E1A14`, 6.37:1) |
| The shape or icon on a surface (the 1px edge of the fill, a check mark, a tab underline, a progress fill, a chart line) | `accent.edge` | `#A0693C` | `#CD8F69` | 3:1 on the page, card, sunken, track and border (WCAG 1.4.11): 3.58 to 4.58 in light, 4.63 to 6.49 in dark |
| The accent as text | `text.link` | `#7A4E2B` | `#DBA582` | 4.5:1 |

`accent` as a shape reads 2.12 to 2.72:1 on a light surface, so a component never draws a copper shape without `accent.edge`. In dark the edge is the fill, so it is invisible and moves no layout. Hover is `copper.400` and pressed `copper.600` in both themes. Cocoa stays out: `accent.subtle-fg` and `text.link-hover` use `brand.800`, no token uses `brand.900` or `brand.950`.

With Increase contrast `accent.edge` has no override: on the border ground, which becomes the control edge in that mode, it reads 1.34 (light) and 1.75 (dark). The ember accent was already below 3 there (1.53 and 2.31).

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
| `material.tint` | colour | `#FFFDF9` / `#26201B` | The glass colour; the opacities above apply to it |
| `field.strength` | s | 0.33 | Opacity of the field glows |

In CSS the formulas stay live (`calc(1 - var(--glass-strength) * 0.58)`). In `tokens.js` and Swift they are evaluated to numbers; a number that differs in dark gets its own Swift constant (`GlamorTokens.Number.materialThickDark`).

## Fallbacks

Every material becomes solid (opacity 1, blur 0, saturate 1, sheen 0) in three cases, emitted as mode blocks after the dark blocks so they win. The blocks select `:root`, `[data-theme="light"]` and `[data-theme="dark"]`, so a nested theme subtree turns solid too; the base block also selects `[data-theme="light"]`, so a light subtree inside a dark page gets the light values back:

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
- No coloured glow (owner, 2026-11-22: the shadow under the orange buttons looked too big). A filled button (accent, brand band, danger) has a contact shadow only: at most 3px offset and 8px blur, its coloured part at most 0.16 alpha; hover adds at most 2px of blur; in dark no coloured shadow at all. Glass bars and sheets use the neutral shadow scale.
- Decorative text added in CSS gets empty alt text (`content: "On" / ""`).

## Contrast gate

`npm run contrast` (`scripts/check-contrast.mjs`, a CI job) checks every text and icon pair against the worst backdrop that can sit behind it: each field stop at its strength, the accent, the code block, a card and the band, under chrome, clear and thick glass, in light and dark. Text needs 4.5:1, focus rings and the accent as a shape (`accent.edge` on the page, card, sunken, track and border) 3:1. Backdrops include pure black and pure white, for content that is not a token (photos, video, a product's own art), and the bar is checked for primary, muted and status text. Disabled text is exempt: WCAG 1.4.3 does not apply to inactive controls. It also checks the sheet rule: text behind a sheet shows at most 1.25:1 before the blur. It fails the build on any miss. The solid pairs (text on every surface, status colours, both Increase contrast modes) stay in `tests/contrast.test.mjs`, which `npm test` runs.
