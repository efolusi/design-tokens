# Status and brand semantic tokens

A component reads a semantic token, never a ramp stop (`--danger-600`, `--sand-400`, `--brand-700`). The semantic layer is remapped per theme, so a rebrand or the dark theme restyles every status surface in one place.

## Status layer

Four statuses (`success`, `warning`, `danger`, `info`), five tokens each. CSS names are `--status-<s>-<part>`; Swift names are `status<S><Part>` (for example `statusDangerOnSolid`).

| Part | Use | Contrast rule |
|---|---|---|
| `bg` | Tint behind a message, badge or row | Ground for `text` |
| `border` | Border of that tint | None (decorative edge) |
| `text` | Text and icons on the tint, the card or the page | 4.5:1 on `bg`, `surface.card` and `surface.page` |
| `solid` | Solid fill: filled badge, dot, bar | 3:1 on `surface.card` |
| `on-solid` | Text and icons on `solid` | 4.5:1 on `solid` |

`tests/status.test.mjs` checks every pair in light, dark, and both Increase contrast modes. In dark, `bg`, `border` and `text` take different values from light: the tint turns dark and the text turns light.

`info` is new in this release. Its ramp (`info.100`, `.300`, `.600`, `.on-dark`, `.contrast`) follows the other statuses, but components read `status.info.*`, not the ramp.

Note: status border is decorative; a component that shows status by its outline alone uses `status-<s>-solid` for the outline.

Never signal a status by colour alone: pair `text` or `solid` with a word or an icon.

## Brand and sand mappings

Where a ramp stop was used raw, use the semantic token that already exists, or one of the six added here.

| Raw stop | Use instead |
|---|---|
| `brand-50`, `cream-50` | `accent.subtle` |
| `brand-100`, `brand-200`, `peach-200` | `accent.subtle-border` |
| `brand-700`, `cocoa-700`, `cocoa-900` | By meaning: `text.link` for a link, `focus.ring-color` for a focus ring, `accent.subtle-fg` for text on an accent tint |
| `brand-600` (a Toast info icon) | `status.info.text`; info is a status now |
| `brand-300` | `accent.soft` (fill, not text); `accent.subtle-fg` for text |
| `brand-500`, `caramel-500` | `accent.warm` (a mark, not text; pair with a label) |
| `brand-800` | `surface.brand-hover` |
| `brand-900`, `brand-950` | `surface.brand`, `accent` |
| `sand-200` | `surface.track` (progress track, step line) or `border.default` |
| `sand-300` | `border.strong` |
| `sand-400` | `border.hover` (hover border, quiet separator) |
| `sand-400` on a disabled control | `text.disabled` |
| `sand-500` | `border.control` |
| `sand-700`, `sand-750` | `text.secondary` |
| `success-500` (an Avatar presence badge) | `status.success.solid` (3:1 on the card) |
| `success-100` (also warning, danger) | `status.<s>.bg` |
| `success-300` (also warning, danger) | `status.<s>.border` |
| `success-600` (also warning, danger; `danger-700` too) | `status.<s>.text` for text and icons, `status.<s>.solid` for a fill |
| `success-on-dark` (also warning, danger) | `status.<s>.text` |
| `success-contrast` (also warning, danger) | `status.<s>.on-solid` |

Added: `border.hover`, `surface.track`, `surface.brand-hover`, `text.disabled`, `accent.warm`, `accent.soft`.

`accent.warm` is 2.99:1 on a white card, so it is a mark, never the only carrier of meaning.

## Loop durations

`dur.loop` (1400 ms) and `dur.loop-slow` (1600 ms) are one turn of a looping animation: a skeleton pulse, a pending row, a shimmer, a status ring. They are in CSS, JS and Swift. Unlike other durations they have no reduced-motion value, because a loop is stopped under reduced motion, not shortened: the consumer removes the animation inside `prefers-reduced-motion: reduce` (Glamor: `reduceMotion`).
