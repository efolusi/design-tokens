# Motion

The shared motion scale: durations, curves, distance steps, enter scales and holds. Web (Meridian) reads it from `tokens/web/effects.css`; native (Glamor) reads the same numbers from `tokens/native/GlamorTokens.swift`. Source: the `dur`, `ease`, `shift`, `hold` and `guard` groups and `motion.enter-scale` in `tokens.json`.

## Durations

| Token | CSS | Value | Use |
|---|---|---|---|
| `dur.fast` | `--dur-fast` | 120 ms | A symbol swap, a copied check, a hover or focus colour. Also the reduced-motion fade. |
| `dur.base` | `--dur-base` | 200 ms | Something arriving or leaving in place: a notice, a menu, a card state. |
| `dur.slow` | `--dur-slow` | 250 ms | A panel or drawer opening in place, and the exit of a modal. Only `dur.modal` is longer. |
| `dur.progress` | `--dur-progress` | 250 ms | A bar moving to a new value. Use the `linear` keyword with it: a keyword has no numbers to share. |
| `dur.modal` | `--dur-modal` | 400 ms | A modal, a drawer or a panel arriving. The one long duration, on web and native. |
| `dur.loop` | `--dur-loop` | 1400 ms | One turn of a looping pulse (skeleton, pending row, loader). Stopped under reduced motion, not shortened. |
| `dur.loop-slow` | `--dur-loop-slow` | 1600 ms | One turn of a slower loop (shimmer, status ring). Use `linear` for a shimmer. |

## Curves

All four are `cubic-bezier` with four numbers. Every enter, exit and state change takes an ease-out: `ease.enter` or `ease.exit`, one curve. Loops use `linear`. Web uses them as written. SwiftUI uses `Animation.timingCurve(x1, y1, x2, y2, duration:)` with the same numbers, so both platforms run one curve.

| Token | CSS | Curve | Use |
|---|---|---|---|
| `ease.standard` | `--ease-standard` | `.65, 0, .35, 1` | A change in place. |
| `ease.enter` | `--ease-enter` | `.22, 1, .36, 1` | Arriving: fast start, decelerates, no overshoot. |
| `ease.exit` | `--ease-exit` | `.22, 1, .36, 1` | Leaving: the same curve as `ease.enter`. An exit uses ease-out too. |
| `ease.emphasised` | `--ease-emphasised` | `.3, 1.04, .35, 1` | One clear moment: a toast landing, a counter finishing. Overshoots slightly. |

## Distance

