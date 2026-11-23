import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// zizmor artipacked (2026-11-23 workflow check): no workflow here pushes, so no checkout keeps its token.
const dir = new URL('../.github/workflows/', import.meta.url);

for (const name of readdirSync(dir).filter((n) => n.endsWith('.yml'))) {
  test(`${name}: every checkout drops its token`, () => {
    const src = readFileSync(new URL(name, dir), 'utf8');
    const steps = src.split(/\n(?= {6}- )/).filter((s) => s.includes('uses: actions/checkout@'));
    assert.ok(steps.length > 0);
    for (const s of steps) assert.match(s, /persist-credentials: false/, s);
    assert.doesNotMatch(src, /git push/);
  });
}
