/** T-314, T-315 · `specFromTable` and the reshapes (REQ-656, REQ-657), against fixtures/embed/tables. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { specFromTable } from '../src/hosts/index';

type Case = { name: string; binding: never; expect?: object; error?: object; errorKind?: string };
const cases = (file: string): Case[] => JSON.parse(readFileSync(new URL(`../../../fixtures/embed/tables/${file}`, import.meta.url), 'utf8'));

describe('specFromTable', () => {
  for (const file of ['rows.json', 'pivot-matrix.json', 'pivot-dimensions.json', 'scalar.json']) {
    for (const c of cases(file)) {
      test(`REQ-656 · REQ-657 · ${file}: ${c.name}`, () => {
        const result = specFromTable(c.binding);
        expect(result.ok ? result.value : result.error).toEqual(c.expect);
      });
    }
  }

  for (const c of cases('errors.json')) {
    test(`REQ-656 · error: ${c.name}`, () => {
      const result = specFromTable(c.binding);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      if (c.error) expect(result.error).toEqual(c.error);
      else expect(result.error.kind).toBe(c.errorKind);
    });
  }

  test('REQ-656 · Date cells are written as ISO strings', () => {
    const result = specFromTable({ chart: 'line-chart', table: { rows: [{ t: new Date(Date.UTC(2026, 0, 2)), v: 3 }] }, roles: { x: 't', value: 'v' } });
    expect(result.ok && (result.value.data as { t: string }[])[0]!.t).toBe('2026-01-02T00:00:00.000Z');
  });

  test('REQ-656 · the result passes validateSpec (one error shape for hosts)', async () => {
    const { validateSpec } = await import('../src/index');
    for (const file of ['rows.json', 'pivot-matrix.json', 'scalar.json']) {
      for (const c of cases(file)) {
        const result = specFromTable(c.binding);
        expect(result.ok && validateSpec(result.value).ok, c.name).toBe(true);
      }
    }
  });
});
