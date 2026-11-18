import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, OUTPUTS, cssFile, buildCss, cssName, swiftName, resolver, valueIn, parseColor, swiftKind, buildSwift } from "../scripts/build.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = load();

test("committed exports match tokens.json", () => {
  for (const [file, build] of Object.entries(OUTPUTS)) {
    assert.equal(readFileSync(join(ROOT, file), "utf8"), build(src), `${file} is stale: run npm run build`);
  }
});

test("every alias resolves in every mode", () => {
  const resolve = resolver(src.tokens);
  for (const t of src.tokens) {
    for (const mode of [null, ...Object.keys(src.modeDefs)]) {
      assert.doesNotMatch(resolve(valueIn(t, mode), mode), /\{/, t.path.join("."));
    }
  }
});

test("modes used by tokens are declared at the root", () => {
  for (const t of src.tokens) {
    for (const mode of Object.keys(t.modes)) assert.ok(mode in src.modeDefs, `${t.path.join(".")}: ${mode}`);
  }
});

test("every color parses", () => {
  const resolve = resolver(src.tokens);
  for (const t of src.tokens.filter((t) => t.type === "color")) {
    for (const mode of [null, ...Object.keys(src.modeDefs)]) assert.doesNotThrow(() => parseColor(resolve(valueIn(t, mode), mode)), t.path.join("."));
  }
});

test("names are unique on every platform", () => {
  for (const name of [cssName, swiftName]) {
    const seen = new Map();
    for (const t of src.tokens) {
      const n = name(t.path);
      assert.ok(!seen.has(n), `${n}: ${seen.get(n)} and ${t.path.join(".")}`);
      seen.set(n, t.path.join("."));
    }
  }
});

test("every token has a Swift mapping or is web-only on purpose", () => {
  for (const t of src.tokens) assert.doesNotThrow(() => swiftKind(t), t.path.join("."));
});

test("names follow the agreed pattern", () => {
  assert.equal(cssName(["accent", "_"]), "accent");
  assert.equal(cssName(["control", "h-sm"]), "control-h-sm");
  assert.equal(swiftName(["control", "h-sm"]), "controlHSm");
  assert.equal(swiftName(["sand", "25"]), "sand25");
  assert.equal(swiftName(["text", "on-brand-muted"]), "textOnBrandMuted");
});

test("Swift values are converted", () => {
  const swift = buildSwift(src);
  assert.match(swift, /static let textPrimary = ColorPair\(light: RGBA\(0\.1176, 0\.102, 0\.0784, 1\.0\)/);
  assert.match(swift, /static let space4: Double = 16\.0/);
  assert.match(swift, /static let durFast: Double = 0\.1\b/);
  assert.doesNotMatch(swift, /import SwiftUI|fontSans|shadowMd/);
});

const swiftc = spawnSync("swiftc", ["--version"]).status === 0;
test("GlamorTokens.swift type-checks", { skip: !swiftc && !process.env.REQUIRE_SWIFTC && "swiftc not installed" }, () => {
  execFileSync("swiftc", ["-typecheck", join(ROOT, "tokens/native/GlamorTokens.swift")], { stdio: "pipe" });
});

test("the four CSS files hold every token once, same names as Meridian's split", () => {
  const n = (f) => (readFileSync(join(ROOT, "tokens/web", f), "utf8").match(/^\s*--[\w-]+:/gm) ?? []).length;
  const all = n("tokens.css");
  assert.equal(n("colors.css") + n("typography.css") + n("spacing.css") + n("effects.css"), all);
  assert.equal(cssFile({ path: ["text", "primary"], type: "color" }), "colors");
  assert.equal(cssFile({ path: ["text", "xs"], type: "dimension" }), "typography");
});

test("size groups: control xs, icon, avatar and sidebar", () => {
  const css = (f) => readFileSync(join(ROOT, "tokens/web", f), "utf8");
  const spacing = css("spacing.css");
  const values = {
    "control-h-xs": "24px",
    "icon-xs": "8px", "icon-sm": "12px", "icon-md": "16px", "icon-lg": "20px", "icon-xl": "24px", "icon-2xl": "32px",
    "avatar-sm": "24px", "avatar-md": "32px", "avatar-lg": "40px",
    "sidebar-width": "256px", "sidebar-width-icon": "48px",
  };
  for (const [name, value] of Object.entries(values)) assert.match(spacing, new RegExp(`--${name}: ${value};`), name);
  // control-h-xs follows the other control heights in compact and coarse modes
  assert.match(spacing, /\[data-density="compact"\] \{[^}]*--control-h-xs: 20px;/);
  assert.match(spacing, /--control-h-xs: var\(--tap-min\);/);
  // avatar sizes sit with the sizes; avatar colours stay with the colours
  assert.equal(cssFile({ path: ["avatar", "md"], type: "dimension" }), "spacing");
  assert.equal(cssFile({ path: ["avatar", "bg"], type: "color" }), "colors");
  assert.equal(cssFile({ path: ["icon", "md"], type: "dimension" }), "spacing");
  assert.equal(cssFile({ path: ["sidebar", "width"], type: "dimension" }), "spacing");
  assert.doesNotMatch(css("colors.css"), /--avatar-(sm|md|lg):/);
  const swift = buildSwift(src);
  for (const name of ["controlHXs", "iconXs", "icon2xl", "avatarMd", "sidebarWidthIcon"]) assert.match(swift, new RegExp(`static let ${name}: Double = `), name);
});

test("CSS keeps Meridian's theme behaviour", () => {
  const css = readFileSync(join(ROOT, "tokens/web/colors.css"), "utf8");
  assert.match(css, /^:root \{\n  color-scheme: light;/m);
  const dark = css.match(/^\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/m)[1];
  const os = css.match(/@media \(prefers-color-scheme:dark\) \{\n  :root:not\(:where\(\[data-theme="light"\]\)\) \{\n([\s\S]*?)\n  \}/)[1];
  assert.equal(os.replace(/^  /gm, ""), dark, "OS-follow block must equal the dark block");
  assert.match(dark, /color-scheme: dark;/);
  assert.match(css, /\[data-theme="dark"\] ::selection \{/);
  assert.match(css, /:root:not\(:where\(\[data-theme="light"\]\)\) ::selection \{/);
  const spacing = readFileSync(join(ROOT, "tokens/web/spacing.css"), "utf8");
  assert.match(spacing, /@media \(pointer: coarse\) \{\n  :root, \[data-density="compact"\] \{/);
  assert.doesNotMatch(spacing, /color-scheme|::selection/);
});

test("aliases in mode rules name tokens", () => {
  const resolve = resolver(src.tokens);
  for (const def of Object.values(src.modeDefs)) {
    for (const props of Object.values(def.rules ?? {})) {
      for (const v of Object.values(props)) assert.doesNotThrow(() => resolve(v, null), v);
    }
  }
});

test("increased contrast: CSS order and Swift fallback", () => {
  const fixture = {
    ...src,
    tokens: [{ path: ["border", "default"], type: "color", value: "#DDDDDD", modes: { dark: "#333333", increased: "#888888", "increased-dark": "#AAAAAA" } }],
  };
  const css = buildCss(fixture);
  const at = (s) => css.indexOf(s);
  assert.ok(at("[data-theme=\"dark\"] {") < at("@media (prefers-contrast: more) {\n  :root"), "dark before increased");
  assert.ok(at("@media (prefers-contrast: more) {\n  :root") < at("@media (prefers-contrast: more) {\n  [data-theme=\"dark\"]"), "increased before increased-dark");
  const swift = buildSwift(fixture);
  assert.match(swift, /increasedLight: RGBA\(0\.5333, 0\.5333, 0\.5333, 1\.0\), increasedDark: RGBA\(0\.6667/);
  const plain = buildSwift({ ...src, tokens: [{ ...fixture.tokens[0], modes: { dark: "#333333", increased: "#888888" } }] });
  assert.match(plain, /increasedDark: RGBA\(0\.2, 0\.2, 0\.2, 1\.0\)/, "increased-dark falls back to dark");
});

test("a token with an increased value also has an increased-dark or dark value", () => {
  for (const t of src.tokens) {
    if ("increased" in t.modes) assert.ok("increased-dark" in t.modes, `${t.path.join(".")}: add increased-dark so dark screens do not get the light value`);
  }
});

test("an alias without its own dark value follows its target's dark value", () => {
  const swift = buildSwift(src);
  const pair = (n) => swift.match(new RegExp(`static let ${n} = (ColorPair\\(.*\\))`))[1];
  assert.equal(pair("surfacePanel"), pair("surfaceCard"));
  assert.equal(pair("avatarFg"), pair("textSecondary"));
});

test("JS increased-dark aliases follow the dark value of their target", async () => {
  const { modes } = await import("../tokens/web/tokens.js");
  assert.equal(modes["increased-dark"]["border-default"], modes.dark["border-control"]);
});

test("JS modes include aliases whose target changes, and numbers are numbers", async () => {
  const { tokens, modes } = await import("../tokens/web/tokens.js");
  assert.equal(modes.dark["state-pressed"], modes.dark["border-default"]);
  assert.equal(modes["increased-dark"]["border-default"], "#786E59");
  assert.equal(typeof tokens["opacity-tint"], "number");
  assert.equal(typeof tokens["z-modal"], "number");
  assert.equal(typeof tokens["space-4"], "string");
});
