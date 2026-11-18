import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { load, OUTPUTS, cssName, swiftName, resolver, valueIn, parseColor, swiftKind, buildSwift } from "../scripts/build.mjs";

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
    for (const mode of [null, ...Object.keys(src.selectors)]) {
      assert.doesNotMatch(resolve(valueIn(t, mode), mode), /\{/, t.path.join("."));
    }
  }
});

test("modes used by tokens are declared at the root", () => {
  for (const t of src.tokens) {
    for (const mode of Object.keys(t.modes)) assert.ok(mode in src.selectors, `${t.path.join(".")}: ${mode}`);
  }
});

test("every color parses", () => {
  const resolve = resolver(src.tokens);
  for (const t of src.tokens.filter((t) => t.type === "color")) {
    for (const mode of [null, "dark"]) assert.doesNotThrow(() => parseColor(resolve(valueIn(t, mode), mode)), t.path.join("."));
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
test("GlamorTokens.swift type-checks", { skip: !swiftc && "swiftc not installed" }, () => {
  execFileSync("swiftc", ["-typecheck", join(ROOT, "tokens/native/GlamorTokens.swift")], { stdio: "pipe" });
});
