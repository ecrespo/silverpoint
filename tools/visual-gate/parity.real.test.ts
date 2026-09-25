import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { adapterParity, PARITY_FIXTURES, type ParityEntry } from './parity';

/**
 * PRD acceptance of REQ-100: "the documentation shows the same fixture rendered by all three
 * adapters". The site shows committed renders; this gate holds them current and equal (T-097).
 */
describe('documentation: one fixture, three adapters', () => {
  const committed = JSON.parse(readFileSync(new URL('../../docs/site/generated/parity.json', import.meta.url), 'utf8')) as ParityEntry[];

  test('REQ-100 · the site shows every parity fixture, each rendered by React, Vue and Angular', () => {
    expect(committed.map((e) => e.id)).toEqual(PARITY_FIXTURES);
    for (const entry of committed) {
      expect(Object.keys(entry.renders).sort(), entry.id).toEqual(['angular', 'react', 'vue']);
      expect(entry.equal, entry.id).toEqual({ react: true, vue: true, angular: true });
    }
  });

  test('REQ-100 · REQ-180 · the committed renders are the adapters’ current output', async () => {
    expect(await adapterParity()).toEqual(committed);
  });
});
