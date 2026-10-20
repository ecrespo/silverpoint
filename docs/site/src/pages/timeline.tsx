import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
import { TIMELINE_DEMO } from '@silverpoint/core/ui-demos';
import { SpTimeline } from '@silverpoint/react/timeline';
import reference from '../../generated/props.json';
import { PropsTable } from './ui';

const USAGE = `import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
import { SpTimeline } from '@silverpoint/react/timeline';

<SpTimeline data={story} height="560px" />`;

/** TimelineJS drawn in the ground's hand: install, usage, a live timeline and its props (REQ-521). */
export function TimelinePage() {
  return (
    <>
      <h2>Timeline</h2>
      <p>
        <code>SpTimeline</code> hands TimelineJS's JSON to Knight Lab's library and inks what it draws: the ground's substrate
        and type, the hatched era bands, the frames. TimelineJS is an optional peer: install it beside silverpoint, and import
        its stylesheet before the ground's.
      </p>
      <pre>
        <code>npm install @knight-lab/timelinejs</code>
      </pre>
      <pre>
        <code>{USAGE}</code>
      </pre>
      <p>
        Vue imports the same name from <code>@silverpoint/vue/timeline</code>, Angular from <code>@silverpoint/angular/timeline</code>.
        The server renders the surface and an empty mount; TimelineJS builds in the browser.
      </p>
      <div className="sp-ground-silverpoint timeline-sample" data-substrate="cream">
        <SpTimeline id="docs-timeline" data={TIMELINE_DEMO} fallback={<p>The timeline could not be loaded: install @knight-lab/timelinejs.</p>} />
      </div>
      <h3 id="timeline-props">Its props</h3>
      <PropsTable className="props" labelledBy="timeline-props" props={reference.timeline} />
    </>
  );
}
