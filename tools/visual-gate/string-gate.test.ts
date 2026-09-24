import { describe, expect, test } from 'vitest';
import { lineChart } from '@silverpoint/core';
import { renderChart, toSVGString } from '@silverpoint/grounds';
import { loadFixtures, fixtureProps, type Fixture } from './fixtures';
import { runStringGate, type Renderers } from './string-gate';

const fixtures = loadFixtures().slice(0, 2);
const svgOf = (fixture: Fixture) => toSVGString(renderChart(lineChart, fixtureProps(fixture), { id: fixture.id }));

const faithful: Renderers = {
  react: async (f) => `<div class="sp-root">${svgOf(f)}</div>`,
  vue: async (f) => svgOf(f),
  angular: async (f) => `<sp-line-chart _nghost-ng-c1=""><!--container-->${svgOf(f)}</sp-line-chart>`,
};

describe('string gate', () => {
  test('REQ-180 · adapters matching the canonical render pass', async () => {
    const results = await runStringGate(fixtures, faithful);
    expect(results).toHaveLength(fixtures.length * 3);
    expect(results.every((r) => r.equal)).toBe(true);
  });

  test('REQ-100 · a diverging adapter fails, naming the adapter, the fixture and the difference', async () => {
    const results = await runStringGate(fixtures, {
      ...faithful,
      vue: async (f) => svgOf(f).replace('data-mode="', 'data-mode="x'),
    });
    const failures = results.filter((r) => !r.equal);
    expect(failures.map((r) => r.adapter)).toEqual(fixtures.map(() => 'vue'));
    expect(failures[0]).toMatchObject({ fixture: fixtures[0]?.id });
    expect(failures[0]?.difference).toMatch(/data-mode/);
  });

  test('DD-004 · each adapter is compared with the canonical render, never with a sibling', async () => {
    const wrong = async (f: Fixture) => svgOf(f).replace('role="img"', 'role="presentation"');
    const results = await runStringGate(fixtures, { ...faithful, react: wrong, vue: wrong });
    expect(results.filter((r) => !r.equal).map((r) => r.adapter).sort()).toEqual(
      [...fixtures.map(() => 'react'), ...fixtures.map(() => 'vue')].sort(),
    );
  });

  test('REQ-180 · an adapter that throws is a failure, not a crash', async () => {
    const results = await runStringGate(fixtures, { ...faithful, angular: async () => Promise.reject(new Error('boom')) });
    expect(results.filter((r) => r.adapter === 'angular').every((r) => !r.equal && /boom/.test(r.difference ?? ''))).toBe(true);
  });
});
