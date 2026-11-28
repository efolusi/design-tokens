import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, OUTPUTS, resolver, valueIn, swiftKind, parseColor } from "../scripts/build.mjs";
import { checkContrast, ratio } from "../scripts/check-contrast.mjs";

// DT23 (v0.10.0): raised-surface depth. In dark a black shadow cannot show on a near-black page, so depth comes from
// a lighter surface step (surface.elevated) plus a visible edge and a top highlight (shadow.elevated). Light keeps
// today's soft shadow on the card colour.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = load();
const resolve = resolver(src.tokens);
const token = (name) => src.tokens.find((t) => t.path.join(".") === name);
const read = (f) => readFileSync(join(ROOT, f), "utf8");
const MODES = { light: null, dark: ["dark"], increased: ["increased"], "increased-dark": ["increased-dark", "dark"] };
const value = (name, mode) => resolve(valueIn(token(name), MODES[mode]), MODES[mode]);
const rgb = (name, mode) => parseColor(value(name, mode)).slice(0, 3);

const SHADOW = {
  light: "0 1px 2px rgba(46,41,34,.04),0 2px 8px rgba(46,41,34,.05)",
  dark: "0 0 0 1px #453C31,inset 0 1px 0 rgba(255,244,230,.05),0 8px 24px rgba(0,0,0,.45)",
  increased: "0 0 0 1px #948A74,0 1px 2px rgba(46,41,34,.04),0 2px 8px rgba(46,41,34,.05)",
  "increased-dark": "0 0 0 1px #7C725E,inset 0 1px 0 rgba(255,244,230,.05),0 8px 24px rgba(0,0,0,.45)",
};

test("surface.elevated is a colour: the card white in light, a lighter step #2E2721 in dark", () => {
  const t = token("surface.elevated");
  assert.ok(t);
  assert.equal(t.type, "color");
  assert.equal(value("surface.elevated", "light"), "#FFFFFF");
  assert.equal(value("surface.elevated", "light"), value("surface.card", "light"));
  assert.equal(value("surface.elevated", "dark"), "#2E2721");
  // Increase contrast changes the edge, not the surface: no value of its own, so it follows the normal ones.
  assert.equal(value("surface.elevated", "increased"), "#FFFFFF");
  assert.equal(value("surface.elevated", "increased-dark"), "#2E2721");
});

test("in dark, elevated is lighter than the card, which is lighter than the page", () => {
  const L = (n) => ratio(rgb(n, "dark"), [0, 0, 0]);
  assert.ok(L("surface.page") < L("surface.card") && L("surface.card") < L("surface.elevated"));
});

test("shadow.elevated has the exact values in light, dark and both Increase contrast modes", () => {
  const t = token("shadow.elevated");
  assert.ok(t);
  assert.equal(t.type, "shadow");
  for (const [mode, v] of Object.entries(SHADOW)) assert.equal(value("shadow.elevated", mode), v, mode);
  // light is today's shadow.sm
  assert.equal(value("shadow.elevated", "light"), value("shadow.sm", "light"));
});

test("a token with an increased value also has increased-dark (the repo rule)", () => {
  for (const name of ["surface.elevated", "shadow.elevated"]) {
    const t = token(name);
    if ("increased" in t.modes) assert.ok("increased-dark" in t.modes, name);
  }
  assert.ok("increased" in token("shadow.elevated").modes);
});

test("the dark ring is border.strong and the Increase contrast ring is border.control, in each theme", () => {
  assert.ok(value("shadow.elevated", "dark").includes(`1px ${value("border.strong", "dark")},`));
  assert.ok(value("shadow.elevated", "increased").includes(`1px ${value("border.control", "increased")},`));
  assert.ok(value("shadow.elevated", "increased-dark").includes(`1px ${value("border.control", "increased-dark")},`));
});

test("the dark top highlight is a faint inset line, not a border: alpha at most .08, 1px, no spread", () => {
  const m = value("shadow.elevated", "dark").match(/inset 0 1px 0 rgba\((\d+),(\d+),(\d+),([\d.]+)\)/);
  assert.ok(m, "an inset 1px top highlight");
  assert.ok(Number(m[4]) > 0 && Number(m[4]) <= 0.08, `alpha ${m[4]}`);
});

test("dark depth numbers: the card is 1.20:1 over the page and the ring is 1.63:1 over the page", () => {
  const page = rgb("surface.page", "dark");
  assert.equal(ratio(rgb("surface.elevated", "dark"), page).toFixed(2), "1.20");
  assert.equal(ratio(rgb("border.strong", "dark"), page).toFixed(2), "1.63");
  // the old treatment, for the record: a 1.10:1 card and a 1.40:1 ring
  assert.equal(ratio(rgb("surface.card", "dark"), page).toFixed(2), "1.10");
  assert.equal(ratio(rgb("border.default", "dark"), page).toFixed(2), "1.40");
});

