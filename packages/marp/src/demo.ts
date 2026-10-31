/**
 * `@silverpoint/marp/demo` (T-286, REQ-626): a deck presenting silverpoint itself, which the example
 * apps and the docs site draw on their `/deck` page. On its own subpath, so no other entry carries it.
 */

/** A hatched ochre plate, 512×720, for the split background: a raster `data:` image (REQ-575). */
const PLATE = 'data:image/png;base64,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JEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJqoCZCkiRZkmqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZKrBmoiJEmSIakGSpIkqQZqIiRJkiWpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkGZVqoCRJklGpBkqSJBmVaqAkSZJRqQZKkiQZlWqgJEmSUakGSpIkuWqgJkKSJBmSaqAkSZJR+Q2J4ozt+hrs6wAAAABJRU5ErkJggg==';

/**
 * The demo deck: charts from fences, fragments, notes, a split background, a `precision` slide and a
 * `cyanotype` slide. Its first two slides are the `/deck` page's bench: a donut on slide 1, three
 * fragments on slide 2.
 */
export const DECK_DEMO: string = [
  '---',
  'paginate: true',
  'footer: silverpoint',
  '---',
  '',
  '# Charts drawn like silverpoint',
  '',
  '<!-- Open with the share of each channel: the donut is a live chart, hover it. -->',
  '',
  '```silverpoint',
  '{"chart":"donut-chart","props":{"title":"Share by channel"}}',
  '```',
  '',
  '---',
  '',
  '## Three things to know',
  '',
  '* Every chart is hatched tone and a hand-inked line',
  '* The same props draw the same SVG, on the server and in the browser',
  '* React, Vue and Angular share one engine',
  '',
  '<!-- Reveal the points one at a time. -->',
  '',
  '---',
  '',
  '![bg right:40%](' + PLATE + ')',
  '',
  '## Prepared paper',
  '',
  'A ground is the paper a chart is drawn on: its substrate, its inks and its rules.',
  '',
  'Marpit\'s backgrounds still work: this one is split to the right.',
  '',
  '---',
  '',
  '<!-- _mode: precision -->',
  '',
  '## Precision mode',
  '',
  '```silverpoint',
  '{"chart":"line-chart","props":{"title":"Visits, drawn with exact strokes"},"height":400}',
  '```',
  '',
  '---',
  '',
  '<!-- _ground: cyanotype -->',
  '',
  '## The cyanotype ground',
  '',
  '```silverpoint',
  '{"chart":"bar-chart","props":{"title":"Visits by quarter"},"height":400}',
  '```',
  '',
  '<!-- One directive moves a slide to another ground; its charts follow. -->',
  '',
  '---',
  '',
  '<!-- _class: lead -->',
  '',
  '# Thank you',
  '',
  'silverpoint · Marp decks in React, Vue and Angular',
].join('\n');
