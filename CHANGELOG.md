# Changelog

Releases are tags on this repo. Consumers re-vendor to the same tag (see [docs/consumers.md](docs/consumers.md)).

## v0.5.0 - 2026-11-22

- **A semantic status layer** ([docs/status.md](docs/status.md)). `--status-<s>-bg`, `-border`, `-text`, `-solid` and `-on-solid` for `success`, `warning`, `danger` and `info` (Swift `statusDangerBg` and so on), remapped in dark and both Increase contrast modes. Tests hold 4.5:1 for `text` on `bg`, the card and the page, and for `on-solid` on `solid`, and 3:1 for `solid` on the card, in every mode.
- **Status border is decorative.** A component that shows status by its outline alone uses `status-<s>-solid` for the outline. `docs/status.md` also maps `brand-600` (Toast info icon) to `status.info.text` and `success-500` (Avatar badge) to `status.success.solid`.
- **An `info` ramp** (`info.100`, `.300`, `.600`, `.on-dark`, `.contrast`), the fourth status. Components read `status.info.*`.
- **Six semantic tokens for raw ramp uses** in Meridian's components: `border.hover`, `surface.track`, `surface.brand-hover`, `text.disabled`, `accent.warm`, `accent.soft`. The docs map every other raw `brand`, `sand`, `cream`, `peach`, `caramel` and `cocoa` stop to a token that already existed.
- **Loop durations.** `dur.loop` 1400 ms and `dur.loop-slow` 1600 ms, in CSS, JS and Swift, with no reduced-motion value: a loop stops, it is not shortened.
- **Notice rule 3 allows a `role="log"` stack.** The polite live region can be `role="status"`, or one `role="log"` stack with `aria-live="polite"` and no role on each notice, so nothing is announced twice (Meridian's Toast does this). A doc check states both.
- Additions only, so a MINOR release (0.5.0). Meridian re-vendors, then Glamor.

## v0.4.0 - 2026-11-21

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