test("the Increase contrast ring is a 3:1 edge against the page in both themes", () => {
  for (const mode of ["increased", "increased-dark"]) {
    const ring = parseColor(value("shadow.elevated", mode).match(/0 0 0 1px (#[0-9A-Fa-f]{6})/)[1]).slice(0, 3);
    assert.ok(ratio(ring, rgb("surface.page", mode)) >= 3, mode);
  }
});

test("npm run contrast holds the new pairs and they pass", () => {
  const { rows, failures } = checkContrast(src);
  assert.deepEqual(failures, []);
  const has = (what, theme, against) => rows.some((r) => r.what === what && r.theme === theme && r.against === against);
  for (const theme of ["light", "dark"]) {
    for (const what of ["Primary text", "Secondary text", "Muted text", "Link", "Link, hover", "Form control edge"]) assert.ok(has(what, theme, "elevated"), `${what} ${theme}`);
    assert.ok(has("Focus ring", theme, "elevated"), `Focus ring ${theme}`);
  }
  for (const theme of ["light", "dark", "light, increased", "dark, increased"]) assert.ok(has("Accent shape or icon (accent.edge)", theme, "elevated"), `accent.edge ${theme}`);
  // light has no ring: its depth is the soft shadow, which is not a contrast pair
  for (const theme of ["dark", "light, increased", "dark, increased"]) assert.ok(has("Raised card edge (shadow.elevated ring)", theme, "page"), `ring ${theme}`);
  assert.ok(!has("Raised card edge (shadow.elevated ring)", "light", "page"));
  assert.ok(has("Raised card step (surface.elevated)", "dark", "page"));
});

test("the gate fails a raised card whose dark ring or step is too faint", () => {
  const weak = (name, mode, v) => src.tokens.map((t) => (t.path.join(".") === name ? { ...t, modes: { ...t.modes, [mode]: v } } : t));
  const ring = checkContrast({ ...src, tokens: weak("shadow.elevated", "dark", "0 0 0 1px #3A322A,0 8px 24px rgba(0,0,0,.45)") });
  assert.ok(ring.failures.some((f) => f.what === "Raised card edge (shadow.elevated ring)" && f.theme === "dark"));
  const step = checkContrast({ ...src, tokens: weak("surface.elevated", "dark", "#26201B") });
  assert.ok(step.failures.some((f) => f.what === "Raised card step (surface.elevated)"));
});

test("both are in the CSS: base and dark blocks, and the shadow also in both Increase contrast blocks", () => {
  const colors = read("tokens/web/colors.css");
  const effects = read("tokens/web/effects.css");
  const all = read("tokens/web/tokens.css");
  assert.match(colors, /^  --surface-elevated: var\(--surface-card\);/m);
  assert.equal(colors.match(/--surface-elevated: #2E2721;/g).length, 2, "both dark blocks");
  for (const f of [effects, all]) {
    assert.match(f, new RegExp(`^  --shadow-elevated: ${SHADOW.light.replace(/[.()]/g, "\\$&")};`, "m"));
    assert.equal(f.split(`--shadow-elevated: ${SHADOW.dark};`).length - 1, 2, "both dark blocks");
    assert.ok(f.includes(`--shadow-elevated: ${SHADOW.increased};`));
    assert.equal(f.split(`--shadow-elevated: ${SHADOW["increased-dark"]};`).length - 1, 2, "both increased-dark blocks");
  }
  assert.doesNotMatch(colors, /--shadow-elevated/);
  assert.doesNotMatch(effects, /--surface-elevated/);
});

test("the JS output holds both, resolved per mode", async () => {
  const { tokens, modes } = await import("../tokens/web/tokens.js");
  assert.equal(tokens["surface-elevated"], "#FFFFFF");
  assert.equal(modes.dark["surface-elevated"], "#2E2721");
  assert.equal(tokens["shadow-elevated"], SHADOW.light);
  assert.equal(modes.dark["shadow-elevated"], SHADOW.dark);
  assert.equal(modes.increased["shadow-elevated"], SHADOW.increased);
  assert.equal(modes["increased-dark"]["shadow-elevated"], SHADOW["increased-dark"]);
});

test("Swift holds the colour (light, dark) and not the box-shadow, which is web-only like the other shadows", () => {
  const swift = read("tokens/native/GlamorTokens.swift");
  assert.notEqual(swiftKind(token("surface.elevated")), null);
  assert.equal(swiftKind(token("shadow.elevated")), null);
  assert.match(swift, /static let surfaceElevated = ColorPair\(light: RGBA\(1\.0, 1\.0, 1\.0, 1\.0\), dark: RGBA\(0\.1804, 0\.1529, 0\.1294, 1\.0\)\)/);
  assert.doesNotMatch(swift, /shadowElevated/);
});

test("generated outputs are fresh (rebuild with npm run build)", () => {
  for (const [file, build] of Object.entries(OUTPUTS)) assert.equal(read(file), build(src), file);
});

test("docs say when to use it and the CHANGELOG lists it in v0.10.0 as a MINOR", () => {
  const glass = read("docs/glass.md");
  assert.match(glass, /surface\.elevated/);
  assert.match(glass, /shadow\.elevated/);
  assert.match(glass, /cards in lists keep `surface\.card`/i);
  const log = read("CHANGELOG.md");
  const unreleased = log.slice(log.indexOf("## v0.10.0"), log.indexOf("## v0.9.0"));
  assert.ok(unreleased.length > 0, "a v0.10.0 section above v0.9.0");
  assert.match(unreleased, /Semver level: MINOR\./);
  assert.match(unreleased, /surface\.elevated/);
  assert.match(unreleased, /shadow\.elevated/);
  assert.equal(JSON.parse(read("package.json")).version, "0.10.0", "the package carries the released version");
});
