/**
 * Phase 0 of feature-002 (UI components, 0.3.0): the delta corpus in
 * changes/feature-002-ui-components/ is approved, carries the user's decisions of
 * 2026-09-28 and the seven corrections taken from the visual concept, and every
 * identifier it cites resolves — in the delta or in specs/. No task may start
 * before these hold (Constitution Art. 9).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const DELTA = join(ROOT, 'changes/feature-002-ui-components');
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const delta = (name: string) => read(`changes/feature-002-ui-components/${name}`);

const GATED = [
  'prd-delta.md',
  'api-delta.md',
  'technical-design-delta.md',
  'data-model-delta.md',
  'plan-and-tasks.md',
  'constitution-amendment.md',
];
const ALL = ['README.md', 'research.md', 'analyze.md', ...GATED];

/** `| **Status** | ... |` row of a delta header. */
const status = (text: string) => text.match(/^\|\s*\*\*Status\*\*\s*\|\s*(.+?)\s*\|$/m)?.[1] ?? '';

/** Section of a Markdown document from a heading to the next heading of the same or higher level. */
const section = (text: string, heading: RegExp) => {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => heading.test(l));
  if (start < 0) return '';
  const level = lines[start].match(/^#+/)?.[0].length ?? 1;
  const end = lines.findIndex((l, i) => i > start && /^#+\s/.test(l) && (l.match(/^#+/)?.[0].length ?? 9) <= level);
  return lines.slice(start, end < 0 ? undefined : end).join('\n');
};

describe('feature-002 · Phase 0 — gates approved (Art. 9)', () => {
  test.each(GATED)('%s is APPROVED on 2026-09-28', (name) => {
    expect(status(delta(name))).toMatch(/^`APPROVED`.*2026-09-28/);
  });

  test('the README records every gate 0..4 as approved', () => {
    const readme = delta('README.md');
    expect(status(readme)).toMatch(/^`APPROVED`/);
    for (const gate of ['0', '1', '2', '3', '4']) {
      expect(readme).toMatch(new RegExp(`^\\|\\s*${gate}\\s*\\|.*\\|\\s*✅ 2026-09-28\\s*\\|$`, 'm'));
    }
  });

  test('the visual concept is kept beside the deltas', () => {
    expect(existsSync(join(DELTA, 'concept.png'))).toBe(true);
    expect(delta('README.md')).toContain('(concept.png)');
  });
});

describe('feature-002 · Phase 0 — the user decisions of 2026-09-28', () => {
  const analyze = delta('analyze.md');
  const dispositions = section(analyze, /^## Dispositions/);

  test.each(['OQ-U1', 'OQ-U2', 'OQ-U3', 'OQ-U4'])('%s is decided in the analyze dispositions', (id) => {
    expect(dispositions).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|\\s*Decided 2026-09-28`, 'm'));
  });

  test.each(['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09'])(
    'finding %s has a disposition',
    (id) => {
      expect(dispositions).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|`, 'm'));
    },
  );

  test.each(['C-1', 'C-2', 'C-3', 'C-4', 'C-5', 'C-6', 'C-7'])('concept correction %s has a disposition', (id) => {
    expect(dispositions).toMatch(new RegExp(`^\\|\\s*${id}\\s*\\|\\s*Applied`, 'm'));
  });

  test('OQ-U2 · every adapter names components with the Sp prefix; React no longer unprefixed', () => {
    const api = delta('api-delta.md');
    const reactRow = api.match(/^\|\s*`@silverpoint\/react`.*$/m)?.[0] ?? '';
    expect(reactRow).toContain('`SpButton`');
    expect(reactRow).toContain('`SpTabPanel`');
    expect(reactRow).not.toMatch(/`Button`/);
    expect(api).toContain("import { SpSegmented } from '@silverpoint/react/ui/segmented'");
    expect(delta('prd-delta.md')).toMatch(/React `SpButton`/);
  });

  test('OQ-U3 · all 17 components ship in 0.3.0', () => {
    expect(delta('README.md')).toMatch(/OQ-U3.*All 17 in `0\.3\.0`/);
  });
});

describe('feature-002 · Phase 0 — the seven corrections from the visual concept', () => {
  const api = delta('api-delta.md');
  const dm = delta('data-model-delta.md');
  const td = delta('technical-design-delta.md');
  const prd = delta('prd-delta.md');

  test('C-1 · Input carries a message tied by aria-describedby, and aria-invalid', () => {
    expect(api).toMatch(/\*\*Input\*\*.*`message\?: string`/);
    expect(api).toMatch(/`\$\{id\}--message`/);
    expect(api).toMatch(/aria-invalid/);
    expect(prd).toMatch(/REQ-334/);
    expect(dm).toMatch(/^\|\s*Input\s*\|.*message.*\|/m);
  });

  test('C-2 · Rate marks are lozenges, not stars', () => {
    for (const text of [api, td, dm, prd]) expect(text).not.toMatch(/\bstars?\b/i);
    expect(api).toMatch(/lozenge/);
    expect(td).toMatch(/lozenge/);
  });

  test('C-3 · Alert error takes a tone level, and text on it joins the contrast gate', () => {
    expect(td).toMatch(/Alert.*`error`.*level/);
    expect(dm).toMatch(/alertError:\s*1 \| 2 \| 3 \| 4/);
    expect(dm).toMatch(/text on the `alertError` tone/i);
  });

  test('C-4 · Steps connectors carry data-status; waiting ones are dashed', () => {
    expect(api).toMatch(/`sp-connector`.*`data-status`/);
    expect(td).toMatch(/connector.*dashed/i);
  });

  test('C-5 · the Card composes with charts on the UI page; its fixtures hold no chart', () => {
    expect(dm).toMatch(/Card.*no chart/i);
    expect(dm).toMatch(/UI page.*Card.*Sparkline/);
  });

  test('C-6 · Button takes `variant`; `tone` means only a ramp level (A-07)', () => {
    expect(api).toMatch(/\*\*Button\*\*\s*\|\s*`variant\?: UiVariant`/);
    expect(api).toMatch(/export type UiVariant = 'default' \| 'primary' \| 'danger';/);
    expect(api).not.toMatch(/UiTone/);
    expect(td).not.toMatch(/`primary` Button level 2/);
  });

  test('C-7 · precision swaps the frame only; tone stays', () => {
    expect(td).toMatch(/`precision`.*tone.*unchanged/i);
    expect(api).toMatch(/`precision`.*tone.*unchanged/i);
  });
});

