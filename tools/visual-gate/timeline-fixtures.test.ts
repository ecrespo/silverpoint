import { TIMELINE_DEMO } from '@silverpoint/core/ui-demos';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { normalizeUi, parseUi } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';
import { timelineCanonicalFor, timelineCanonicalMarkup, timelineFixtureProps, timelineMatrix } from './timeline-fixtures';

/*
 * The Timeline's `surface` fixtures (T-221, Data Model §5): the server markup of `SpTimeline` on the
 * five ground substrates × two modes; four on every PR.
 */

describe('timeline surface fixtures (T-221)', () => {
  test('REQ-516 · Data Model §5: one state × 5 ground substrates × 2 modes = 10, 4 on PR', () => {
    const matrix = timelineMatrix();
    expect(matrix).toHaveLength(10);
    expect(new Set(matrix.map((f) => f.id)).size).toBe(10);
    expect(matrix.filter((f) => f.scope === 'pr').map((f) => f.id)).toEqual([
      'timeline--surface--silverpoint--cream--ink',
      'timeline--surface--silverpoint--cream--precision',
      'timeline--surface--cyanotype--prussian--ink',
      'timeline--surface--cyanotype--prussian--precision',
    ]);
    expect(matrix[0]).toMatchObject({ component: 'timeline', state: 'surface', canonical: 'ui/timeline--surface--silverpoint--cream--ink.canonical.txt' });
  });

  test('REQ-513 · a fixture’s props are the demo data on its ground, substrate and mode', () => {
    const fixture = timelineMatrix().find((f) => f.id === 'timeline--surface--silverpoint--ochre--precision')!;
    expect(timelineFixtureProps(fixture)).toEqual({ data: TIMELINE_DEMO, ground: 'silverpoint', substrate: 'ochre', mode: 'precision' });
  });

  test('REQ-513 · the canonical is the surface: a named section, the probes, and an empty mount', () => {
    const root = parseUi(timelineCanonicalMarkup(timelineMatrix()[0]!));
    expect(root.tag).toBe('section');
    expect(root.attrs).toContainEqual(['aria-label', TIMELINE_DEMO.title!.text!.headline!]);
    const mount = root.children.at(-1) as { attrs: [string, string][]; children: unknown[] };
    expect(mount.attrs).toContainEqual(['class', 'sp-kl-mount']);
    expect(mount.children).toEqual([]);
  });

  test('REQ-516 · the committed canonicals are the core’s, unchanged', () => {
    for (const fixture of timelineMatrix()) {
      expect(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8'), fixture.id).toBe(timelineCanonicalFor(fixture));
      expect(timelineCanonicalFor(fixture)).toBe(normalizeUi(timelineCanonicalMarkup(fixture)));
    }
  });
});
