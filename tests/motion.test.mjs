import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, OUTPUTS, resolver, valueIn, swiftKind, swiftName, cssName, buildCss, buildSwift } from "../scripts/build.mjs";

// DT03 (#11): the shared motion scale. Glamor's numbers, four curves, distance steps that
// reference the space scale, the holds, and the reduced-motion rule.
// DT20, DT21 (v0.9.0): ease.exit is ease-out, dur.modal replaces dur.long, enter scales, shift.xl, the exit pairing.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = load();
const resolve = resolver(src.tokens);
const token = (name) => src.tokens.find((t) => t.path.join(".") === name);
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const css = read("tokens/web/effects.css");
const swift = read("tokens/native/GlamorTokens.swift");

const DURATIONS = { "dur.fast": 120, "dur.base": 200, "dur.slow": 250, "dur.progress": 250, "dur.modal": 400 };
const CURVES = {
  "ease.standard": [0.65, 0, 0.35, 1],
  "ease.enter": [0.22, 1, 0.36, 1],
  "ease.exit": [0.22, 1, 0.36, 1],
  "ease.emphasised": [0.3, 1.04, 0.35, 1],
};
const SHIFTS = { "shift.sm": 4, "shift.md": 8, "shift.lg": 16, "shift.xl": 32 };
const ENTER_SCALES = { "motion.enter-scale.sm": 0.97, "motion.enter-scale.lg": 0.98 };
const HOLDS = { "hold.spinner-delay": 300, "hold.spinner-min": 500, "hold.confirm": 1500, "hold.notice": 8000, "guard.click": 300 };

test("durations are the agreed numbers, in the DTCG duration type", () => {
  for (const [name, ms] of Object.entries(DURATIONS)) {
    const t = token(name);
    assert.ok(t, name);
    assert.equal(t.type, "duration", name);
    assert.equal(t.value, `${ms}ms`, name);
  }
});

test("the four curves are cubic-bezier with four numbers each", () => {
  for (const [name, points] of Object.entries(CURVES)) {
    const t = token(name);
    assert.ok(t, name);
    assert.equal(t.type, "cubicBezier", name);
    const m = t.value.match(/^cubic-bezier\(([^)]+)\)$/);
    assert.ok(m, name);
    assert.deepEqual(m[1].split(",").map(Number), points, name);
  }
});

test("distance steps reference the space scale and add no numbers", () => {
  const space = { "shift.sm": "space.1", "shift.md": "space.2", "shift.lg": "space.4", "shift.xl": "space.8" };
  for (const [name, target] of Object.entries(space)) {
    const t = token(name);
    assert.ok(t, name);
    assert.equal(t.type, "dimension", name);
    assert.equal(t.value, `{${target}}`, name);
    assert.equal(resolve(t.value, null), `${SHIFTS[name]}px`, name);
  }
});

test("holds and the click guard are durations", () => {
  for (const [name, ms] of Object.entries(HOLDS)) {
    const t = token(name);
    assert.ok(t, name);
    assert.equal(t.type, "duration", name);
    assert.equal(t.value, `${ms}ms`, name);
  }
});

test("the old names are gone from the source and every output, with no alias", () => {
  for (const old of ["dur.med", "ease.out", "ease.in-out", "ease.spring"]) assert.equal(token(old), undefined, old);
  const files = ["tokens.json", ...Object.keys(OUTPUTS)];
  for (const file of files) {
    const text = read(file);
    assert.doesNotMatch(text, /--dur-med\b|--ease-out\b|--ease-in-out\b|--ease-spring\b/, file);
    assert.doesNotMatch(text, /\bdurMed\b|\beaseOut\b|\beaseInOut\b|\beaseSpring\b/, file);
  }
});

