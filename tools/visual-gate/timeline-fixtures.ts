/**
 * The Timeline's `surface` fixtures (T-221, Data Model §5): its server markup on the five ground
 * substrates × two modes, 10, four of them on every PR. The canonical render is the core's
 * `timelineView` over `TIMELINE_DEMO`; TimelineJS's own DOM is no part of it (Art. 3 as amended).
 * They sit beside the component matrix, as the palette fixtures do: `SpTimeline` has no `ui/`
 * subpath, and the example apps draw it from T-222.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate timeline-canonical   (writes fixtures/timeline)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { timelineView, type SpTimelineProps } from '@silverpoint/core/timeline';
import { resolveUi } from '@silverpoint/core/ui';
import { TIMELINE_DEMO } from '@silverpoint/core/ui-demos';
import { normalizeUi } from '../svg-normalizer/normalize';
import { serializeUi } from './ui-canonical';
import { GROUND_SUBSTRATES } from './ui-matrix';

export interface TimelineFixture {
  /** `timeline--surface--<ground>--<substrate>--<mode>`: its files' name. */
  readonly id: string;
  readonly component: 'timeline';
  readonly state: 'surface';
  readonly req: 'REQ-513';
  readonly ground: string;
  readonly substrate: string;
  readonly mode: 'ink' | 'precision';
  readonly scope: 'pr' | 'nightly';
  readonly canonical: string;
}

const PR_GROUNDS = new Set(['silverpoint/cream', 'cyanotype/prussian']);

export function timelineMatrix(): TimelineFixture[] {
  return GROUND_SUBSTRATES.flatMap(({ ground, substrate }) =>
    (['ink', 'precision'] as const).map((mode) => {
      const id = ['timeline', 'surface', ground, substrate, mode].join('--');
      const scope = PR_GROUNDS.has(`${ground}/${substrate}`) ? ('pr' as const) : ('nightly' as const);
      return { id, component: 'timeline' as const, state: 'surface' as const, req: 'REQ-513' as const, ground, substrate, mode, scope, canonical: `ui/${id}.canonical.txt` };
    }),
  );
}

/** The fixture's props: the demo data on the fixture's ground, substrate and mode. */
export function timelineFixtureProps(fixture: TimelineFixture): SpTimelineProps {
  return { data: TIMELINE_DEMO, ground: fixture.ground, substrate: fixture.substrate, mode: fixture.mode } as SpTimelineProps;
}

/** The canonical markup: the core's view, serialised. */
export function timelineCanonicalMarkup(fixture: TimelineFixture): string {
  const props = timelineFixtureProps(fixture);
  return serializeUi(timelineView(props, resolveUi(props, {})), {});
}

/** The committed form: the normalised tree. */
export const timelineCanonicalFor = (fixture: TimelineFixture): string => normalizeUi(timelineCanonicalMarkup(fixture));

// The fixtures directory is read here only: adapter tests import this module under happy-dom.
if (process.argv[1]?.endsWith('timeline-fixtures.ts')) {
  const { FIXTURES_DIR } = await import('./fixtures');
  const dir = join(FIXTURES_DIR, 'timeline');
  mkdirSync(dir, { recursive: true });
  const matrix = timelineMatrix();
  for (const fixture of matrix) {
    writeFileSync(join(dir, `${fixture.id}.timeline.json`), `${JSON.stringify(fixture, null, 2)}\n`);
    writeFileSync(join(FIXTURES_DIR, fixture.canonical), timelineCanonicalFor(fixture));
  }
  console.log(`timeline-fixtures · wrote ${matrix.length} fixtures`);
}
