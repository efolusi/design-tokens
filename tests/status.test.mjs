import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, resolver, valueIn, parseColor } from "../scripts/build.mjs";

// The semantic status layer: five tokens per status, remapped per theme, so a component never reads a
// status ramp stop and a rebrand or a dark theme restyles status UI in one place.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = load();
const resolve = resolver(src.tokens);
const byKey = new Map(src.tokens.map((t) => [t.path.join("."), t]));
const MODES = { light: null, dark: ["dark"], increased: ["increased"], "increased-dark": ["increased-dark", "dark"] };
const STATUSES = ["success", "warning", "danger", "info"];
const PARTS = ["bg", "border", "text", "solid", "on-solid"];

const value = (key, mode) => {
  const t = byKey.get(key);
  assert.ok(t, `${key} is not a token`);
  return resolve(valueIn(t, MODES[mode]), MODES[mode]);
};
const rgb = (key, mode) => parseColor(value(key, mode));
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

test("every status has bg, border, text, solid and on-solid, all colours", () => {
  for (const s of STATUSES) {
    for (const p of PARTS) {
      const t = byKey.get(`status.${s}.${p}`);
      assert.ok(t, `status.${s}.${p} is missing`);
      assert.equal(t.type, "color", `status.${s}.${p}`);
    }
  }
});

test("status text keeps 4.5:1 on its tint, in light, dark and both Increase contrast modes", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    for (const s of STATUSES) {
      const r = ratio(rgb(`status.${s}.text`, mode), rgb(`status.${s}.bg`, mode));
      if (r < 4.5) low.push(`status.${s}.text on bg [${mode}]: ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(low, []);
});

test("status text also keeps 4.5:1 on the card and the page it sits beside", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    for (const s of STATUSES) {
      for (const ground of ["surface.card", "surface.page"]) {
        const r = ratio(rgb(`status.${s}.text`, mode), rgb(ground, mode));
        if (r < 4.5) low.push(`status.${s}.text on ${ground} [${mode}]: ${r.toFixed(2)}`);
      }
    }
  }
  assert.deepEqual(low, []);
});

test("on-solid keeps 4.5:1 on solid, in every mode", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    for (const s of STATUSES) {
      const r = ratio(rgb(`status.${s}.on-solid`, mode), rgb(`status.${s}.solid`, mode));
      if (r < 4.5) low.push(`status.${s}.on-solid on solid [${mode}]: ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(low, []);
});

test("solid and border show against the card at 3:1 (solid) in every mode", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    for (const s of STATUSES) {
      const r = ratio(rgb(`status.${s}.solid`, mode), rgb("surface.card", mode));
      if (r < 3) low.push(`status.${s}.solid on card [${mode}]: ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(low, []);
});

test("dark remaps the tint, the border and the text: nothing keeps the light value", () => {
  for (const s of STATUSES) {
    for (const p of ["bg", "border", "text"]) {
      assert.notEqual(value(`status.${s}.${p}`, "light"), value(`status.${s}.${p}`, "dark"), `status.${s}.${p}`);
    }
  }
});

test("the four statuses are four different colours", () => {
  const solids = new Set(STATUSES.map((s) => value(`status.${s}.solid`, "light")));
  assert.equal(solids.size, STATUSES.length);
});

test("the CSS and the Swift output carry the status layer", () => {
  const css = readFileSync(join(ROOT, "tokens/web/colors.css"), "utf8");
  const swift = readFileSync(join(ROOT, "tokens/native/GlamorTokens.swift"), "utf8");
  for (const s of STATUSES) {
    for (const p of PARTS) {
      assert.match(css, new RegExp(`--status-${s}-${p}:`), `--status-${s}-${p}`);
      const name = `status${s[0].toUpperCase()}${s.slice(1)}${p.split("-").map((x) => x[0].toUpperCase() + x.slice(1)).join("")}`;
      assert.match(swift, new RegExp(`static let ${name} =`), name);
    }
  }
});

test("the brand and sand mappings Meridian's components need exist and resolve in every mode", () => {
  for (const key of ["border.hover", "surface.track", "text.disabled", "surface.brand-hover", "accent.warm", "accent.soft"]) {
    for (const mode of Object.keys(MODES)) assert.match(value(key, mode), /^#|^rgba/, `${key} [${mode}]`);
  }
});

test("brand-mapped text and fills keep their ratios in light and dark", () => {
  const low = [];
  for (const mode of Object.keys(MODES)) {
    const pairs = [
      ["accent.warm", "surface.code", 3],
      ["border.hover", "surface.card", 1.6], ["text.on-brand", "surface.brand-hover", 4.5],
    ];
    for (const [fg, bg, min] of pairs) {
      const r = ratio(rgb(fg, mode), rgb(bg, mode));
      if (r < min) low.push(`${fg} on ${bg} [${mode}]: ${r.toFixed(2)} < ${min}`);
    }
  }
  assert.deepEqual(low, []);
});

test("loop durations: 1.4 s and 1.6 s, durations, in CSS, JS and Swift, with no reduced value", () => {
  const ms = (k) => parseFloat(byKey.get(k).value);
  assert.equal(ms("dur.loop"), 1400);
  assert.equal(ms("dur.loop-slow"), 1600);
  for (const k of ["dur.loop", "dur.loop-slow"]) {
    assert.equal(byKey.get(k).type, "duration", k);
    assert.ok(!("reduced-motion" in byKey.get(k).modes), `${k}: a loop stops under reduced motion, it is not shortened`);
  }
  const css = readFileSync(join(ROOT, "tokens/web/effects.css"), "utf8");
  const swift = readFileSync(join(ROOT, "tokens/native/GlamorTokens.swift"), "utf8");
  assert.match(css, /--dur-loop: 1400ms;/);
  assert.match(css, /--dur-loop-slow: 1600ms;/);
  assert.match(swift, /static let durLoop: Double = 1\.4$/m);
  assert.match(swift, /static let durLoopSlow: Double = 1\.6$/m);
});
