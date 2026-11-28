// Contrast gate for the warm glass tokens (DT11). Fails when a text or icon pair drops below WCAG AA.
// Glass is composited as alpha * tint + (1 - alpha) * backdrop. Blur only averages the backdrop, so the
// worst case is a large solid area of the brightest or darkest thing that can sit under a surface.
// Usage: node scripts/check-contrast.mjs   (exit 1 on any failure)
import { fileURLToPath } from "node:url";
import { load, resolver, valueIn, evaluate, parseColor } from "./build.mjs";

const lin = (c) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
const luminance = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
export const ratio = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
// alpha * top + (1 - alpha) * bottom, both opaque [r, g, b].
export const mix = (top, bottom, alpha) => top.map((c, i) => Math.round(alpha * c + (1 - alpha) * bottom[i]));

const THEMES = ["light", "dark"];
const TEXT = 4.5, NON_TEXT = 3.0, GHOST_LIMIT = 1.25;
// DT23: depth of a raised card. In dark it comes from a lighter surface step and a visible 1px ring, since a black shadow cannot show
// on a near-black page. Neither is a WCAG text or control pair, so these are the lowest values the design reads as raised at:
// the step is 1.20 and the ring 1.63 against the page. With Increase contrast the ring is a real edge and needs 3:1.
const RAISED_STEP_DARK = 1.15, RAISED_RING_DARK = 1.5;