`shift.sm`, `shift.md`, `shift.lg` and `shift.xl` are 4, 8, 16 and 32 points. They alias `space.1`, `space.2`, `space.4` and `space.8`, so they add no new numbers. `effects.css` refers to `--space-*`: load `spacing.css` with it (`tokens.css` and Meridian's `styles.css` already do).

| Token | CSS | Use |
|---|---|---|
| `shift.sm` | `--shift-sm` | A hover lift, a tooltip. |
| `shift.md` | `--shift-md` | How far an arriving thing travels. |
| `shift.lg` | `--shift-lg` | A drawer or card entering; a reveal-on-scroll lift. |
| `shift.xl` | `--shift-xl` | A long travel: a page or section transition, a sheet or side panel entering. |

## Enter scale

A surface that enters grows from a scale below 1. The larger the surface, the smaller the change, because a big surface scaling from 0.95 changes too much of the screen.

| Token | CSS | Value | Use |
|---|---|---|---|
| `motion.enter-scale.sm` | `--motion-enter-scale-sm` | 0.97 | A tooltip, a dropdown. |
| `motion.enter-scale.lg` | `--motion-enter-scale-lg` | 0.98 | A modal, a panel. |

`motion.press` (0.98) and `motion.lift` (1.012) are the press and hover scales of controls, not enter scales.

## Exit pairing

An exit is one step shorter than its enter. Pick the exit duration from the enter duration:

- A fast enter (`dur.fast`, 120 ms) exits with `dur.fast`, 120 ms.
- A base enter (`dur.base`, 200 ms) exits with `dur.fast`, 120 ms.
- A slow enter (`dur.slow`, 250 ms) exits with `dur.base`, 200 ms.
- A modal enter (`dur.modal`, 400 ms) exits with `dur.slow`, 250 ms.

The fast enter is the floor: nothing is shorter than `dur.fast`, so it exits at the same 120 ms. The exit takes `ease.exit`, an ease-out, like every enter and state change.

## House values

- Press 0.98 and fast 120 are the house values. `motion.press` is 0.98 and `dur.fast` is 120 ms, on every control, in both libraries. A product does not pick its own press scale or hover time.
- Ease-out for every enter, exit and state change. Loops use `linear`: a skeleton, a shimmer, a spinner.
- Springs are for things with weight, and only on native: a sheet opening, a drag settling, a slider thumb. A colour or opacity change never takes a spring. A spring has `bounce` 0.

## Holds and delays

Behaviour constants, so a web skeleton and a native spinner wait the same time. They are not motion and do not change under reduced motion.

| Token | CSS | Value | Use |
|---|---|---|---|
| `hold.spinner-delay` | `--hold-spinner-delay` | 300 ms | Wait this long before showing a spinner or skeleton. |
| `hold.spinner-min` | `--hold-spinner-min` | 500 ms | Once shown, keep it at least this long. |
| `hold.confirm` | `--hold-confirm` | 1500 ms | How long a confirmation (a copied check) stays. |
| `hold.notice` | `--hold-notice` | 8000 ms | How long a self-dismissing notice stays. Only the notices allowed to dismiss themselves use it (see Notices). |
| `guard.click` | `--guard-click` | 300 ms | Ignore a second click this soon after the first. |

## Reduced motion

The rule every consumer follows:

- `dur.base`, `dur.slow` and `dur.modal` become the `dur.fast` fade, with no travel. `shift.*` is 0 and the enter scales are 1.
- Movement, scale and blur run only under `prefers-reduced-motion: no-preference`. Under `reduce`, an enter or an exit is an opacity cross-fade. The press scale stays: it is brief feedback, not travel.
- `dur.progress` becomes an instant jump. Shimmer and counters show the final state at once.
- `ease.emphasised` becomes `ease.standard`: it is the one curve that overshoots, and a bounce is motion. `ease.standard`, `ease.enter` and `ease.exit` stay as they are, because none of their control points leaves the 0 to 1 range.
- A transition that only moves, with no opacity change, is dropped.

Web: `effects.css` swaps the tokens (durations, shifts and the curve) inside `@media (prefers-reduced-motion:reduce)`, so a component does not write its own query. A JavaScript animation (a count-up, a smooth scroll) cannot read a CSS token swap: it checks `matchMedia('(prefers-reduced-motion: reduce)')` itself. Native: Glamor's `MotionToken.animation(reduceMotion:)` applies the same rule, including the curve swap (`easeEmphasised` becomes `easeStandard` when `reduceMotion` is on); the Swift output carries no reduced values.

## Rules for consumers

- Take a duration and a curve from the tokens. A literal duration or curve in a component is a bug.
- Animate `opacity` and `transform`. A `transition` on `width`, `height`, `top` or `left` makes the browser lay the page out on every frame.
- Hold the motion budget: product UI never runs longer than `dur.slow`, except a modal, a drawer or a panel arriving, which takes `dur.modal`.
- A notice follows the rules in Notices below.

## Notices

`hold.notice` is only a number. These rules come with it, because every consumer builds its notices from this contract (WCAG 2.2.1 Timing Adjustable):

1. A notice with an action, an error, or anything the user must act on never dismisses itself.
2. A notice that does dismiss itself pauses while it is hovered or focused (keyboard users included) and while the window is not visible, and it has a visible dismiss control.
3. It is announced through a polite live region (`role="status"`, or one `role="log"` stack with `aria-live="polite"` that holds the notices, with no role on each notice, so nothing is announced twice), so a screen-reader user hears it within the hold.

## Renamed in 0.4.0

No alias is kept. Replace each name where you use it.

| Before | After | Value change |
|---|---|---|
| `--dur-med`, `dur.med` | `--dur-base`, `dur.base` | 160 → 200 ms |
| `--ease-out`, `ease.out` | `--ease-enter`, `ease.enter` | none |
| `--ease-in-out`, `ease.in-out` | `--ease-standard`, `ease.standard` | none |
| `--ease-spring`, `ease.spring` | `--ease-emphasised`, `ease.emphasised` | none |
| `--dur-fast` | `--dur-fast` | 100 → 120 ms |
| `--dur-slow` | `--dur-slow` | 240 → 250 ms |

Swift names follow the same rename: `durMed` is `durBase`, `easeOut` is `easeEnter`, `easeInOut` is `easeStandard`, `easeSpring` is `easeEmphasised`.

## Removed in 0.9.0

No alias is kept. Replace each name where you use it.

| Before | After | Value change |
|---|---|---|
| `--dur-long`, `dur.long` (web only) | `--dur-modal`, `dur.modal` (web and native) | 480 → 400 ms |

Swift: `durModal` is new (0.4 s); there was no `durLong`.
