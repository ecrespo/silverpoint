import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
import { TIMELINE_PAGE } from '@silverpoint/example-harness';
import { SpTimeline } from '@silverpoint/react/timeline';
import { Hydrated } from '../hydrated';

/** The timeline page (T-222): the surface is server-rendered; TimelineJS is imported and built after hydration. */
export default function TimelinePage() {
  return (
    <main>
      <h1>{TIMELINE_PAGE.title} · Next.js (React)</h1>
      <div className="sp-timeline-page sp-ground-silverpoint" data-substrate="cream">
        <SpTimeline {...TIMELINE_PAGE.timeline} fallback={<p>{TIMELINE_PAGE.fallback}</p>} />
      </div>
      <Hydrated />
    </main>
  );
}
