# Changelog

Releases are tags on this repo. Consumers re-vendor to the same tag (see [docs/consumers.md](docs/consumers.md)).

## v0.8.0 - 2026-11-27

Semver level: MINOR (v0.8.0). Tokens are removed, which is breaking for any consumer that used them; while this repo is used only inside Efolusi, 0.6.0 and 0.7.0 shipped the same kind of change as a minor. The release also carries DT01 and DT02 below.

- **Breaking: the accent is the owl's copper, the `ember` ramp is removed** (DT15, [docs/glass.md](docs/glass.md#the-accent)). Decided by the chief on 2026-11-27 (accent option B): one hue, `#CD8F69`, in both themes, so the interface fits the logo. A copper fill reads 2.12 to 2.72:1 as a shape on a light surface, so the shape or icon uses the new `accent.edge` (3:1, WCAG 1.4.11), and the accent as text is `text.link` (4.5:1). The `accent._` as text pair of the contrast tests is replaced by `accent.edge` at 3:1 on the page, card, sunken, track and border; `npm run contrast` checks those pairs in light, dark and both Increase contrast modes, and the new link, tint and focus pairs too (304 pairs, was 268).

  | Kind | Names |
  |---|---|
  | Removed, no alias (6) | `ember.50`, `ember.100`, `ember.150`, `ember.300`, `ember.600`, `ember.700` (CSS `--ember-50` and so on, `tokens.js` `ember-50`, Swift `GlamorTokens.Color.ember50`, DTCG `ember.50`: 24 export entries) |
  | New (5) | `copper.300` `#E7B496`, `copper.400` `#DBA582`, `copper.500` `#CD8F69`, `copper.600` `#BD805A`, `accent.edge` (`--accent-edge`, Swift `accentEdge`): light `#A0693C`, dark `#CD8F69`, increased `#443D32`, increased-dark `#EFCFAC` |

  | Token | Light, old → new | Dark, old → new |
  |---|---|---|
  | `accent` | `#B8491D` → `#CD8F69` | `#F2A36B` → `#CD8F69` |
  | `accent.hover` | `#A1401A` → `#DBA582` | `#F6BB8F` → `#DBA582` |
  | `accent.active` | `#8A3615` → `#BD805A` | `#E8935A` → `#BD805A` |
  | `accent.subtle` | `#FCEEE4` → `#F4E9D2` | `#3A2418` (same) |
  | `accent.subtle-border` | `#F7D9C2` → `#EFCFAC` | `#5A3622` (same) |
  | `accent.contrast` | `#FFFFFF` → `#1E1A14` | `#1E1A14` (same) |
  | `accent.subtle-fg` | `#A1401A` → `#5C3A1F` | `#F2A36B` → `#EFCFAC` |
  | `text.link` | `#A1401A` → `#7A4E2B` | `#F2A36B` → `#DBA582` |
  | `text.link-hover` | `#7E3214` → `#5C3A1F` | `#F6BB8F` → `#E7B496` |
  | `focus.ring-color` | `#A1401A` → `#7A4E2B` | `#F2A36B` → `#DBA582` |
  | `surface.brand` | `#F7E6D6` → `#F4E9D2` | `#3A2418` (same) |
  | `surface.brand-hover` | `#F2DCC4` → `#EFCFAC` | `#44291B` (same) |
  | `field.1` | `#F7E6D6` → `#F4E9D2` | `#3A2418` (same) |
  | `field.2` | `#F2DCC4` → `#EFCFAC` | `#44291B` (same) |
  | `text.on-brand` | `#1E1A14` (same) | `#F7E6D6` → `#F4E9D2` |

  15 tokens, 22 changed values. `tone.band.fill` (light) and `tone.band.on-fill` (dark) follow their aliases, `focus.ring` and the dark `::selection` follow their colours: Swift shows 17 changed constants. The label on the accent is ink in both themes (6.37:1 on copper; white was 5.24:1 on ember).

  What a consumer does: re-vendor to v0.8.0 (Meridian `sync_tokens`, Glamor `scripts/vendor-tokens.sh`), then remove every `--ember-*` and `Color.ember*` use (a `var()` that points at a missing property is silently invalid); read `accent.edge` for a copper icon, line, thin fill or 1px edge on a light surface (`--accent-edge`, Swift `accentEdge`); use `text.link` for the accent as text; look at primary buttons, checked states, tabs and charts in light. Meridian and Glamor release the same day on the same tag.

