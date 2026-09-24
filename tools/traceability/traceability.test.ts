import { describe, expect, test } from 'vitest';
import { citedIn, coverage, deferredIn, requirementsIn } from './traceability';

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
});
