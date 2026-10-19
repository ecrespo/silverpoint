import { Component, type Type } from '@angular/core';
import { SpTimeline, SpTimelineFallback } from '@silverpoint/angular/timeline';
import { timelineView } from '@silverpoint/core/timeline';
import { resolveUi } from '@silverpoint/core/ui';
import { TIMELINE_DEMO } from '@silverpoint/core/ui-demos';
import { describe, expect, test, vi } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { serializeUi } from '../../../tools/visual-gate/ui-canonical';
import { timelineCanonicalMarkup, timelineFixtureProps, timelineMatrix } from '../../../tools/visual-gate/timeline-fixtures';
import { ssrHost } from './ui-fixture';

/*
 * Angular `<sp-timeline>` on the server (T-221; REQ-510, REQ-513): the core's surface, attribute for
 * attribute, with an empty mount; rendering it never imports TimelineJS.
 */

const imported = vi.hoisted(() => ({ count: 0 }));
vi.mock('@knight-lab/timelinejs/src/js/timeline/Timeline.js', () => {
  imported.count += 1;
  return { Timeline: class {} };
});

const host = (template: string, members: object = {}): Type<unknown> =>
  Component({ selector: 'app-root', imports: [SpTimeline, SpTimelineFallback], template })(
    class {
      readonly data = TIMELINE_DEMO;
      constructor() {
        Object.assign(this, members);
      }
    },
  );

describe('<sp-timeline> on the server (Angular)', () => {
  test('REQ-510 · REQ-513 · the server markup is the core’s surface, and rendering it imports nothing', async () => {
    const html = await ssrHost(host('<sp-timeline [data]="data" height="480px"><ng-template spFallback><p>offline</p></ng-template></sp-timeline>'));
    const props = { data: TIMELINE_DEMO, height: '480px' };
    expect(compareUi(html, serializeUi(timelineView(props, resolveUi({}, {})), {}))).toEqual({ equal: true });
    expect(html).not.toContain('offline');
    expect(imported.count).toBe(0);
  });

  test('REQ-516 · the 10 surface fixtures: the server markup is the canonical', async () => {
    for (const fixture of timelineMatrix()) {
      const props = timelineFixtureProps(fixture);
      const html = await ssrHost(host('<sp-timeline [data]="data" [ground]="ground" [substrate]="substrate" [mode]="mode" />', props));
      expect(compareUi(html, timelineCanonicalMarkup(fixture)), fixture.id).toEqual({ equal: true });
    }
  });
});
