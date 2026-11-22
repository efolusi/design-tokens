// Warm glass (DT07, DT09, DT10, DT11): the owner's choice of 2026-11-22, "halus", glass.strength .33.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, resolver, valueIn, evaluate, buildCss, buildSwift } from "../scripts/build.mjs";
import { checkContrast } from "../scripts/check-contrast.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = load();
const resolve = resolver(src.tokens);
const byKey = new Map(src.tokens.map((t) => [t.path.join("."), t]));
const value = (key, mode = null) => resolve(valueIn(byKey.get(key), mode), mode);
const number = (key, mode = null) => evaluate(value(key, mode));
const withStrength = (s) => ({ ...src, tokens: src.tokens.map((t) => (t.path.join(".") === "glass.strength" ? { ...t, value: String(s) } : t)) });

test("DT09: the warm palette, light and dark", () => {
  const expect = {
    "accent": ["#B8491D", "#F2A36B"],
    "accent.hover": ["#A1401A", "#F6BB8F"],
    "surface.page": ["#FCFBF9", "#1C1814"],
    "surface.card": ["#FFFFFF", "#26201B"],
    "surface.sunken": ["#F6F4EF", "#2F2822"],
    "surface.brand": ["#F7E6D6", "#3A2418"],
    "text.on-brand": ["#1E1A14", "#F7E6D6"],
    "text.secondary": ["#5A5042", "#CFC6B7"],
    "text.link": ["#A1401A", "#F2A36B"],
    "focus.ring-color": ["#A1401A", "#F2A36B"],
    "border.default": ["#EDE9E1", "#3A322A"],
    "field.0": ["#FCFBF9", "#1C1814"],
    "field.1": ["#F7E6D6", "#3A2418"],
    "field.2": ["#F2DCC4", "#44291B"],
    "field.3": ["#EDE6DA", "#2F2822"],
  };
  for (const [key, [light, dark]] of Object.entries(expect)) {
    const k = key === "accent" ? "accent._" : key;
    assert.equal(value(k), light, `${key} light`);
    assert.equal(value(k, "dark"), dark, `${key} dark`);
  }
});

test("DT09: cocoa stays only as the ink of marks and wordmark", () => {
  assert.equal(value("cocoa.950"), "#2C1709");
  for (const key of ["accent._", "surface.brand", "text.on-brand", "text.link", "focus.ring-color"]) {
    assert.doesNotMatch(byKey.get(key).value, /brand\.(9|8)\d0|cocoa/, `${key} must not use cocoa`);
  }
});