test("in-place motion stays within 250 ms; only the modal duration is longer, inside 350 to 450 ms", () => {
  const ms = (name) => Number(token(name).value.replace("ms", ""));
  for (const name of ["dur.fast", "dur.base", "dur.slow", "dur.progress"]) assert.ok(ms(name) <= 250, name);
  assert.ok(ms("dur.modal") >= 350 && ms("dur.modal") <= 450, "dur.modal is for modals, drawers and panels: 350 to 450 ms");
  assert.ok(ms("dur.fast") < ms("dur.base") && ms("dur.base") < ms("dur.slow") && ms("dur.slow") < ms("dur.modal"));
});

test("dur.long is gone from the source and every output, with no alias; dur.modal replaces it", () => {
  assert.equal(token("dur.long"), undefined);
  assert.ok(token("dur.modal"));
  for (const file of ["tokens.json", ...Object.keys(OUTPUTS)]) {
    const text = read(file);
    assert.doesNotMatch(text, /--dur-long\b|"dur-long"|\bdurLong\b|"long":\s*\{/, file);
  }
});

test("ease.exit is an ease-out: the same curve as ease.enter, and the description says an exit uses ease-out too", () => {
  assert.equal(token("ease.exit").value, token("ease.enter").value);
  assert.match(JSON.parse(read("tokens.json")).ease.exit.$description, /an exit uses ease-out too/);
  assert.match(css, /--ease-exit: cubic-bezier\(\.22,1,\.36,1\);/);
});

test("enter scales: 0.97 for tooltips and dropdowns, 0.98 for modals and panels", () => {
  for (const [name, n] of Object.entries(ENTER_SCALES)) {
    const t = token(name);
    assert.ok(t, name);
    assert.equal(t.type, "number", name);
    assert.equal(Number(t.value), n, name);
    assert.equal(t.modes["reduced-motion"], "1", `${name} is no scale under reduced motion`);
  }
  assert.match(css, /^  --motion-enter-scale-sm: 0\.97;/m);
  assert.match(css, /^  --motion-enter-scale-lg: 0\.98;/m);
  assert.match(swift, /static let motionEnterScaleSm: Double = 0\.97/);
  assert.match(swift, /static let motionEnterScaleLg: Double = 0\.98/);
  // a larger surface scales less
  assert.ok(Number(token("motion.enter-scale.sm").value) < Number(token("motion.enter-scale.lg").value));
});

test("the CSS holds every motion token with the same numbers", () => {
  const value = (name) => css.match(new RegExp(`^  --${name}: ([^;]+);`, "m"))?.[1];
  for (const [name, ms] of Object.entries({ ...DURATIONS, ...HOLDS })) assert.equal(value(cssName(name.split("."))), `${ms}ms`, name);
  for (const [name, points] of Object.entries(CURVES)) {
    assert.deepEqual(value(cssName(name.split("."))).match(/cubic-bezier\(([^)]+)\)/)[1].split(",").map(Number), points, name);
  }
  assert.equal(value("shift-sm"), "var(--space-1)");
  assert.equal(value("shift-md"), "var(--space-2)");
  assert.equal(value("shift-lg"), "var(--space-4)");
  assert.equal(value("shift-xl"), "var(--space-8)");
});

test("the Swift output holds the same numbers as the CSS (seconds, points, control points)", () => {
  const dbl = (name) => Number(swift.match(new RegExp(`static let ${name}: Double = ([\\d.]+)`))?.[1]);
  for (const [name, ms] of Object.entries(DURATIONS)) assert.equal(dbl(swiftName(name.split("."))), ms / 1000, name);
  for (const [name, ms] of Object.entries(HOLDS)) assert.equal(dbl(swiftName(name.split("."))), ms / 1000, name);
  for (const [name, px] of Object.entries(SHIFTS)) assert.equal(dbl(swiftName(name.split("."))), px, name);
  for (const [name, points] of Object.entries(CURVES)) {
    const m = swift.match(new RegExp(`static let ${swiftName(name.split("."))} = Bezier\\(([^)]+)\\)`));
    assert.ok(m, name);
    assert.deepEqual(m[1].split(",").map(Number), points, name);
  }
});

