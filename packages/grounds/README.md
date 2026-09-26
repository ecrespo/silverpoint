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

See [`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react),
[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) and
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) for usage.

MIT.