- **`accent.edge` has Increase contrast values** (DT16). With `prefers-contrast: more` the border ground becomes the control edge (`#948A74`, `#7C725E`) and the copper edge read 1.34 and 1.75 there, so `accent.edge` is `sand.800` `#443D32` in light and `brand.200` `#EFCFAC` in dark: 3.14 and 3.21 on the control edge, 8.36 to 11.92 on the other grounds. Swift `accentEdge` carries `increasedLight` and `increasedDark`. No cocoa.

- **Font sizes below 11px** (DT01, [docs/sizes.md](docs/sizes.md)). `text.3xs` is 10px and `text.4xs` is 9px, so Meridian's sub-11px literals (MD07) can use tokens. Swift `text3xs` and `text4xs`.
- **Control heights 32px and 40px** (DT02). `control.h-sm-plus` is 32px (compact 28px) and `control.h-md-plus` is 40px (compact 34px), both `tap.min` on a coarse pointer, like the other heights. Swift `controlHSmPlus`, `controlHMdPlus`.

## v0.7.0 - 2026-11-22

- **Breaking: `material.glow` is removed** (DT13). The coloured glow read as too large; the rule now is contact shadows only, no coloured glow, and none in dark ([docs/glass.md](docs/glass.md)). Remove every `--material-glow` and `materialGlow` use.

## v0.6.1 - 2026-11-22

- **Fix: form-control edges keep 3:1 on the lifted dark surfaces** (DT12). `border.control` dark is `#7C725E` (was `{sand.600}`, 2.88:1 on `surface.sunken`; now 3.06, 3.39 on the card, 3.72 on the page). The contrast gate checks form-control edges on every surface, so a consumer pair like this fails here first.

## v0.6.0 - 2026-11-22

- **Warm glass palette** (DT09, [docs/glass.md](docs/glass.md)). The owner's direction of 2026-11-22: an `ember` ramp for the accent, links and focus; `sand.75` and `sand.150`; lighter paper and lifted dark surfaces; `surface.brand` becomes the warm band (`ember.100`, dark `#3A2418`) and `text.on-brand` dark ink on it. Cocoa stays only in the product marks and the wordmark. Radius 10, 16, 22, 28 px; `weight.display` 560, `tracking.display` -0.025em, `leading.tight` 1.1; softer shadows, and a ring plus shadow in dark. `field.0` to `field.3`: the quiet field behind the page.
- **Breaking: `tone.cocoa` is renamed `tone.band`.** Its fill is the warm band now, its text `text.on-brand`. Rename every `tone-cocoa` use.
- **Contrast kept on the lifted dark surfaces:** `text.muted` dark `#A89E8D`, `danger.600` dark `#EB6E5C` and increased-dark `#EC7C6D`, `warning.600` increased-dark `#DC8B3A`, `state.hover-on-tab` dark `#2C2520` and increased-dark `#3A322A`.
- **Glass material from one number** (DT10). `glass.strength` (0.33) and `material.*` derived from it: `clear`, `regular`, `chrome`, `thick` (with a floor so text behind a sheet never reads through), `blur`, `blur-thick`, `saturate`, `edge`, `spec`, `spec-low`, `sheen`, `glow`, `tint`; `field.strength`; `motion.lift` and `motion.press`. CSS keeps the formulas live; `tokens.js` and Swift get the numbers (`materialThickDark` for the dark floor). Every material turns solid under `prefers-reduced-transparency`, `prefers-contrast: more` and without `backdrop-filter` (new modes `reduced-transparency` and `no-backdrop`; mode blocks can now carry a `supports` condition).
- **Contrast gate for glass** (DT11). `npm run contrast` and a CI job check every pair on glass against the worst backdrop, and the sheet ghost-text limit.
- **A nested light subtree inside a dark page gets the light values back:** the base block and the `increased`, `reduced-transparency` and `no-backdrop` blocks also select `[data-theme="light"]`.
- **Fix: a nested dark subtree resolves aliases in dark** (DT07). An alias whose target changes in a mode (`status.success.bg`, `surface.panel`) is declared again in that mode's block.

- **The Design Tokens logo is the logo-system file.** `assets/design-tokens.svg` is replaced byte for byte by the approved file (sha256 starts 4877ab6e1951): the same four cells, now on the 64 artboard in the square box, one path. The README names `efolusi/efolusi` as the source of the marks.
- **New: the Design Tokens logo, `assets/design-tokens.svg`.** A circle, a square, a pill and a leaning bar in one grid, one colour, tight viewBox (ratio 1). It is the mark `efolusi.com` shows for Design Tokens.

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
