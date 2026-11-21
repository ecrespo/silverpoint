/**
 * T-329 (feature-007, Art. 9): the deltas of changes/feature-007-bi-hosts/ and delta-014 are folded
 * into specs/ — every identifier range declared once in its home document, each document at the
 * version the plan names, the amendments made in implementation carried, and no delta left saying it
 * is pending a fold.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const spec = (name: string) => readFileSync(join(ROOT, 'specs', `${name}.md`), 'utf8');
const change = (name: string) => readFileSync(join(ROOT, 'changes', name), 'utf8');
const range = (prefix: string, from: number, to: number, pad = 3) =>
  Array.from({ length: to - from + 1 }, (_, i) => `${prefix}-${String(from + i).padStart(pad, '0')}`);

describe('feature-007 · folded into specs/ (T-329)', () => {
  test('each document is at the version the plan names', () => {
    expect(spec('constitution')).toMatch(/^> Version 1\.12 /m);
    expect(spec('prd')).toMatch(/^\| \*\*Version\*\* \| 1\.19 \|/m);
    expect(spec('api-spec')).toMatch(/^\| \*\*API version\*\* \| v1\.16 \|/m);
    expect(spec('technical-design')).toMatch(/^\| \*\*Version\*\* \| 1\.16 \|/m);
    expect(spec('data-model')).toMatch(/^\| \*\*Version\*\* \| 1\.14 \|/m);
    expect(spec('implementation-plan')).toMatch(/^\| \*\*Version\*\* \| 1\.14 \|/m);
  });

  test('the constitution names @silverpoint/embed in its scope and binds it in Art. 2', () => {
    const text = spec('constitution');
    expect(text.slice(0, text.indexOf('**What silverpoint is.**'))).toContain('`@silverpoint/embed`');
    expect(text).toMatch(/Host targets/);
  });

  test('REQ-629..REQ-668 are declared in the PRD, §6.16', () => {
    const prd = spec('prd');
    expect(prd).toMatch(/^### 6\.16 /m);
    const declared = new Set([...prd.matchAll(/^\|\s*(REQ-\d{3})\s*\|/gm)].map((m) => m[1]));
    for (const id of range('REQ', 629, 668)) expect(declared.has(id), id).toBe(true);
  });

  test('the API Spec carries §1.5, §15 and the diagnostics SP030 and SP031', () => {
    const api = spec('api-spec');
    expect(api).toMatch(/^### 1\.5 /m);
    expect(api).toMatch(/^## 15\. /m);
    expect(api).toMatch(/^\| `SP030` \|/m);
    expect(api).toMatch(/^\| `SP031` \|/m);
    expect(api).toContain('STANDALONE_INTEGRITY');
  });

  test('the Technical Design defines DD-061..DD-072 once each', () => {
    const ids = [...spec('technical-design').matchAll(/^#{3,4} (DD-\d{3})\b/gm)].map((m) => m[1]);
    for (const id of range('DD', 61, 72)) expect(ids.filter((x) => x === id), id).toHaveLength(1);
  });

  test('the Data Model carries §2.38..§2.44 and the invariants I-53..I-60', () => {
    const dm = spec('data-model');
    for (let n = 38; n <= 44; n++) expect(dm, `§2.${n}`).toMatch(new RegExp(`^#{2,3} §?2\\.${n}\\b`, 'm'));
    for (const id of range('I', 53, 60, 2)) expect(dm, id).toMatch(new RegExp(`\\b${id}\\b`));
    expect(dm).toContain('demo.options');
  });

  test('the Implementation Plan has Phase 11', () => {
    expect(spec('implementation-plan')).toMatch(/^#{2,3} Phase 11\b/m);
  });

  test('the amendments made in implementation are carried (budgets 34 / 11 kB, treemap unbound)', () => {
    expect(spec('api-spec')).toMatch(/\*\*34 kB\*\*/);
    expect(spec('technical-design')).toMatch(/≤ 34 kB/);
    expect(spec('data-model')).toMatch(/treemap-chart/);
  });

  test('delta-014 is folded: REQ-547 names no SpButton restriction', () => {
    const row = spec('prd').match(/^\| REQ-547 \|.*$/m)?.[0] ?? '';
    expect(row).not.toMatch(/SpButton/);
    expect(change('delta-014-button-as-trigger.md')).toMatch(/\*\*Status\*\* \| `APPROVED`/);
  });

  test('no feature-007 delta still says it is pending', () => {
    for (const name of ['README.md', 'constitution-amendment.md', 'prd-delta.md', 'api-delta.md', 'technical-design-delta.md', 'data-model-delta.md', 'plan-and-tasks.md']) {
      const status = change(`feature-007-bi-hosts/${name}`).match(/^\|\s*\*\*Status\*\*\s*\|\s*(.+?)\s*\|$/m)?.[1] ?? '';
      expect(status, name).toMatch(/[Ff]olded into `specs\/` 2026-11-21/);
    }
  });
});