export function checkContrast(src) {
  const resolve = resolver(src.tokens);
  const byKey = new Map(src.tokens.map((t) => [t.path.join("."), t]));
  const raw = (key, mode) => {
    const t = byKey.get(key);
    if (!t) throw new Error(`check-contrast: no token ${key}`);
    return resolve(valueIn(t, mode), mode);
  };
  const rows = [], ghosts = [];
  for (const theme of THEMES) {
    const mode = theme === "dark" ? "dark" : null;
    const num = (key) => evaluate(`calc(${raw(key, mode)})`);
    // A color with alpha is composited over `under` (the page by default).
    const color = (key, under) => {
      const [r, g, b, a] = parseColor(raw(key, mode));
      return a < 1 ? mix([r, g, b], under ?? color("surface.page"), a) : [r, g, b];
    };
    const add = (what, fg, bg, need, against) => {
      const r = ratio(fg, bg);
      rows.push({ theme, what, against, ratio: Math.round(r * 100) / 100, need, pass: r >= need });
    };
    const tint = color("material.tint");
    const strength = num("field.strength");
    const f0 = color("field.0");
    const field = [0, 1, 2, 3].map((i) => [`field.${i}`, i === 0 ? f0 : mix(color(`field.${i}`), f0, strength)]);
    const under = [...field, ["accent", color("accent._")], ["code block", color("surface.code")], ["card", color("surface.card")], ["band", color("surface.brand")],
      // Content that is not a token (photos, video, a product's own art) can be anything: the extremes.
      ["black content", [0, 0, 0]], ["white content", [255, 255, 255]]];
    const [clear, regular, chrome, thick] = ["clear", "regular", "chrome", "thick"].map((k) => num(`material.${k}`));
    const ink = color("text.primary"), secondary = color("text.secondary"), ring = color("focus.ring-color");

    for (const [name, f] of field) {
      add("Hero title on the field", ink, f, TEXT, name);
      add("Hero lede on the field", secondary, f, TEXT, name);
      add("Card text on a regular surface", secondary, mix(tint, f, regular), TEXT, `regular over ${name}`);
    }
    for (const [name, b] of under) {
      const bar = mix(tint, b, chrome);
      add("Bar text on chrome glass", ink, bar, TEXT, `chrome over ${name}`);
      add("Muted text on chrome glass", color("text.muted"), bar, TEXT, `chrome over ${name}`);
      for (const s of ["success", "warning", "danger", "info"]) add(`Status text on chrome glass, ${s}`, color(`status.${s}.text`), bar, TEXT, `chrome over ${name}`);
      add("Control label on clear glass in a bar", ink, mix(tint, bar, clear), TEXT, `clear in chrome over ${name}`);
      add("Search placeholder on clear glass in a bar", secondary, mix(tint, bar, clear), TEXT, `clear in chrome over ${name}`);
      add("Focus ring on chrome glass", ring, bar, NON_TEXT, `chrome over ${name}`);
      add("Sheet secondary text on thick glass", secondary, mix(tint, b, thick), TEXT, `thick over ${name}`);
    }
    // Solid pairs the palette change touches.
    const page = color("surface.page"), card = color("surface.card"), elevated = color("surface.elevated");
    add("Prominent button label", color("accent.contrast"), color("accent._"), TEXT, "accent");
    add("Prominent button label, hover", color("accent.contrast"), color("accent.hover"), TEXT, "accent.hover");
    add("Prominent button label, pressed", color("accent.contrast"), color("accent.active"), TEXT, "accent.active");
    add("Band text", color("text.on-brand"), color("surface.brand"), TEXT, "surface.brand");
    add("Band muted text", color("text.on-brand-muted", color("surface.brand")), color("surface.brand"), TEXT, "surface.brand");
    add("Code text", color("text.code"), color("surface.code"), TEXT, "surface.code");
    for (const [name, bg] of [["page", page], ["card", card], ["elevated", elevated], ["sunken", color("surface.sunken")]]) {
      add("Primary text", ink, bg, TEXT, name);
      add("Secondary text", secondary, bg, TEXT, name);
      add("Muted text", color("text.muted"), bg, TEXT, name);
      add("Link", color("text.link"), bg, TEXT, name);
      add("Link, hover", color("text.link-hover"), bg, TEXT, name);
      add("Focus ring", ring, bg, NON_TEXT, name);
    }
    add("Tinted label", color("accent.subtle-fg"), color("accent.subtle"), TEXT, "accent.subtle");
    add("Tinted label on a card", color("accent.subtle-fg"), card, TEXT, "card");
    add("Link inside an accent tint", color("text.link"), color("accent.subtle"), TEXT, "accent.subtle");
    add("Body text on a selected row", color("text.primary"), color("accent.subtle"), TEXT, "accent.subtle");
    add("Focus ring on an accent tint", ring, color("accent.subtle"), NON_TEXT, "accent.subtle");
    add("Focus ring on the band", ring, color("surface.brand"), NON_TEXT, "surface.brand");
    // Form-control edges (WCAG 1.4.11): Meridian's inputs draw border.control on every surface.
    for (const [name, bg] of [["page", page], ["card", card], ["elevated", elevated], ["sunken", color("surface.sunken")]]) add("Form control edge", color("border.control"), bg, NON_TEXT, name);
    // Legibility rule: text behind a sheet must not read through it.
    for (const [name, bg] of [["card", card], ["field", f0]]) {
      const r = ratio(mix(tint, ink, thick), mix(tint, bg, thick));
      ghosts.push({ where: `${theme}, text on ${name} behind a sheet`, ratio: Math.round(r * 100) / 100, limit: GHOST_LIMIT });
    }
  }
  // DT15, DT16: the accent fill is one copper in both themes and reads 2.1 to 2.7:1 as a shape on a light surface. As a shape or icon
  // (button edge, checked box, switch, tab underline, progress fill, check mark) it needs accent.edge at 3:1 (WCAG 1.4.11); as text it
  // is text.link at 4.5. The track and the border are the grounds a progress fill and Glamor's ProgressBar sit on. accent.edge has its
  // own Increase contrast values, and with Increase contrast the border ground is the control edge, so all four modes are checked.
  const EDGE_MODES = [["light", null], ["dark", "dark"], ["light, increased", ["increased"]], ["dark, increased", ["increased-dark", "dark"]]];
  const EDGE_GROUNDS = [["page", "surface.page"], ["card", "surface.card"], ["elevated", "surface.elevated"], ["sunken", "surface.sunken"], ["track", "surface.track"], ["border", "border.default"]];
  for (const [theme, mode] of EDGE_MODES) {
    const edge = parseColor(raw("accent.edge", mode)).slice(0, 3);
    for (const [name, key] of EDGE_GROUNDS) {
      const r = ratio(edge, parseColor(raw(key, mode)).slice(0, 3));
      rows.push({ theme, what: "Accent shape or icon (accent.edge)", against: name, ratio: Math.round(r * 100) / 100, need: NON_TEXT, pass: r >= NON_TEXT });
    }
  }
  // DT23: a raised card reads as raised in dark. The lighter step and the ring are measured against the page; with Increase contrast the
  // ring (border.control) is a 3:1 edge in both themes. Light has no ring: its depth is the soft shadow, which is not a contrast pair.
  for (const [theme, mode] of EDGE_MODES) {
    const page = parseColor(raw("surface.page", mode)).slice(0, 3);
    if (theme === "dark") {
      const r = ratio(parseColor(raw("surface.elevated", mode)).slice(0, 3), page);
      rows.push({ theme, what: "Raised card step (surface.elevated)", against: "page", ratio: Math.round(r * 100) / 100, need: RAISED_STEP_DARK, pass: r >= RAISED_STEP_DARK });
    }
    const ring = raw("shadow.elevated", mode).match(/^0 0 0 1px (#[0-9A-Fa-f]{6})/)?.[1];
    if (!ring) { if (theme !== "light") rows.push({ theme, what: "Raised card edge (shadow.elevated ring)", against: "page", ratio: 0, need: 1, pass: false }); continue; }
    const need = theme.includes("increased") ? NON_TEXT : RAISED_RING_DARK;
    const r = ratio(parseColor(ring).slice(0, 3), page);
    rows.push({ theme, what: "Raised card edge (shadow.elevated ring)", against: "page", ratio: Math.round(r * 100) / 100, need, pass: r >= need });
  }
  const failures = [
    ...rows.filter((r) => !r.pass),
    ...ghosts.filter((g) => g.ratio > g.limit).map((g) => ({ theme: "", what: "Ghost text behind a sheet", against: g.where, ratio: g.ratio, need: g.limit })),
  ];
  return { rows, ghosts, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { rows, ghosts, failures } = checkContrast(load());
  const worst = {};
  for (const r of rows) if (!worst[r.theme] || r.ratio / r.need < worst[r.theme].ratio / worst[r.theme].need) worst[r.theme] = r;
  for (const r of Object.values(worst)) console.log(`worst ${r.theme}: ${r.what} against ${r.against}: ${r.ratio} (need ${r.need})`);
  for (const g of ghosts) console.log(`ghost ${g.where}: ${g.ratio} (limit ${g.limit})`);
  if (failures.length) {
    for (const f of failures) console.error(`FAIL ${f.theme} ${f.what} against ${f.against}: ${f.ratio} < ${f.need}`);
    process.exit(1);
  }
  console.log(`contrast: ${rows.length} pairs and ${ghosts.length} ghost checks pass`);
}
