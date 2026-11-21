/**
 * Writes the `renderToHTML` goldens of `fixtures/embed/html` (Data Model §5, DD-069, analyze A-07)
 * from `cases.json`. A golden is approved by reading it, then committed; T-295's test guards it.
 * Regenerating one changes a contract another language writes byte for byte (silverpoint-python
 * PY-REQ-006): never a patch.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate embed-goldens
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderToHTML } from '../../packages/embed/src/index';

const DIR = fileURLToPath(new URL('../../fixtures/embed/html/', import.meta.url));
const cases = JSON.parse(readFileSync(`${DIR}cases.json`, 'utf8')) as { file: string; spec: object; options: object }[];
for (const c of cases) {
  const result = renderToHTML(c.spec as never, c.options as never);
  if (!result.ok) throw new Error(`${c.file}: ${JSON.stringify(result.error)}`);
  writeFileSync(`${DIR}${c.file}`, result.value.html);
  console.log(`wrote fixtures/embed/html/${c.file} (${result.value.html.length} characters)`);
}
