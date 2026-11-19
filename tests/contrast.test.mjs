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
