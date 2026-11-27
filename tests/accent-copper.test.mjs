// DT15: the interface accent is the owl's copper (#CD8F69), one hue in both themes. The ember ramp is gone, with no alias.
// The accent as a shape needs accent.edge (3:1); the accent as text is text.link (4.5:1). Plan: Meridian accent copper plan, 2026-11-27.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, resolver, valueIn, parseColor, buildCss, buildSwift } from "../scripts/build.mjs";
import { checkContrast } from "../scripts/check-contrast.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = load();
const resolve = resolver(src.tokens);
const byKey = new Map(src.tokens.map((t) => [t.path.join("."), t]));
const value = (key, mode = null) => resolve(valueIn(byKey.get(key), mode), mode);
const read = (file) => readFileSync(join(ROOT, file), "utf8");

test("DT15: copper 300 to 600, the owl's copper at 500", () => {
  assert.deepEqual(["300", "400", "500", "600"].map((s) => value(`copper.${s}`)), ["#E7B496", "#DBA582", "#CD8F69", "#BD805A"]);
});

test("DT15: the 15 changed tokens, light then dark (22 values moved, the rest are pinned too)", () => {
  // [token, light, dark]
  const table = [
    ["accent._", "#CD8F69", "#CD8F69"],
    ["accent.hover", "#DBA582", "#DBA582"],
    ["accent.active", "#BD805A", "#BD805A"],
    ["accent.subtle", "#F4E9D2", "#3A2418"],
    ["accent.subtle-border", "#EFCFAC", "#5A3622"],
    ["accent.contrast", "#1E1A14", "#1E1A14"],
    ["accent.subtle-fg", "#5C3A1F", "#EFCFAC"],
    ["text.link", "#7A4E2B", "#DBA582"],
    ["text.link-hover", "#5C3A1F", "#E7B496"],
    ["focus.ring-color", "#7A4E2B", "#DBA582"],
    ["surface.brand", "#F4E9D2", "#3A2418"],
    ["surface.brand-hover", "#EFCFAC", "#44291B"],
    ["field.1", "#F4E9D2", "#3A2418"],
    ["field.2", "#EFCFAC", "#44291B"],
    ["text.on-brand", "#1E1A14", "#F4E9D2"],
  ];
  for (const [key, light, dark] of table) {
    assert.equal(value(key), light, `${key} light`);
    assert.equal(value(key, "dark"), dark, `${key} dark`);
  }
});

test("DT15: the band tokens follow their aliases", () => {
  assert.equal(value("tone.band.fill"), "#F4E9D2");
  assert.equal(value("tone.band.on-fill", "dark"), "#F4E9D2");
});

test("DT15: accent.edge is brand.600 in light and the fill itself in dark, so a dark edge is invisible and moves no layout", () => {
  assert.equal(byKey.get("accent.edge").value, "{brand.600}");
  assert.equal(value("accent.edge"), "#A0693C");
  assert.equal(value("accent.edge", "dark"), value("accent._", "dark"));
  assert.notEqual(value("accent.edge"), value("accent._"), "in light the edge is not the fill");
});

test("DT15: the ember ramp is removed with no alias, from the source and from every output", () => {
  assert.equal([...byKey.keys()].filter((k) => k.startsWith("ember")).length, 0);
  assert.doesNotMatch(JSON.stringify(src.tokens), /ember/i);
  for (const file of ["tokens/web/tokens.css", "tokens/web/colors.css", "tokens/web/tokens.js", "tokens/native/GlamorTokens.swift"]) {
    assert.doesNotMatch(read(file), /ember/i, `${file} still names ember`);
  }
});

test("DT15: copper and accent.edge reach CSS, JS and Swift", () => {
  const css = buildCss(src), swift = buildSwift(src);
  for (const [n, hex] of [["300", "#E7B496"], ["400", "#DBA582"], ["500", "#CD8F69"], ["600", "#BD805A"]]) {
    assert.match(css, new RegExp(`--copper-${n}: ${hex};`), `css copper-${n}`);
    assert.match(swift, new RegExp(`static let copper${n} = `), `swift copper${n}`);
  }
  assert.match(css, /--accent-edge: var\(--brand-600\);/);
  assert.match(css, /--accent-edge: var\(--copper-500\);/, "dark");
  assert.match(swift, /static let accentEdge = ColorPair\(/);
  const js = read("tokens/web/tokens.js");
  assert.match(js, /"accent-edge": "#A0693C"/);
  assert.match(js, /"copper-500": "#CD8F69"/);
});

test("DT15: the accent fill is one hue in both themes: accent, hover and pressed are the same in light and dark", () => {
  for (const key of ["accent._", "accent.hover", "accent.active"]) assert.equal(value(key), value(key, "dark"), key);
});

test("DT15: the gate carries the accent-edge pairs on page, card, sunken, track and border, in light and dark", () => {
  const { rows, failures } = checkContrast(src);
  assert.deepEqual(failures, []);
  for (const theme of ["light", "dark"]) {
    for (const against of ["page", "card", "sunken", "track", "border"]) {
      const row = rows.find((r) => r.theme === theme && r.what.startsWith("Accent shape or icon") && r.against === against);
      assert.ok(row, `${theme}: accent.edge on ${against} is not in the gate`);
      assert.equal(row.need, 3);
      assert.ok(row.pass, `${theme}: accent.edge on ${against}: ${row.ratio}`);
    }
  }
});

test("DT15: the gate fails when the edge falls back to the copper fill in light (2.72:1 on a card)", () => {
  const weak = { ...src, tokens: src.tokens.map((t) => (t.path.join(".") === "accent.edge" ? { ...t, value: "{copper.500}" } : t)) };
  const { failures } = checkContrast(weak);
  const edge = failures.filter((f) => f.what.startsWith("Accent shape or icon"));
  assert.equal(edge.length, 5, "page, card, sunken, track, border all fail in light");
  assert.ok(edge.every((f) => f.theme === "light" && f.ratio < 3));
});

test("DT15: the old accent-as-text pair is gone and the link carries the text role at 4.5", () => {
  const { rows } = checkContrast(src);
  const links = rows.filter((r) => r.what === "Link");
  assert.equal(links.length, 6, "link on page, card, sunken, in light and dark");
  for (const r of links) assert.ok(r.need === 4.5 && r.pass, `${r.theme} link on ${r.against}: ${r.ratio}`);
});

test("DT15: cocoa stays out of the accent tokens that read the brand ramp (no brand.900 or brand.950)", () => {
  for (const key of ["accent.subtle-fg", "text.link", "text.link-hover", "focus.ring-color", "surface.brand", "accent.subtle"]) {
    const t = byKey.get(key);
    const dark = t.modes?.dark ?? "";
    assert.doesNotMatch(`${t.value} ${dark}`, /brand\.9\d0|cocoa/, `${key} must not use cocoa`);
  }
});
