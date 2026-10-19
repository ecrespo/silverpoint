/**
 * Phase 8 of feature-004 (the reflex-silverpoint-react 0.7 inventory, 0.7.0): the delta corpus in
 * changes/feature-004-composed-components/ is approved, carries the user's decisions of 2026-10-18
 * and its identifier ranges hold. No task may start before these hold (Constitution Art. 9).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const delta = (name: string) => readFileSync(join(ROOT, 'changes/feature-004-composed-components', name), 'utf8');

const GATED = [
  'research.md',
  'prd-delta.md',
  'api-delta.md',
  'technical-design-delta.md',
  'data-model-delta.md',
  'plan-and-tasks.md',
  'constitution-amendment.md',
];

/** `| **Status** | ... |` row of a delta header. */
const status = (text: string) => text.match(/^\|\s*\*\*Status\*\*\s*\|\s*(.+?)\s*\|$/m)?.[1] ?? '';

describe('feature-004 · gates approved (Art. 9)', () => {
  test.each(GATED)('%s is APPROVED on 2026-10-18', (name) => {
    expect(status(delta(name))).toMatch(/^`APPROVED`.*2026-10-18/);
  });

  test('the README records every gate 0..4 as approved', () => {
    const readme = delta('README.md');
    expect(status(readme)).toMatch(/^`APPROVED`/);
    for (const gate of ['0', '1', '2', '3', '4']) {
      expect(readme).toMatch(new RegExp(`^\\|\\s*${gate}\\s*\\|.*\\|\\s*✅ 2026-10-18\\s*\\|$`, 'm'));
    }
  });

  test('the user decisions OQ-C1 and OQ-C2 are recorded as decided', () => {
    const td = delta('technical-design-delta.md');
    for (const id of ['OQ-C1', 'OQ-C2']) expect(td).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|.*\\*\\*Decided 2026-10-18`, 'm'));
  });
});

describe('feature-004 · identifier ranges', () => {
  const declared = [...delta('prd-delta.md').matchAll(/^\|\s*(REQ-\d{3})\s*\|/gm)].map((m) => m[1]);

  test('REQ-460..468, REQ-470..503 and REQ-510..523 are each declared once', () => {
    const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `REQ-${from + i}`);
    expect([...declared].sort()).toEqual([...range(460, 468), ...range(470, 503), ...range(510, 523)].sort());
  });

  test('the tasks are T-200..T-225, contiguous, each defined once', () => {
    const ids = [...delta('plan-and-tasks.md').matchAll(/^\*\*\[[ x]\] (T-\d{3}) ·/gm)].map((m) => m[1]);
    expect(ids).toEqual(Array.from({ length: 26 }, (_, i) => `T-${200 + i}`));
  });

  test('every finding of analyze.md has a disposition', () => {
    const rows = [...delta('analyze.md').matchAll(/^\|\s*(A-\d{2})\s*\|[^|]+\|[^|]+\|\s*(.+?)\s*\|$/gm)];
    expect(rows.map((m) => m[1])).toEqual(Array.from({ length: 10 }, (_, i) => `A-${String(i + 1).padStart(2, '0')}`));
    for (const m of rows) expect(m[2].length).toBeGreaterThan(5);
  });
});
