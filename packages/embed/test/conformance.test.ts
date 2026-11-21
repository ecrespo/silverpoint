/** T-325 · the conformance kit (REQ-666; I-60, I-60b on the sources; the built files in 11g). */
import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { compareSvgTrees, parseSvg } from '../../../tools/svg-normalizer/normalize';
import { CONFORMANCE, conformance } from '../src/conformance/index';
import { CHART_SLUGS, renderSpec, renderToSVG, VERSION } from '../src/index';
import { toSVGString } from '@silverpoint/grounds';

const svg = (spec: Parameters<typeof renderToSVG>[0]) => {
  const r = renderToSVG(spec);
  if (!r.ok) throw new Error(JSON.stringify(r.error));
  return r.value.svg;
};

describe('conformance kit', () => {
  test('REQ-666 · one case per chart (demo, 480 px, id = slug) plus the appearance axes on four charts', () => {
    expect(CONFORMANCE.version).toBe(VERSION);
    const perChart = CONFORMANCE.cases.filter((c) => c.name === c.spec.chart);
    expect(perChart.map((c) => c.spec)).toEqual(CHART_SLUGS.map((chart) => ({ chart, width: 480, id: chart })));
    const axes = CONFORMANCE.cases.filter((c) => c.name !== c.spec.chart);
    expect(new Set(axes.map((c) => c.spec.chart)).size).toBe(4);
    expect(axes.some((c) => c.spec.ground === 'cyanotype')).toBe(true);
    expect(axes.some((c) => c.spec.mode === 'precision')).toBe(true);
    expect(new Set(axes.map((c) => c.spec.palette).filter(Boolean)).size).toBe(2);
  });

  test('I-60 · conformance(renderToSVG) passes with zero failures (Web Crypto hash)', async () => {
    const result = await conformance((spec) => svg(spec));
    expect(result.failed).toEqual([]);
    expect(result.passed).toBe(CONFORMANCE.cases.length);
  });

  test('I-60 · a host-supplied hash function and case list are used', async () => {
    const hash = (text: string) => createHash('sha256').update(text, 'utf8').digest('hex');
    const result = await conformance((spec) => svg(spec), hash, { version: 'x', cases: CONFORMANCE.cases.slice(0, 3) });
    expect(result).toEqual({ passed: 3, failed: [] });
  });

  test('I-60 · a render that draws differently fails, naming the case and both digests', async () => {
    const result = await conformance((spec) => svg(spec).replace('<title', '<title data-x="1"'), undefined, { version: 'x', cases: CONFORMANCE.cases.slice(0, 2) });
    expect(result.passed).toBe(0);
    expect(result.failed[0]).toMatchObject({ name: CONFORMANCE.cases[0]!.name });
    expect(result.failed[0]!.expected).not.toBe(result.failed[0]!.actual);
  });

  test('I-60b · every case’s SVG is the canonical render of its spec, as trees (the hashes are anchored to I-53)', () => {
    for (const c of CONFORMANCE.cases) {
      const rendered = renderSpec(c.spec);
      if (!rendered.ok) throw new Error(c.name);
      const tree = parseSvg(svg(c.spec));
      const [, ...rest] = tree.children;
      expect(compareSvgTrees({ ...tree, children: rest }, parseSvg(toSVGString(rendered.value))), c.name).toEqual({ equal: true });
    }
  });
});
