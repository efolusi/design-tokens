# Changelog

Releases are tags on this repo. Consumers re-vendor to the same tag (see [docs/consumers.md](docs/consumers.md)).

## 0.4.0 — 2026-11-21

- **A shared motion scale** ([docs/motion.md](docs/motion.md)). Durations `dur.fast` 120 ms, `dur.base` 200 ms, `dur.slow` 250 ms, `dur.progress` 250 ms (use with `linear`) and `dur.long` 480 ms (web marketing only, not in Swift); four curves, `ease.standard`, `ease.enter`, `ease.exit` and `ease.emphasised`, each with four numbers so SwiftUI's `timingCurve` runs the same curve; distance steps `shift.sm`, `shift.md` and `shift.lg` (4, 8, 16, aliases of `space.1`, `space.2` and `space.4`); holds `hold.spinner-delay` 300 ms, `hold.spinner-min` 500 ms, `hold.confirm` 1500 ms, `hold.notice` 8000 ms and `guard.click` 300 ms. The numbers are Glamor's, so web and native share one set.
- **Reduced motion is in the tokens.** `effects.css` swaps them inside `@media (prefers-reduced-motion:reduce)`: `dur.base`, `dur.slow` and `dur.long` fall to the `dur.fast` fade, `dur.progress` is an instant jump, and `shift.*` is 0. `tokens.js` gets the same values as `modes["reduced-motion"]`. Swift carries no reduced values; Glamor applies the rule with `reduceMotion`.
- **Reduced motion does not bounce.** `ease.emphasised` becomes `ease.standard` in the reduced-motion block (CSS and `modes["reduced-motion"]` in `tokens.js`); `ease.standard`, `ease.enter` and `ease.exit` never overshoot and stay. Glamor's `reduceMotion` applies the same swap ([docs/motion.md](docs/motion.md)).
- **Notice rules are part of the contract** ([docs/motion.md](docs/motion.md#notices)): a notice with an action, an error, or anything the user must act on never dismisses itself; one that does pauses while hovered or focused and while the window is not visible, has a visible dismiss control, and is announced through a polite live region (`role="status"`). This is WCAG 2.2.1 for `hold.notice`.
- **Breaking: four tokens renamed, no alias.** Replace each name where you use it.

  | Before | After |
  |---|---|
  | `--dur-med` (`dur.med`, Swift `durMed`) | `--dur-base` (`dur.base`, `durBase`) |
  | `--ease-out` (`ease.out`, `easeOut`) | `--ease-enter` (`ease.enter`, `easeEnter`) |
  | `--ease-in-out` (`ease.in-out`, `easeInOut`) | `--ease-standard` (`ease.standard`, `easeStandard`) |
  | `--ease-spring` (`ease.spring`, `easeSpring`) | `--ease-emphasised` (`ease.emphasised`, `easeEmphasised`) |

- **Three values changed, names kept:** `dur.fast` 100 → 120 ms, `dur.base` (was `dur.med`) 160 → 200 ms, `dur.slow` 240 → 250 ms.
- **A token can be web-only.** `"web-only": true` in a token's extension keeps it in the CSS and the JS and out of Swift; `dur.long` is the first.
- **The motion tokens sit in `effects.css`** with the shadows and z-index. `shift.*` aliases `--space-*`, so load `spacing.css` with it.
- Meridian and Glamor re-vendor to 0.4.0 before either releases. Meridian's callers of the renamed tokens, and Glamor's re-vendor, are separate changes.