describe('feature-002 · Phase 0 — analyze findings folded into the deltas', () => {
  test('A-03 · the API states parity holds for library output only', () => {
    expect(delta('api-delta.md')).toMatch(/parity holds for the markup the library emits/i);
  });
  test('A-04 · the contrast requirement cites the Data Model §3.8 pairs as normative', () => {
    expect(delta('prd-delta.md')).toMatch(/REQ-313.*Data Model §3\.8/);
  });
  test('A-06 · the API value table documents the silent unknown-key fallback', () => {
    expect(delta('api-delta.md')).toMatch(/unknown key.*silent/i);
  });
});

describe('feature-002 · Phase 0 — identifiers resolve', () => {
  const corpus = ALL.map((name) => [name, delta(name)] as const);
  const prdAll = read('specs/prd.md') + delta('prd-delta.md');
  const requirements = new Set(
    [...prdAll.matchAll(/^\|\s*\*{0,2}(REQ-\d{3})\*{0,2}\s*\|/gm)].map((m) => m[1]),
  );
  const decisions = new Set(
    [...(read('specs/technical-design.md') + delta('technical-design-delta.md')).matchAll(/^#{2,4}\s*(DD-\d{3})\b/gm)].map(
      (m) => m[1],
    ),
  );
  const diagnostics = new Set(
    [...(read('specs/api-spec.md') + delta('api-delta.md')).matchAll(/^\|\s*`?(SP\d{3})`?\s*\|/gm)].map((m) => m[1]),
  );
  const tasks = new Set(
    [...(read('specs/tasks.md') + delta('plan-and-tasks.md')).matchAll(/^\*\*\[[ x]\]\s*(T-\d{3})/gm)].map((m) => m[1]),
  );

  test.each([
    ['REQ', /REQ-\d{3}/g, requirements],
    ['DD', /DD-\d{3}/g, decisions],
    ['SP', /\bSP\d{3}\b/g, diagnostics],
  ] as const)('every %s id cited in the delta corpus is declared', (_label, pattern, known) => {
    const dangling = corpus.flatMap(([name, text]) =>
      [...new Set(text.match(pattern) ?? [])].filter((id) => !known.has(id)).map((id) => `${name}: ${id}`),
    );
    expect(dangling).toEqual([]);
  });

  test('every task range cited resolves (T-135..T-163 in the plan)', () => {
    for (let n = 135; n <= 163; n++) expect(tasks.has(`T-${n}`)).toBe(true);
  });

  test('every new MUST maps to at least one task in the plan traceability table', () => {
    const prd = delta('prd-delta.md');
    const musts = [...prd.matchAll(/^\|\s*(REQ-3\d{2})\s*\|.*\|\s*MUST\s*\|$/gm)].map((m) => m[1]);
    const table = section(delta('plan-and-tasks.md'), /^## Traceability/);
    const mapped = new Set(
      // Two REQ → tasks pairs per row share their separating pipe, hence the look-arounds.
      [...table.matchAll(/(?<=\|)\s*(3\d{2})\s*\|\s*T-[^|]+(?=\|)/g)].map((m) => `REQ-${m[1]}`),
    );
    expect(musts.length).toBeGreaterThanOrEqual(33);
    expect(musts.filter((id) => !mapped.has(id))).toEqual([]);
  });

  test('the requirement count stated in the PRD delta matches its tables', () => {
    const prd = delta('prd-delta.md');
    const rows = [...prd.matchAll(/^\|\s*(REQ-3\d{2})\s*\|.*\|\s*(MUST|SHOULD)\s*\|$/gm)];
    const must = rows.filter((r) => r[2] === 'MUST').length;
    const should = rows.length - must;
    expect(prd).toContain(`**Count:** ${rows.length} requirements (${must} MUST, ${should} SHOULD)`);
  });
});

describe('feature-002 · Phase 0 — working tree housekeeping', () => {
  test('no stray package tarball under packages/core', () => {
    expect(existsSync(join(ROOT, 'packages/core/silverpoint-core-0.1.0.tgz'))).toBe(false);
  });
  test('CLAUDE.md cites the PRD version specs/prd.md declares', () => {
    const declared = read('specs/prd.md').match(/^\|\s*\*\*Version\*\*\s*\|\s*([0-9.]+)\s*\|/m)?.[1];
    expect(read('CLAUDE.md')).toMatch(new RegExp(`PRD \\(EARS criteria\\) \\| ✅ v${declared?.replace('.', '\\.')} `));
  });
});
