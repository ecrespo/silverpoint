/**
 * Phase 9 of feature-005 (agent access, 0.8.0): the delta corpus in
 * changes/feature-005-agent-access/ is approved, carries the user's decisions of 2026-10-20 and its
 * identifier ranges hold. No task may start before these hold (Constitution Art. 9).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const delta = (name: string) => readFileSync(join(ROOT, 'changes/feature-005-agent-access', name), 'utf8');

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

describe('feature-005 · gates approved (Art. 9)', () => {
  test.each(GATED)('%s is APPROVED on 2026-10-20', (name) => {
    expect(status(delta(name))).toMatch(/^`APPROVED`.*2026-10-20/);
  });

  test('the README records every gate 0..4 as approved', () => {
    const readme = delta('README.md');
    expect(status(readme)).toMatch(/^`APPROVED`/);
    for (const gate of ['0', '1', '2', '3', '4']) {
      expect(readme).toMatch(new RegExp(`^\\|\\s*${gate}\\s*\\|.*\\|\\s*✅ 2026-10-20\\s*\\|$`, 'm'));
    }
  });

  test('the open questions OQ-E1..E6 are recorded as resolved', () => {
    expect(delta('README.md')).toMatch(/^\|\s*OQ-E1\.\.E6\s*\|.*\|\s*Every recommendation/m);
    expect(delta('analyze.md')).toMatch(/\*\*Resolved 2026-10-20:\*\*/);
  });
});

describe('feature-005 · identifier ranges', () => {
  const range = (prefix: string, from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => `${prefix}-${from + i}`);

  test('REQ-530..569 are each declared once', () => {
    const declared = [...delta('prd-delta.md').matchAll(/^\|\s*(REQ-\d{3})\s*\|/gm)].map((m) => m[1]);
    expect(declared).toEqual(range('REQ', 530, 569));
  });

  test('the design decisions are DD-044..DD-050, each defined once', () => {
    const ids = [...delta('technical-design-delta.md').matchAll(/^### (DD-\d{3}) —/gm)].map((m) => m[1]);
    expect(ids).toEqual(range('DD', 44, 50).map((id) => id.replace(/-(\d+)$/, (_, n: string) => `-${n.padStart(3, '0')}`)));
  });

  test('the tasks are T-226..T-251, contiguous, each defined once', () => {
    const ids = [...delta('plan-and-tasks.md').matchAll(/^- (?:\[[ x]\] )?\*\*(T-\d{3})\*\*/gm)].map((m) => m[1]);
    expect(ids).toEqual(range('T', 226, 251));
  });

  test('the invariants are I-37..I-42, each defined once', () => {
    const ids = [...delta('data-model-delta.md').matchAll(/^- \*\*(I-\d{2})\*\*/gm)].map((m) => m[1]);
    expect(ids).toEqual(range('I', 37, 42));
  });
});
