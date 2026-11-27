import { test } from "node:test";
import assert from "node:assert/strict";
import { load, resolver, valueIn, parseColor } from "../scripts/build.mjs";

// Text and status colours keep WCAG AA (4.5:1) on every ground they sit on, in light, dark and both
// Increase contrast modes. Meridian and Glamor both read these tokens, so a palette change that
// breaks a pair fails here before either system re-vendors it.
const src = load();
const resolve = resolver(src.tokens);
const byKey = new Map(src.tokens.map((t) => [t.path.join("."), t]));
const MODES = { light: null, dark: ["dark"], increased: ["increased"], "increased-dark": ["increased-dark", "dark"] };

function rgb(key, mode) {
  const t = byKey.get(key);
  assert.ok(t, `${key} is not a token`);
  return parseColor(resolve(valueIn(t, MODES[mode]), MODES[mode]));
}
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const over = (fg, bg, alpha = fg[3]) => fg.slice(0, 3).map((c, i) => c * alpha + bg[i] * (1 - alpha));
function ratio(fg, bg) {
  const [a, b] = [lum(fg), lum(bg)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const GROUNDS = ["surface.page", "surface.panel", "surface.card", "surface.card-hover", "surface.sunken", "surface.subtle",
  "state.hover-on-card", "state.hover-on-panel", "state.hover-on-tab", "state.hover-on-window", "state.pressed"];

test("text, secondary and muted text keep 4.5:1 on every ground, the pressed fill included", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    for (const ground of GROUNDS) {
      const bg = rgb(ground, mode);
      for (const text of ["text.primary", "text.secondary", "text.muted"]) {
        const r = ratio(over(rgb(text, mode), bg), bg);
        if (r < 4.5) low.push(`${text} on ${ground} [${mode}]: ${r.toFixed(2)}`);
      }
    }
  }
  assert.deepEqual(low, []);
});

test("secondary text keeps 7:1 on every surface in light, as Glamor promises", () => {
  const low = [];
  for (const ground of ["surface.page", "surface.panel", "surface.card", "surface.card-hover", "surface.sunken", "surface.subtle"]) {
    const r = ratio(rgb("text.secondary", "light"), rgb(ground, "light"));
    if (r < 7) low.push(`text.secondary on ${ground}: ${r.toFixed(2)}`);
  }
  assert.deepEqual(low, []);
});

test("status colours keep 4.5:1 as text on the card, the sunken ground and their own tint", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    const card = rgb("surface.card", mode);
    // Pills tint at 10%, and at 16% with Increase contrast (Glamor's G.Opacity.pill and .increased).
    const tint = mode.startsWith("increased") ? 0.16 : 0.1;
    for (const status of ["success.600", "warning.600", "danger.600"]) {
      const fg = rgb(status, mode);
      const pill = over(fg, card, tint);
      for (const [name, bg] of [["surface.card", card], ["surface.sunken", rgb("surface.sunken", mode)], ["its tint", pill]]) {
        const r = ratio(fg, bg);
        if (r < 4.5) low.push(`${status} on ${name} [${mode}]: ${r.toFixed(2)}`);
      }
    }
  }
  assert.deepEqual(low, []);
});

test("every hover fill shows on the ground it is drawn on", () => {
  const faint = [];
  const pairs = [["state.hover-on-card", "surface.card"], ["state.hover-on-panel", "surface.panel"],
    ["state.hover-on-tab", "surface.panel"], ["state.hover-on-window", "surface.page"], ["state.pressed", "state.hover-on-card"]];
  for (const mode of Object.keys(MODES)) {
    for (const [hover, ground] of pairs) {
      const r = ratio(rgb(hover, mode), rgb(ground, mode));
      // With Increase contrast a hover must stand out more, as state.pressed does.
      const min = mode.startsWith("increased") && hover === "state.hover-on-tab" ? 1.15 : 1.04;
      if (r < min) faint.push(`${hover} on ${ground} [${mode}]: ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(faint, []);
});

test("accent, link, focus and status pairs keep their ratios in every mode", () => {
  const low = [];
  const pairs = [
    // [foreground, background, minimum]
    // DT15: the accent is a shape, not text. A copper fill reads as a shape only through accent.edge (3:1, WCAG 1.4.11);
    // the accent as text is text.link (4.5:1).
    ["accent.edge", "surface.page", 3], ["accent.edge", "surface.card", 3], ["accent.edge", "surface.sunken", 3],
    // DT16: the edge has its own Increase contrast values, so the five grounds hold in all four modes. The border ground
    // is the control edge with Increase contrast (#948A74, #7C725E).
    ["accent.edge", "surface.track", 3], ["accent.edge", "border.default", 3],
    ["text.link", "surface.page", 4.5], ["text.link", "surface.card", 4.5], ["text.link", "surface.sunken", 4.5],
    ["accent.contrast", "accent._", 4.5],
    ["accent.subtle-fg", "accent.subtle", 4.5],
    ["focus.ring-color", "surface.page", 3], ["focus.ring-color", "surface.card", 3],
    ...["success.600", "warning.600", "danger.600"].flatMap((s) => [[s, "surface.page", 4.5], [s, "surface.panel", 4.5]]),
  ];
  for (const mode of Object.keys(MODES)) {
    for (const [fg, bg, min] of pairs) {
      const back = rgb(bg, mode);
      const r = ratio(over(rgb(fg, mode), back), back);
      if (r < min) low.push(`${fg} on ${bg} [${mode}]: ${r.toFixed(2)} < ${min}`);
    }
  }
  assert.deepEqual(low, []);
});

test("feature-card tones keep 4.5:1 for their text in every mode", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    for (const tone of ["peach", "band", "amber"]) {
      const r = ratio(rgb(`tone.${tone}.on-fill`, mode), rgb(`tone.${tone}.fill`, mode));
      if (r < 4.5) low.push(`tone.${tone} [${mode}]: ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(low, []);
});
