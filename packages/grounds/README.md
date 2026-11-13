# @silverpoint/grounds

The style *grounds* of **silverpoint**, meaning the prepared substrate, the inks and the hand
drawing, together with the stylesheet that colours every chart. Two ship, both registered by
default:

| Ground | Tone is built by | Substrates |
|---|---|---|
| `silverpoint` (default) | Hatching, drawn by hand (`RoughInker`) | `cream`, `green`, `blue`, `ochre` |
| `cyanotype` | The weight of an exact white line on Prussian blue (`WeightInker`); nothing is hatched | `prussian` |

```tsx
<BarChart ground="cyanotype" />
```

## Installation

Install it next to the adapter for your framework:

```sh
npm install @silverpoint/react @silverpoint/grounds    # or @silverpoint/vue, @silverpoint/angular
```

Then import the stylesheet **once**, at the root of the app:

```ts
import '@silverpoint/grounds/styles.css';
```

In Angular, put it in `src/styles.css`:

```css
@import '@silverpoint/grounds/styles.css';
```

The packages declare `sideEffects: false` except for `.css`, so no bundler drops this import.

Two more stylesheets ship beside it, each imported once and only if you use what it styles:

| Stylesheet | Styles |
|---|---|
| `@silverpoint/grounds/ui.css` | The 38 UI components: frames, tones, focus ring, overlays |
| `@silverpoint/grounds/timeline.css` | `SpTimeline`; import it after TimelineJS's own stylesheet |

```ts
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import '@knight-lab/timelinejs/dist/css/timeline.css';
import '@silverpoint/grounds/timeline.css';
```

## A chart as a standalone SVG file

A chart's `toSVGString()` (the handle of every adapter) returns the canonical markup. Its strokes and
fills are painted by `styles.css` through `--sp-*` properties, so the markup saved as it is has no
colours when opened on its own. `standaloneSVG` puts the stylesheet inside the root `<svg>`, in
CDATA, and `@silverpoint/grounds/styles-text` is `styles.css` as a string that every bundler imports
without loader attributes, `?raw` or prebundle settings:

```ts
import { standaloneSVG } from '@silverpoint/grounds';
import groundStyles from '@silverpoint/grounds/styles-text';

const file = standaloneSVG(chart.toSVGString(), groundStyles);
```

## Re-theming with CSS

Every stroke carries a `part` attribute bound to a public custom property. Overriding a property
re-themes the charts without re-rendering them:

```css
.sp-ground-silverpoint[data-substrate='cream'] {
  --sp-ink: #4d525a;
  --sp-ink-secondary: #6b5a45;
  --sp-font-display: 'EB Garamond', Georgia, serif;
}
```

Public properties: `--sp-substrate`, `--sp-ink`, `--sp-ink-secondary`, `--sp-heighten`,
`--sp-rule`, `--sp-grid`, `--sp-text`, `--sp-text-muted`, `--sp-font-display`,
`--sp-stroke-width`, `--sp-hatch-gap`, `--sp-radius`, and under `cyanotype` the line weights of
its four tonal levels, `--sp-weight-1` to `--sp-weight-4` (times `--sp-stroke-width`). The palette
is computed for WCAG contrast, so check the contrast again if you change an ink.

To recolour from code instead, pass a palette: the six presets on `@silverpoint/core/palettes`
(`sanguine`, `sepia`, `ironGall`, `verdigris`, `indigo` and the ground's own `silverpoint`) set these
same properties, and `checkPalette` checks the contrast of one of yours.

See [`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react),
[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) and
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) for usage.

MIT.
