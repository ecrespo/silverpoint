/** T-327 · the README's examples (REQ-667): every spec in it validates, every TS example runs. */
import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { conformance } from '../src/conformance/index';
import { HOST_CATALOG, specFromTable } from '../src/hosts/index';
import { renderToHTML, renderToSVG, validateSpec } from '../src/index';

const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8');
const fences = (lang: string) => [...readme.matchAll(new RegExp('```' + lang + '\\n([\\s\\S]*?)```', 'g'))].map((m) => m[1]!);

describe('README', () => {
  test('REQ-667 · the spec example validates', () => {
    for (const json of fences('json')) expect(validateSpec(json).ok).toBe(true);
  });

  test('REQ-667 · the page example’s spec validates', () => {
    for (const html of fences('text')) {
      const json = /<script type="application\/json">([\s\S]*?)<\/script>/.exec(html)?.[1];
      if (json) expect(validateSpec(json).ok).toBe(true);
    }
  });

  test('REQ-667 · the TypeScript examples run against the package', async () => {
    const scope = { renderToSVG, renderToHTML, specFromTable, HOST_CATALOG, conformance };
    for (const ts of fences('ts')) {
      const body = ts.replace(/^import[^;]+;\n/gm, '').replace(/\bconst\b/g, 'var');
      const run = new Function(...Object.keys(scope), `return (async () => { ${body}; return { svg: typeof svg === 'undefined' ? undefined : svg, spec: typeof spec === 'undefined' ? undefined : spec, failed: typeof failed === 'undefined' ? undefined : failed }; })();`);
      const out = await run(...Object.values(scope));
      if (out.svg) expect(out.svg.ok).toBe(true);
      if (out.spec) expect(out.spec.ok).toBe(true);
      if (out.failed) expect(out.failed).toEqual([]);
    }
  });
});