test("dur.modal is on both platforms: in the CSS, the JS and Swift (Glamor reads it too)", async () => {
  assert.equal(token("dur.modal").webOnly, false);
  assert.notEqual(swiftKind(token("dur.modal")), null);
  assert.match(swift, /static let durModal: Double = 0\.4/);
  assert.match(css, /--dur-modal: 400ms;/);
  const { tokens } = await import("../tokens/web/tokens.js");
  assert.equal(tokens["dur-modal"], "400ms");
});

test("reduced motion: base, slow and modal fall to the fast fade, progress is instant, shifts are zero, enter scales are 1", () => {
  const block = css.match(/@media \(prefers-reduced-motion:reduce\) \{\n  :root \{\n([\s\S]*?)\n  \}\n\}/);
  assert.ok(block, "effects.css needs a prefers-reduced-motion block on :root");
  const body = block[1];
  for (const name of ["dur-base", "dur-slow", "dur-modal"]) assert.match(body, new RegExp(`--${name}: var\\(--dur-fast\\);`), name);
  assert.match(body, /--dur-progress: 0ms;/);
  for (const name of ["shift-sm", "shift-md", "shift-lg", "shift-xl"]) assert.match(body, new RegExp(`--${name}: 0;`), name);
  for (const name of ["motion-enter-scale-sm", "motion-enter-scale-lg"]) assert.match(body, new RegExp(`--${name}: 1;`), name);
  // fast stays, so the fade still happens; holds and the guard are behaviour, not motion
  assert.doesNotMatch(body, /--dur-fast:|--hold-|--guard-/);
  // the only curve that changes is the one that overshoots
  assert.deepEqual(body.match(/--ease-[\w-]+:/g), ["--ease-emphasised:"]);
});

test("reduced motion is in the JS modes too, and Swift leaves it to Glamor's reduceMotion", async () => {
  const { tokens, modes } = await import("../tokens/web/tokens.js");
  assert.ok(modes["reduced-motion"], "modes.reduced-motion");
  assert.equal(modes["reduced-motion"]["dur-base"], tokens["dur-fast"]);
  assert.equal(modes["reduced-motion"]["dur-progress"], "0ms");
  assert.equal(modes["reduced-motion"]["shift-md"], "0");
  assert.doesNotMatch(swift, /reducedMotion|reduced-motion/i);
});

test("the reduced values are never longer than the fast fade", () => {
  const ms = (v) => Number(String(v).replace("ms", ""));
  const fast = ms(token("dur.fast").value);
  for (const t of src.tokens.filter((t) => t.path[0] === "dur" && "reduced-motion" in t.modes)) {
    assert.ok(ms(resolve(valueIn(t, "reduced-motion"), "reduced-motion")) <= fast, t.path.join("."));
  }
  for (const name of ["dur.base", "dur.slow", "dur.modal", "dur.progress"]) assert.ok("reduced-motion" in token(name).modes, name);
  assert.ok(!("reduced-motion" in token("dur.fast").modes));
});

test("the motion tokens live in effects.css and nowhere else", () => {
  for (const f of ["colors.css", "typography.css", "spacing.css"]) assert.doesNotMatch(read(`tokens/web/${f}`), /--(dur|ease|shift|hold|guard)-/, f);
  const all = read("tokens/web/tokens.css");
  for (const name of ["dur-base", "dur-modal", "ease-exit", "shift-lg", "shift-xl", "motion-enter-scale-sm", "hold-notice", "guard-click"]) assert.match(all, new RegExp(`--${name}:`), name);
});

test("generated outputs are fresh (rebuild with npm run build)", () => {
  for (const [file, build] of Object.entries(OUTPUTS)) assert.equal(read(file), build(src), file);
  assert.equal(buildCss(src).includes("prefers-reduced-motion"), true);
  assert.equal(typeof buildSwift(src), "string");
});

