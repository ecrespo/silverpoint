# Timeline

`SpTimeline` is a skin over TimelineJS: its slides, eras and navigation, drawn in the ground's
frames and type. TimelineJS is an **optional peer**. Install it yourself before you import the
`timeline` subpath, or the build cannot resolve it:

```sh
npm install @knight-lab/timelinejs@^3.9.13
```

Import TimelineJS's stylesheet before silverpoint's:
`@knight-lab/timelinejs/dist/css/timeline.css`, then `@silverpoint/grounds/timeline.css`.

- `data` is TimelineJS's JSON: `title`, `events`, `eras`, `scale`. The component builds TimelineJS on
  a copy, so your object is never changed.
- TimelineJS loads on the client only. If it fails to load, the `fallback` (React prop, Vue slot,
  Angular `<ng-template spFallback>`) is shown and `SP025` is warned.
- `options` passes TimelineJS options through, except `font` and `theme`, which the ground sets.
- `height` is a CSS length (`'600px'` by default). Anything else is dropped with `SP017`.
- Its events are `change` (the slide's `unique_id`), `loaded`, `navNext`, `navPrevious`, `zoomIn`,
  `zoomOut` and `backToStart`: React `onChange`…, Vue emits, Angular outputs.

<!-- generated:timeline -->

```tsx
import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
import { SpTimeline } from '@silverpoint/react/timeline';

const data = {
  title: { text: { headline: 'Releases' } },
  events: [
    { start_date: { year: 2026, month: 9, day: 26 }, text: { headline: '0.2.0', text: 'The dashboard.' } },
    { start_date: { year: 2026, month: 10, day: 1 }, text: { headline: '0.3.0', text: 'UI components.' } },
  ],
};

export function Releases() {
  return <SpTimeline data={data} height="480px" label="Release history" fallback={<p>The timeline could not load.</p>} />;
}
```
