/**
 * `packages/embed/src/conformance/conformance.json` (REQ-666, Data Model §2.44): for each declared
 * spec, the SHA-256 of `renderToSVG(spec).svg`. One case per chart (its demo, 480 px, id = slug),
 * and the appearance axes over four charts chosen to cover weighted lines, hatched fills, a radial
 * layout and text-heavy chrome: the other ground, the other mode, two palettes.
 */
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Conformance, ConformanceCase } from '../../packages/embed/src/conformance/types';
import type { ChartSpec } from '../../packages/embed/src/spec/types';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
export const CONFORMANCE_FILE = join(ROOT, 'packages/embed/src/conformance/conformance.json');

const AXES_CHARTS = ['line-chart', 'area-chart', 'radar-chart', 'kpi-card'] as const;
const AXES: readonly [string, Partial<ChartSpec>][] = [
  ['cyanotype', { ground: 'cyanotype' }],
  ['precision', { mode: 'precision' }],
  ['sepia', { palette: 'sepia' }],
  ['indigo', { palette: 'indigo' }],
];

export async function buildConformance(slugs: readonly string[], version: string): Promise<Conformance> {
  const { renderToSVG } = await import('../../packages/embed/src/index');
  const sha = (spec: ChartSpec): string => {
    const result = renderToSVG(spec);
    if (!result.ok) throw new Error(`REQ-666 · ${spec.chart} does not render: ${JSON.stringify(result.error)}`);
    return createHash('sha256').update(result.value.svg, 'utf8').digest('hex');
  };
  const cases: ConformanceCase[] = slugs.map((chart) => {
    const spec: ChartSpec = { chart, width: 480, id: chart };
    return { name: chart, spec, sha256: sha(spec) };
  });
  for (const chart of AXES_CHARTS) {
    for (const [axis, fields] of AXES) {
      const spec: ChartSpec = { chart, width: 480, id: `${chart}-${axis}`, ...fields };
      cases.push({ name: `${chart}--${axis}`, spec, sha256: sha(spec) });
    }
  }
  return { version, cases };
}

export const conformanceSource = (kit: Conformance): string => `${JSON.stringify(kit, null, 2)}\n`;
