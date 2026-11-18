// Build the platform exports from tokens.json.
//   tokens/web/tokens.css             CSS custom properties, same names as Meridian
//   tokens/web/tokens.js              ES module of resolved values per mode
//   tokens/native/GlamorTokens.swift  values only, no SwiftUI import
// Usage: node scripts/build.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const EXT = "com.efolusi.meridian";

export function load(path = join(ROOT, "tokens.json")) {
  const doc = JSON.parse(readFileSync(path, "utf8"));
  const ext = doc.$extensions?.[EXT] ?? {};
  const modeDefs = ext.modes ?? {};
  const base = ext.base ?? {};
  const tokens = [];
  const walk = (node, path) => {
    for (const [key, val] of Object.entries(node)) {
      if (key.startsWith("$")) continue;
      if ("$value" in val) {
        tokens.push({
          path: [...path, key],
          type: val.$type,
          value: val.$value,
          modes: val.$extensions?.[EXT]?.modes ?? {},
        });
      } else walk(val, [...path, key]);
    }
  };
  walk(doc, []);
  return { base, modeDefs, tokens };
}

// "text.primary" -> "text-primary"; "accent._" -> "accent"
export const cssName = (path) => (path.at(-1) === "_" ? path.slice(0, -1) : path).join("-");

// "control.h-sm" -> "controlHSm"; "sand.25" -> "sand25"; "accent._" -> "accent"
export function swiftName(path) {
  const parts = cssName(path).split("-");
  return parts.map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1))).join("");
}

const ALIAS = /\{([\w.-]+)\}/g;

// `mode` is one mode or a fallback list such as ["increased-dark", "dark"]; the first one the token has wins.
export const valueIn = (t, mode) => {
  const m = [mode ?? []].flat().find((x) => x in t.modes);
  return m ? t.modes[m] : t.value;
};

// Replace every {group.leaf} with the target's value in the same mode.
export function resolver(tokens) {
  const byKey = new Map(tokens.map((t) => [t.path.join("."), t]));
  const resolve = (value, mode, seen = []) =>
    String(value).replace(ALIAS, (_, key) => {
      const t = byKey.get(key);
      if (!t) throw new Error(`alias {${key}} does not name a token`);
      if (seen.includes(key)) throw new Error(`alias loop: ${[...seen, key].join(" -> ")}`);
      return resolve(valueIn(t, mode), mode, [...seen, key]);
    });
  return resolve;
}

const cssValue = (v) => String(v).replace(ALIAS, (_, key) => `var(--${cssName(key.split("."))})`);

// Meridian's file split: tokens/{colors,typography,spacing,effects}.css.
const FILE_OF = {
  typography: ["font", "leading", "tracking", "weight"],
  spacing: ["container", "control", "radius", "space", "table", "tap"],
  effects: ["dur", "ease", "opacity", "shadow", "z"],
};
export function cssFile(t) {
  if (t.path[0] === "text") return t.type === "color" ? "colors" : "typography";
  for (const [file, groups] of Object.entries(FILE_OF)) if (groups.includes(t.path[0])) return file;
  return "colors";
}
const part = (file) => (src) =>
  buildCss({ ...src, tokens: src.tokens.filter((t) => cssFile(t) === file) }, { extras: file === "colors" });

// Mode blocks come from root $extensions: each block is a selector, optionally inside @media.
// `declarations` (color-scheme) and `rules` (::selection) are not tokens; only files with colors get them.
export function buildCss({ base, modeDefs, tokens }, { extras = true } = {}) {
  const lines = (list, pick, decls) => [
    ...(extras ? Object.entries(decls ?? {}).map(([k, v]) => `${k}: ${v};`) : []),
    ...list.map((t) => `--${cssName(t.path)}: ${cssValue(pick(t))};`),
  ];
  const rule = (selector, body, pad) =>
    `${pad}${selector} {\n${body.map((l) => `${pad}  ${l}`).join("\n")}\n${pad}}\n`;
  let out = "/* Generated from tokens.json by scripts/build.mjs. Do not edit. */\n";
  out += rule(":root", lines(tokens, (t) => t.value, base.declarations), "");
  for (const [mode, def] of Object.entries(modeDefs)) {
    const list = tokens.filter((t) => mode in t.modes);
    if (!list.length) continue;
    const body = lines(list, (t) => t.modes[mode], def.declarations);
    for (const { media, selector } of def.blocks) {
      const pad = media ? "  " : "";
      let block = rule(selector, body, pad);
      if (extras) {
        for (const [pseudo, props] of Object.entries(def.rules ?? {})) {
          const sel = selector.split(/,\s*/).map((s) => `${s} ${pseudo}`).join(", ");
          block += "\n" + rule(sel, Object.entries(props).map(([k, v]) => `${k}: ${cssValue(v)};`), pad);
        }
      }
      out += media ? `\n@media ${media} {\n${block}}\n` : `\n${block}`;
    }
  }
  return out;
}