test("DT09: radius, display type and elevation", () => {
  assert.deepEqual(["sm", "md", "lg", "xl"].map((k) => value(`radius.${k}`)), ["10px", "16px", "22px", "28px"]);
  assert.equal(value("weight.display"), "560");
  assert.equal(value("tracking.display"), "-0.025em");
  assert.equal(value("motion.lift"), "1.012");
  assert.equal(value("motion.press"), "0.98");
  assert.match(value("shadow.md", "dark"), /^0 0 0 1px #3A322A/, "dark elevation is a ring plus a shadow");
});

test("DT10: material values follow glass.strength at .33 (halus)", () => {
  const close = (a, b, key) => assert.ok(Math.abs(a - b) < 0.0005, `${key}: ${a} != ${b}`);
  close(number("glass.strength"), 0.33, "strength");
  close(number("material.clear"), 0.8086, "clear");
  close(number("material.regular"), 0.8218, "regular");
  close(number("material.chrome"), 0.9406, "chrome");
  close(number("material.thick"), 0.9406, "thick light");
  close(number("material.thick", "dark"), 0.9472, "thick dark");
  close(number("material.blur"), 17.28, "blur");
  close(number("material.saturate"), 1.264, "saturate");
  close(number("material.edge"), 0.396, "edge light");
  close(number("material.edge", "dark"), 0.0739, "edge dark");
});

test("DT10: one number moves every material value (.5, sedang)", async () => {
  const half = withStrength(0.5);
  const r = resolver(half.tokens);
  const map = new Map(half.tokens.map((t) => [t.path.join("."), t]));
  const n = (key, mode = null) => evaluate(r(valueIn(map.get(key), mode), mode));
  assert.equal(n("material.clear"), 0.71);
  assert.equal(n("material.regular"), 0.73);
  assert.equal(n("material.chrome"), 0.91);
  assert.equal(n("material.thick"), 0.92, "the light floor holds");
  assert.equal(n("material.thick", "dark"), 0.94, "the dark floor holds");
  assert.equal(n("material.blur"), 20);
});

test("DT10: CSS keeps the derivation live", () => {
  const css = readFileSync(join(ROOT, "tokens/web/effects.css"), "utf8");
  assert.match(css, /--glass-strength: 0\.33;/);
  assert.match(css, /--material-clear: calc\(1 - var\(--glass-strength\) \* 0\.58\);/);
  assert.match(css, /--material-thick: max\(0\.92, calc\(1 - var\(--glass-strength\) \* 0\.18\)\);/);
});

test("DT10: fallbacks turn every material solid", () => {
  const css = readFileSync(join(ROOT, "tokens/web/effects.css"), "utf8");
  const block = (head) => {
    const at = css.indexOf(head);
    assert.ok(at >= 0, `missing ${head}`);
    return css.slice(at, css.indexOf("\n}\n", at));
  };
  for (const head of ["@media (prefers-reduced-transparency: reduce) {", "@media (prefers-contrast: more) {", "@supports not (backdrop-filter: blur(1px)) {"]) {
    const b = block(head);
    for (const name of ["clear", "regular", "chrome", "thick"]) assert.match(b, new RegExp(`--material-${name}: 1;`), `${head} ${name}`);
    assert.match(b, /--material-sheen: 0;/, `${head} sheen`);
  }
  const dark = css.indexOf('[data-theme="dark"] {'), reduced = css.indexOf("@media (prefers-reduced-transparency: reduce) {");
  assert.ok(dark >= 0 && dark < reduced, "the fallbacks come after dark, so they win over the dark thick value");
});

test("DT10: native output carries the strength and the material", () => {
  const swift = buildSwift(src);
  assert.match(swift, /static let glassStrength: Double = 0\.33\b/);
  assert.match(swift, /static let materialThick: Double = 0\.9406\b/);
  assert.match(swift, /static let materialThickDark: Double = 0\.9472\b/);
  assert.match(swift, /static let materialBlur: Double = 17\.28\b/);
  assert.match(swift, /static let materialTint = ColorPair\(light: RGBA\(1\.0, 0\.9922, 0\.9765, 1\.0\), dark: RGBA\(0\.149, 0\.1255, 0\.1059, 1\.0\)\)/);
});

test("DT10: JS numbers are evaluated", async () => {
  const { tokens, modes } = await import("../tokens/web/tokens.js");
  assert.equal(tokens["material-chrome"], 0.9406);
  assert.equal(modes.dark["material-thick"], 0.9472);
  assert.equal(tokens["material-blur"], "17.28px");
});

test("evaluate: arithmetic only, never code", () => {
  assert.equal(evaluate("calc(1 - 0.33 * 0.58)"), 0.8086);
  assert.equal(evaluate("max(0.92, calc(1 - 0.5 * 0.18))"), 0.92);
  assert.equal(evaluate("calc(12px + 16px * 0.33)"), 17.28);
  assert.equal(evaluate("calc(0.75 * min(1, 0.33 * 1.6))"), 0.396);
  for (const bad of ["process.exit(1)", "1; alert(1)", "calc(1 + )", "constructor"]) assert.throws(() => evaluate(bad), bad);
});

test("DT07: aliases are redeclared where their target changes, so a dark subtree is dark", () => {
  const css = buildCss(src);
  const dark = css.match(/^\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/m)[1];
  assert.match(dark, /--status-success-bg: var\(--success-100\);/);
  assert.match(dark, /--surface-panel: var\(--surface-card\);/);
  const plain = css.match(/^:root, \[data-theme="light"\] \{\n([\s\S]*?)\n\}/m)[1];
  assert.match(plain, /--status-success-bg: var\(--success-100\);/);
});

test("DT11: the contrast gate passes on the tokens and catches a weak pair", () => {
  assert.deepEqual(checkContrast(src).failures, []);
  const weak = { ...src, tokens: src.tokens.map((t) => (t.path.join(".") === "text.secondary" ? { ...t, value: "#B4AB97" } : t)) };
  const { failures } = checkContrast(weak);
  assert.ok(failures.length > 0, "a light grey secondary text must fail");
  assert.ok(failures.every((f) => f.ratio < f.need));
});

test("DT11: the sheet ghost-text limit holds at the floor", () => {
  const { ghosts } = checkContrast(src);
  assert.ok(ghosts.length >= 2);
  for (const g of ghosts) assert.ok(g.ratio <= 1.25, `${g.where}: ${g.ratio}`);
});

test("DT10: the fallbacks also reach a nested dark subtree", () => {
  const css = readFileSync(join(ROOT, "tokens/web/effects.css"), "utf8");
  for (const head of ["@media (prefers-reduced-transparency: reduce) {", "@supports not (backdrop-filter: blur(1px)) {"]) {
    const at = css.indexOf(head);
    assert.match(css.slice(at, at + 140), /\n  :root, \[data-theme="light"\], \[data-theme="dark"\] \{/, `${head} must also select [data-theme="dark"]`);
  }
});

test("DT11: glass is checked over any content, black and white included, for muted and status text too", () => {
  const { rows } = checkContrast(src);
  for (const theme of ["light", "dark"]) {
    for (const backdrop of ["black content", "white content"]) {
      for (const what of ["Bar text on chrome glass", "Muted text on chrome glass", "Status text on chrome glass", "Sheet secondary text on thick glass"]) {
        assert.ok(rows.some((r) => r.theme === theme && r.what.startsWith(what) && r.against.endsWith(backdrop)), `${theme}: ${what} over ${backdrop}`);
      }
    }
  }
});

test("a nested light subtree inside a dark page gets the light values back", () => {
  const css = buildCss(src);
  assert.match(css, /^:root, \[data-theme="light"\] \{\n  color-scheme: light;/m);
  for (const head of ["@media (prefers-reduced-transparency: reduce) {", "@supports not (backdrop-filter: blur(1px)) {", "@media (prefers-contrast: more) {"]) {
    const at = css.indexOf(head);
    assert.match(css.slice(at, at + 140), /\n  :root, \[data-theme="light"\](, \[data-theme="dark"\])? \{/, `${head} must also select [data-theme="light"]`);
  }
});

test("DT12: form-control edges keep 3:1 on every surface, the lifted dark sunken included", () => {
  const { rows } = checkContrast(src);
  const edges = rows.filter((r) => r.what === "Form control edge");
  assert.equal(edges.length, 6);
  for (const r of edges) assert.ok(r.pass, `${r.theme} border.control on ${r.against}: ${r.ratio}`);
});

test("DT13: no coloured glow token: glass and filled controls carry contact shadows only", () => {
  assert.equal(byKey.get("material.glow"), undefined, "material.glow is removed, with no alias");
  const css = readFileSync(join(ROOT, "tokens/web/effects.css"), "utf8");
  assert.doesNotMatch(css, /--material-glow/);
  assert.doesNotMatch(buildSwift(src), /materialGlow/);
});
