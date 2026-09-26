# @silverpoint/tailwind

**Optional.** A Tailwind preset for [silverpoint](https://github.com/ecrespo/silverpoint): it names
the charts' public `--sp-` variables as theme tokens, so the rest of your page can use the ink, the
substrate and the typeface of the ground your charts are drawn on.

silverpoint never requires Tailwind. This package has no dependencies and no peers, not even
Tailwind, and nothing else depends on it.

```sh
npm install @silverpoint/tailwind
```

## Tailwind 4

```css
@import 'tailwindcss';
@import '@silverpoint/grounds/styles.css';
@import '@silverpoint/tailwind/theme.css';
```

## Tailwind 3.4

```js
// tailwind.config.js
import silverpoint from '@silverpoint/tailwind';

export default {
  content: ['./src/**/*.{html,js,jsx,ts,tsx,vue}'],
  presets: [silverpoint],
};
```

`require('@silverpoint/tailwind')` works too.

## Utilities

| Utilities | Token | Reads |
|---|---|---|
| `bg-`, `text-`, `border-`, `ring-` … | `sp-substrate`, `sp-ink`, `sp-ink-secondary`, `sp-heighten`, `sp-rule`, `sp-grid`, `sp-text`, `sp-text-muted` | `var(--sp-<token>)` |
| `font-sp-display` | | `var(--sp-font-display)` |
| `rounded-sp` | | `var(--sp-radius)` |

```html
<section class="sp-ground-cyanotype bg-sp-substrate text-sp-text font-sp-display rounded-sp p-4">
  <h2 class="border-b border-sp-rule">Operations</h2>
  <!-- charts … -->
</section>
```

The values stay in `@silverpoint/grounds`. A utility therefore takes the colour of the ground and
substrate it sits in (`silverpoint` or `cyanotype`), and a `--sp-` variable you override reaches it too.
The variables are declared on a chart's root, or on any element carrying `sp-ground-<name>` (and
`data-substrate` for `silverpoint`), as the example above does.

Under Tailwind 3.4 a variable colour takes no opacity modifier (`bg-sp-ink/50`); under Tailwind 4 it
does.

MIT.