test("reduced motion: the bouncing curve falls to ease.standard, the others need no swap", async () => {
  assert.equal(token("ease.emphasised").modes["reduced-motion"], "{ease.standard}");
  assert.match(css, /@media \(prefers-reduced-motion:reduce\) \{\n  :root \{\n[\s\S]*--ease-emphasised: var\(--ease-standard\);/);
  const { tokens, modes } = await import("../tokens/web/tokens.js");
  assert.equal(modes["reduced-motion"]["ease-emphasised"], tokens["ease-standard"]);
  // a curve overshoots when a control point's y leaves 0..1; only emphasised may, and only outside reduced motion
  const overshoots = (name) => token(name).value.match(/\(([^)]+)\)/)[1].split(",").map(Number).filter((_, i) => i % 2 === 1).some((y) => y < 0 || y > 1);
  for (const name of ["ease.standard", "ease.enter", "ease.exit"]) {
    assert.equal(overshoots(name), false, `${name} does not overshoot`);
    assert.ok(!("reduced-motion" in token(name).modes), `${name} needs no reduced-motion swap`);
  }
  assert.equal(overshoots("ease.emphasised"), true);
  const reduced = resolve(token("ease.emphasised").modes["reduced-motion"], "reduced-motion");
  assert.deepEqual(reduced.match(/\(([^)]+)\)/)[1].split(",").map(Number), CURVES["ease.standard"]);
});

test("docs/motion.md tells Glamor the same curve swap", () => {
  const doc = read("docs/motion.md");
  assert.match(doc, /`ease\.emphasised` becomes `ease\.standard`/);
  assert.match(doc, /Glamor/);
});

test("docs/motion.md states the three notice rules as rules, not suggestions", () => {
  const doc = read("docs/motion.md");
  const section = doc.slice(doc.indexOf("## Notices"), doc.indexOf("## Renamed"));
  assert.ok(section.length > 0, "a Notices section");
  assert.match(section, /never dismisses itself/i);
  assert.match(section, /action, an error, or anything the user must act on/i);
  assert.match(section, /pauses while it is hovered or focused/i);
  assert.match(section, /while the window is not visible/i);
  assert.match(section, /visible dismiss control/i);
  assert.match(section, /polite live region/i);
  assert.match(section, /role="status"/);
  assert.match(section, /role="log"/);
  assert.match(section, /nothing is announced twice/);
  assert.match(section, /WCAG 2\.2\.1/);
  assert.doesNotMatch(section, /\bshould\b|\bshould not\b|\bconsider\b|\bideally\b/i, "the contract says must, not should");
});

test("docs/motion.md holds the exit pairing, the house values, the curve rule and the reduced-motion rule", () => {
  const doc = read("docs/motion.md");
  assert.match(doc, /an exit is one step shorter than its enter/i);
  assert.match(doc, /fast enter \(`dur\.fast`, 120 ms\) exits with `dur\.fast`/);
  assert.match(doc, /base enter \(`dur\.base`, 200 ms\) exits with `dur\.fast`/);
  assert.match(doc, /slow enter \(`dur\.slow`, 250 ms\) exits with `dur\.base`/);
  assert.match(doc, /modal enter \(`dur\.modal`, 400 ms\) exits with `dur\.slow`/);
  assert.match(doc, /press 0\.98 and fast 120 are the house values/i);
  assert.match(doc, /ease-out for every enter, exit and state change/i);
  assert.match(doc, /loops use `linear`/i);
  assert.match(doc, /springs are for things with weight/i);
  assert.match(doc, /opacity cross-fade/);
  assert.match(doc, /no-preference/);
  // the old name appears only in the rename table, never as a token to use
  assert.doesNotMatch(doc.slice(0, doc.indexOf("## Removed in 0.9.0")), /`dur\.long`|--dur-long/);
});
