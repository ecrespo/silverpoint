/**
 * Phase 1 of feature-003 (catalog expansion, 0.4.0..0.6.0): the delta corpus in
 * changes/feature-003-chart-catalog-expansion/ is approved, carries the user's decisions of
 * 2026-10-08 and the dispositions of 2026-10-09, and its identifier ranges hold. No task may
 * start before these hold (Constitution Art. 9).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const delta = (name: string) => readFileSync(join(ROOT, 'changes/feature-003-chart-catalog-expansion', name), 'utf8');

const GATED = [
  'prd-delta.md',
  'api-delta.md',
  'technical-design-delta.md',
  'data-model-delta.md',
  'plan-and-tasks.md',
  'constitution-amendment.md',
];

/** `| **Status** | ... |` row of a delta header. */
const status = (text: string) => text.match(/^\|\s*\*\*Status\*\*\s*\|\s*(.+?)\s*\|$/m)?.[1] ?? '';

/** Section of a Markdown document from a heading to the next heading of the same or higher level. */
const section = (text: string, heading: RegExp) => {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => heading.test(l));
  if (start < 0) return '';
  const level = lines[start]?.match(/^#+/)?.[0].length ?? 1;
  const end = lines.findIndex((l, i) => i > start && /^#+\s/.test(l) && (l.match(/^#+/)?.[0].length ?? 9) <= level);
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
};

describe('feature-003 · Phase 1 — gates approved (Art. 9)', () => {
  test.each(GATED)('%s is APPROVED on 2026-10-09', (name) => {
    expect(status(delta(name))).toMatch(/^`APPROVED`.*2026-10-09/);
  });

  test('the README records every gate 0..4 as approved', () => {
    const readme = delta('README.md');
    expect(status(readme)).toMatch(/^`APPROVED`/);
    for (const gate of ['0', '1', '2', '3', '4']) {
      expect(readme).toMatch(new RegExp(`^\\|\\s*${gate}\\s*\\|.*\\|\\s*✅ 2026-10-09\\s*\\|$`, 'm'));
    }
  });
});

describe('feature-003 · Phase 1 — decisions and dispositions', () => {
  const dispositions = section(delta('analyze.md'), /^## Dispositions/);

  test.each(['OQ-C1', 'OQ-C2', 'OQ-C3', 'OQ-C4', 'OQ-C5'])('%s is decided', (id) => {
    expect(dispositions).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|`, 'm'));
  });

  test.each(['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09', 'A-10', 'A-11', 'A-12', 'A-13', 'A-14', 'A-15'])(
    'finding %s has a disposition',
    (id) => {
      expect(dispositions).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|`, 'm'));
    },
  );

  test('A-09 · the too-small group lives in a fixture, not in the box/violin demo', () => {
    const demos = section(delta('data-model-delta.md'), /^## 2\. §4 Demo datasets/);
    const row = demos.split('\n').find((l) => l.startsWith('| Box, violin, ridgeline')) ?? '';
    expect(row).not.toMatch(/\*\*4\*\* observations/);
    expect(row).toMatch(/no diagnostic/i);
  });

  test('no open question is left without a decision', () => {
    const open = section(delta('technical-design-delta.md'), /^## 7\. §10 Open questions/);
    for (const id of ['OQ-C1', 'OQ-C2', 'OQ-C3', 'OQ-C4', 'OQ-C5']) {
      expect(open).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|.*\\*\\*Decided 2026-10-0[89]`, 'm'));
    }
  });
});

describe('feature-003 · identifier ranges', () => {
  const prd = delta('prd-delta.md');
  const declared = [...prd.matchAll(/^\|\s*(REQ-\d{3})\s*\|/gm)].map((m) => m[1]);

  test('REQ-400..REQ-426 and REQ-430..REQ-450 are each declared once; 427..429 unused', () => {
    const expected = [
      ...Array.from({ length: 27 }, (_, i) => `REQ-${400 + i}`),
      ...Array.from({ length: 21 }, (_, i) => `REQ-${430 + i}`),
    ];
    expect([...declared].sort()).toEqual(expected.sort());
  });

  test('the tasks are T-164..T-199, contiguous, each defined once', () => {
    const ids = [...delta('plan-and-tasks.md').matchAll(/^\*\*\[[ x]\] (T-\d{3}) ·/gm)].map((m) => m[1]);
    expect(ids).toEqual(Array.from({ length: 36 }, (_, i) => `T-${164 + i}`));
  });
});
