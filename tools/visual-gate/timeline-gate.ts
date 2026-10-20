/**
 * The timeline gate (T-222, REQ-516): every adapter server-renders every Timeline `surface`
 * fixture over the published builds, and is compared with the fixture's committed canonical render.
 * The server never imports TimelineJS: what is compared is the surface, its probes and an empty mount.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate timeline-gate   (after `pnpm build`)
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareUi } from '../svg-normalizer/normalize';
import { FIXTURES_DIR } from './fixtures';
import { ADAPTERS, markupOf, type Adapter, type GateResult } from './string-gate';
import { timelineFixtureProps, type TimelineFixture } from './timeline-fixtures';

export function loadTimelineFixtures(): TimelineFixture[] {
  const dir = join(FIXTURES_DIR, 'timeline');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.timeline.json'))
    .map((name) => JSON.parse(readFileSync(join(dir, name), 'utf8')) as TimelineFixture)
    .sort((a, b) => (a.id < b.id ? -1 : 1));
}

/** Server renderers of `SpTimeline` over the published builds, each as its consumers write it. */
async function timelineRenderers(): Promise<Readonly<Record<Adapter, (fixture: TimelineFixture) => Promise<string>>>> {
  await import('@angular/compiler');
  const { Component } = await import('@angular/core');
  const { bootstrapApplication } = await import('@angular/platform-browser');
  const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
  const { SpTimeline: AngularTimeline } = await import('@silverpoint/angular/timeline');
  const { SpTimeline: ReactTimeline } = await import('@silverpoint/react/timeline');
  const { SpTimeline: VueTimeline } = await import('@silverpoint/vue/timeline');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createSSRApp, h } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  return {
    async react(fixture) {
      return renderToStaticMarkup(createElement(ReactTimeline, timelineFixtureProps(fixture)));
    },
    async vue(fixture) {
      return renderToString(createSSRApp({ render: () => h(VueTimeline, { ...timelineFixtureProps(fixture) }) }));
    },
    async angular(fixture) {
      const props = timelineFixtureProps(fixture);
      const Host = Component({
        selector: 'app-root',
        imports: [AngularTimeline],
        template: '<sp-timeline [data]="data" [ground]="ground" [substrate]="substrate" [mode]="mode" />',
      })(
        class {
          constructor() {
            Object.assign(this, props);
          }
        },
      );
      return renderApplication((context) => bootstrapApplication(Host, { providers: [provideServerRendering()] }, context), {
        document: '<html><head></head><body><app-root></app-root></body></html>',
      });
    },
  };
}

export async function runTimelineGate(fixtures: readonly TimelineFixture[]): Promise<GateResult[]> {
  const renderers = await timelineRenderers();
  const results: GateResult[] = [];
  for (const fixture of fixtures) {
    const expected = markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8'));
    for (const adapter of ADAPTERS as readonly Adapter[]) {
      try {
        const comparison = compareUi(await renderers[adapter](fixture), expected);
        results.push(comparison.equal ? { fixture: fixture.id, adapter, equal: true } : { fixture: fixture.id, adapter, ...comparison });
      } catch (error) {
        results.push({ fixture: fixture.id, adapter, equal: false, difference: `render failed: ${(error as Error).message}` });
      }
    }
  }
  return results;
}

async function main(): Promise<void> {
  const results = await runTimelineGate(loadTimelineFixtures());
  for (const r of results) console.log(`${r.equal ? 'ok   ' : 'FAIL '} ${r.adapter.padEnd(8)} ${r.fixture}${r.equal ? '' : `\n      ${r.difference}`}`);
  const failed = results.filter((r) => !r.equal).length;
  console.log(`timeline-gate · ${results.length} comparisons · ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('timeline-gate.ts')) void main();