export function buildJs({ modeDefs, tokens }) {
  const resolve = resolver(tokens);
  const table = (mode) =>
    Object.fromEntries(
      tokens.filter((t) => !mode || mode in t.modes).map((t) => [cssName(t.path), resolve(valueIn(t, mode), mode)]),
    );
  const modes = Object.fromEntries(Object.keys(modeDefs).map((m) => [m, table(m)]));
  return (
    "// Generated from tokens.json by scripts/build.mjs. Do not edit.\n" +
    "// `tokens` holds base values; `modes.<mode>` holds only the tokens that mode overrides.\n" +
    `export const tokens = ${JSON.stringify(table(null), null, 2)};\n\n` +
    `export const modes = ${JSON.stringify(modes, null, 2)};\n`
  );
}

// ---- Swift ----

export function parseColor(s) {
  let m = s.match(/^#([0-9a-f]{6})$/i);
  if (m) {
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  m = s.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (m) return [+m[1], +m[2], +m[3], +m[4]];
  throw new Error(`unsupported color ${s}`);
}

const num = (x) => {
  const s = String(Math.round(x * 10000) / 10000);
  return s.includes(".") ? s : `${s}.0`;
};
const rgba = (s) => {
  const [r, g, b, a] = parseColor(s);
  return `RGBA(${num(r / 255)}, ${num(g / 255)}, ${num(b / 255)}, ${num(a)})`;
};

// Length in points: "16px" -> 16, "0" -> 0.
export function points(s) {
  const m = String(s).match(/^(-?[\d.]+)(px)?$/);
  if (!m) throw new Error(`not a length: ${s}`);
  return Number(m[1]);
}

// The Swift section for a token, or null when it is web-only.
export function swiftKind(t) {
  if (t.type === "color") return "Color";
  if (t.path[0] === "font" || t.type === "shadow") return null; // CSS font stacks and box-shadows
  if (["leading", "opacity", "weight", "z"].includes(t.path[0])) return "Number";
  if (t.path[0] === "tracking") return "Em";
  if (t.type === "duration") return "Duration";
  if (t.type === "cubicBezier") return "Curve";
  if (t.type === "dimension" || t.path[0] === "tap") return "Length";
  throw new Error(`no Swift mapping for ${t.path.join(".")} (${t.type})`);
}

const DOC = {
  Color: "sRGB components 0...1: light, dark, and increased-contrast light and dark.",
  Length: "Lengths in points (CSS px = pt).",
  Compact: "Lengths in points for compact density. Only the tokens that change.",
  Number: "Unitless: line-height multipliers, opacities, font weights, z-index.",
  Em: "Letter spacing as a fraction of the font size.",
  Duration: "Durations in seconds.",
  Curve: "Cubic Bezier control points (x1, y1, x2, y2).",
};

export function buildSwift({ tokens }) {
  const resolve = resolver(tokens);
  const sections = Object.fromEntries(Object.keys(DOC).map((k) => [k, []]));
  for (const t of tokens) {
    const kind = swiftKind(t);
    if (!kind) continue;
    const name = swiftName(t.path);
    const base = resolve(t.value, null);
    const line = (k, rest) => sections[k].push(`public static let ${name}${rest}`);
    if (kind === "Color") {
      // Fallbacks: increased-dark -> dark -> base, increased -> base. Aliases follow the same chain.
      const pick = (...modes) => rgba(resolve(valueIn(t, modes), modes));
      const light = rgba(base), dark = pick("dark");
      const incLight = pick("increased"), incDark = pick("increased-dark", "dark");
      line("Color", incLight === light && incDark === dark
        ? ` = ColorPair(light: ${light}, dark: ${dark})`
        : ` = ColorPair(light: ${light}, dark: ${dark}, increasedLight: ${incLight}, increasedDark: ${incDark})`);
    } else if (kind === "Length") {
      line("Length", `: Double = ${num(points(base))}`);
      if ("compact" in t.modes) line("Compact", `: Double = ${num(points(resolve(t.modes.compact, "compact")))}`);
    } else if (kind === "Number") {
      line("Number", `: Double = ${num(Number(base))}`);
    } else if (kind === "Em") {
      line("Em", `: Double = ${num(Number(base.replace(/em$/, "")))}`);
    } else if (kind === "Duration") {
      const m = base.match(/^([\d.]+)(ms|s)$/);
      if (!m) throw new Error(`bad duration ${base}`);
      line("Duration", `: Double = ${num(m[2] === "ms" ? m[1] / 1000 : +m[1])}`);
    } else {
      const m = base.match(/^cubic-bezier\(([^)]+)\)$/);
      if (!m) throw new Error(`bad curve ${base}`);
      line("Curve", ` = Bezier(${m[1].split(",").map((x) => num(Number(x))).join(", ")})`);
    }
  }
  const body = Object.entries(sections)
    .map(([k, lines]) => `    /// ${DOC[k]}\n    public enum ${k} {\n${lines.map((l) => `        ${l}`).join("\n")}\n    }`)
    .join("\n\n");
  return `// Generated from tokens.json by scripts/build.mjs. Do not edit.
// Values only: no SwiftUI or UIKit import. Glamor wraps these in Color, Font, and Animation.
// Web-only tokens (font stacks, box-shadows) are not here.

public enum GlamorTokens {
    public struct RGBA: Equatable, Sendable {
        public let red, green, blue, alpha: Double
        public init(_ red: Double, _ green: Double, _ blue: Double, _ alpha: Double) {
            self.red = red; self.green = green; self.blue = blue; self.alpha = alpha
        }
    }

    /// Increased-contrast values default to the normal ones.
    public struct ColorPair: Equatable, Sendable {
        public let light, dark, increasedLight, increasedDark: RGBA
        public init(light: RGBA, dark: RGBA, increasedLight: RGBA? = nil, increasedDark: RGBA? = nil) {
            self.light = light; self.dark = dark
            self.increasedLight = increasedLight ?? light; self.increasedDark = increasedDark ?? dark
        }
    }

    public struct Bezier: Equatable, Sendable {
        public let x1, y1, x2, y2: Double
        public init(_ x1: Double, _ y1: Double, _ x2: Double, _ y2: Double) {
            self.x1 = x1; self.y1 = y1; self.x2 = x2; self.y2 = y2
        }
    }

${body}
}
`;
}

export const OUTPUTS = {
  "tokens/web/tokens.css": buildCss,
  "tokens/web/colors.css": part("colors"),
  "tokens/web/typography.css": part("typography"),
  "tokens/web/spacing.css": part("spacing"),
  "tokens/web/effects.css": part("effects"),
  "tokens/web/tokens.js": buildJs,
  "tokens/native/GlamorTokens.swift": buildSwift,
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const src = load();
  const check = process.argv.includes("--check");
  const stale = [];
  for (const [file, build] of Object.entries(OUTPUTS)) {
    const out = build(src);
    const path = join(ROOT, file);
    if (!check) writeFileSync(path, out);
    else {
      let cur = "";
      try { cur = readFileSync(path, "utf8"); } catch {}
      if (cur !== out) stale.push(file);
    }
  }
  if (stale.length) {
    console.error(`out of date, run npm run build: ${stale.join(", ")}`);
    process.exit(1);
  }
  console.log(check ? "exports up to date" : `built ${Object.keys(OUTPUTS).length} files from ${src.tokens.length} tokens`);
}
