import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { citedIn, coverage, deferredIn, passes, pendingIn, requirementsIn, TEST_ROOTS, testFiles } from './traceability';

const prd = `
| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-001 | ubiquitous | THE SYSTEM SHALL compute. | MUST |
| REQ-002 | ubiquitous | THE SYSTEM SHALL round. | MUST |
| REQ-028 | optional | WHERE weight. | SHOULD |

| ID | Chart | Family | Priority |
|---|---|---|---|
| REQ-060 | Spline \`LineChart\` | line | MUST |
| REQ-061 | Step chart | line | MUST |
`;

const tasks = `
## Deferred requirements

| REQ | Priority | Target | Reason |
|---|---|---|---|
| REQ-061 … REQ-062 | MUST | Phases 1-3 | The catalog |
`;

describe('traceability', () => {
  test('REQ-183 · reads every requirement and its priority from the PRD tables', () => {
    expect(requirementsIn(prd)).toEqual(
      new Map([
        ['REQ-001', 'MUST'],
        ['REQ-002', 'MUST'],
        ['REQ-028', 'SHOULD'],
        ['REQ-060', 'MUST'],
        ['REQ-061', 'MUST'],
      ]),
    );
  });

  test('REQ-183 · finds the requirements cited in test names, including test.each titles', () => {
    const source = `
      test('REQ-001 · computes', () => {});
      it("REQ-060 · draws", () => {});
      test.each([1, 2])('REQ-002 · REQ-060 · rounds %i', () => {});
      describe('REQ-999 in a describe does not count as a test', () => {});
      const note = 'REQ-028 in a plain string is not a citation';
    `;
    expect([...citedIn(source)].sort()).toEqual(['REQ-001', 'REQ-002', 'REQ-060']);
  });

  test('REQ-183 · expands deferred ranges from the Deferred table of tasks.md', () => {
    expect([...deferredIn(tasks)].sort()).toEqual(['REQ-061', 'REQ-062']);
  });

  test('REQ-184 · a MUST with no test is listed as blocking; a deferred one is not', () => {
    const report = coverage(requirementsIn(prd), new Set(['REQ-001', 'REQ-060']), deferredIn(tasks));
    expect(report.blocking).toEqual(['REQ-002']);
    expect(report.deferred).toEqual(['REQ-061']);
    expect(report.covered).toEqual(['REQ-001', 'REQ-060']);
  });

  test('REQ-184 · citing an undefined requirement is reported', () => {
    const report = coverage(requirementsIn(prd), new Set(['REQ-001', 'REQ-777']), new Set());
    expect(report.unknown).toEqual(['REQ-777']);
  });

  test('REQ-183 · a skipped or todo test verifies nothing, so its title cites nothing (T-090)', () => {
    const source = `
      test.skip('REQ-001 · not run', () => {});
      it.skip('REQ-002 · not run either', () => {});
      test.todo('REQ-060 · not written');
      test.only('REQ-061 · run', () => {});
    `;
    expect([...citedIn(source)]).toEqual(['REQ-061']);
  });

  test('REQ-184 · a PRD with no parsable MUST row fails the gate instead of passing it empty (T-090)', () => {
    expect(passes(coverage(new Map(), new Set(), new Set()))).toBe(false);
    expect(passes(coverage(requirementsIn(prd), new Set(['REQ-001', 'REQ-002', 'REQ-060']), deferredIn(tasks)))).toBe(true);
  });

  test('REQ-183 · every vitest project lies under a scanned root, so no project’s citations are lost (T-103)', () => {
    const root = fileURLToPath(new URL('../..', import.meta.url));
    const projects = [...readFileSync(`${root}vitest.config.ts`, 'utf8').matchAll(/root: '([^']+)'/g)].map((m) => m[1]!);
    expect(projects).toContain('docs/site');
    const lost = projects.filter((project) => !TEST_ROOTS.some((dir) => project === dir || project.startsWith(`${dir}/`)));
    expect(lost).toEqual([]);
    expect(TEST_ROOTS.flatMap((dir) => testFiles(`${root}${dir}`))).toContain(`${root}docs/site/test/props.test.ts`);
  });
  const delta = (status: string) => `
| Field | Value |
|---|---|
| **Status** | ${status} |

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-300 | ubiquitous | THE SYSTEM SHALL provide. | MUST |
| REQ-333 | optional | WHERE provider. | SHOULD |
`;

  test('REQ-183 · an approved delta PRD not yet folded yields pending requirements (feature-002 Phase 1)', () => {
    expect(pendingIn(delta('`APPROVED` — gate 1, approved 2026-09-28'))).toEqual(
      new Map([
        ['REQ-300', 'MUST'],
        ['REQ-333', 'SHOULD'],
      ]),
    );
    expect(pendingIn(delta('`PROPOSED` — gate 1, awaiting the user'))).toEqual(new Map());
  });

  test('REQ-184 · a pending requirement may be cited without being unknown, and is never blocking', () => {
    const pending = pendingIn(delta('`APPROVED`'));
    const report = coverage(requirementsIn(prd), new Set(['REQ-001', 'REQ-002', 'REQ-060', 'REQ-300', 'REQ-777']), deferredIn(tasks), pending);
    expect(report.unknown).toEqual(['REQ-777']);
    expect(report.pending).toEqual(['REQ-300']);
    expect(report.blocking).toEqual([]);
    expect(passes(coverage(requirementsIn(prd), new Set(['REQ-001', 'REQ-002', 'REQ-060', 'REQ-300']), deferredIn(tasks), pending))).toBe(true);
  });

  test('REQ-183 · a requirement already folded into the PRD is not pending', () => {
    const report = coverage(requirementsIn(prd), new Set(['REQ-001']), new Set(), new Map([['REQ-001', 'MUST']]));
    expect(report.pending).toEqual([]);
    expect(report.covered).toEqual(['REQ-001']);
  });
});
