/**
 * T-290: does a spec rendered by the PoC's `renderToSVG`, stylesheet set aside, reproduce every
 * stored canonical render? (I-53's feasibility, against the full fixture matrix; the real gate,
 * T-294 and T-322, compares parsed trees.) Run: tsx parity-check.ts
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { normalizeSvg } from '../svg-normalizer/normalize';
// @ts-expect-error the PoC's module build has no declarations
import * as embed from './dist/silverpoint-embed.mjs';

const FIXTURES = join(import.meta.dirname, '..', '..', 'fixtures');
const SKIP = new Set(['dashboard', 'deck', 'ui', 'palette', 'timeline']);
const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const result = { compared: 0, equal: 0, differ: [] as string[], skipped: [] as string[] };
for (const dir of readdirSync(FIXTURES)) {
  if (SKIP.has(dir) || !statSync(join(FIXTURES, dir)).isDirectory()) continue;
  for (const file of readdirSync(join(FIXTURES, dir)).filter((f) => f.endsWith('.fixture.json'))) {
    const f = JSON.parse(readFileSync(join(FIXTURES, dir, file), 'utf8'));
    const data = f.data === null ? undefined : JSON.parse(readFileSync(join(FIXTURES, f.data), 'utf8'));
    const spec = {
      chart: kebab(f.chart),
      ...(data === undefined ? {} : { data }),
      props: { ...f.props, hatchFill: f.hatchFill, seed: f.seed },
      width: f.size.width,
      height: f.size.height,
      id: f.id,
      ground: f.ground,
      substrate: f.substrate,
      mode: f.mode,
    };
    if (Object.values(spec.props).some((v) => typeof v === 'function')) { result.skipped.push(f.id); continue; }
    const svg = (embed.renderToSVG(spec) as string).replace(/<style>[\s\S]*?<\/style>/, '');
    const canonical = readFileSync(join(FIXTURES, f.canonical), 'utf8');
    result.compared++;
    if (normalizeSvg(svg) === canonical || normalizeSvg(svg) === canonical.trimEnd()) result.equal++;
    else result.differ.push(f.id);
  }
}
writeFileSync(join(import.meta.dirname, 'results', 'parity.json'), JSON.stringify({ ...result, differ: result.differ.slice(0, 50), differCount: result.differ.length }, null, 2) + '\n');
console.log(JSON.stringify({ compared: result.compared, equal: result.equal, differ: result.differ.length, firstDiffers: result.differ.slice(0, 5), skipped: result.skipped.length }, null, 2));
