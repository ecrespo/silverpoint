# @silverpoint/core

The framework-free engine of **silverpoint**: the geometry, scales, interaction and types behind
every chart. The charts themselves are rendered by the adapters, and this package holds no DOM
code and no framework code.

You rarely install it by hand, because every adapter depends on it:

| Framework | Install |
|---|---|
| React | `npm install @silverpoint/react @silverpoint/grounds @silverpoint/fonts` |
| Vue | `npm install @silverpoint/vue @silverpoint/grounds @silverpoint/fonts` |
| Angular | `npm install @silverpoint/angular @silverpoint/grounds @silverpoint/fonts` |

Install it directly when you need its types in your own code:

```sh
npm install @silverpoint/core
```

```ts
import type { ActiveItem, ProviderConfig, SubstrateName } from '@silverpoint/core';

export const config: ProviderConfig = { ground: 'silverpoint', substrate: 'cream', mode: 'ink' };
export const substrates: SubstrateName[] = ['cream', 'green', 'blue', 'ochre'];
export const describe = (item: ActiveItem) => `${item.seriesKey} #${item.index}: ${item.value}`;
```

The recipes of the second catalog — the histogram, the box plot, the sunburst, the network and the
rest of the 27 charts added in `0.6.0` — are on their own entry, `@silverpoint/core/catalog`, so the main entry
stays small; their props types are in the main entry with every other chart's.

Three more entries hold what only some applications need:

| Entry | Holds |
|---|---|
| `@silverpoint/core/ui` | The views of the 38 UI components, their catalog and their types |
| `@silverpoint/core/palettes` | The six palette presets, `checkPalette` and `contrastRatio` |
| `@silverpoint/core/timeline` | What `SpTimeline` shares across adapters: its surface, its inking of TimelineJS, the types of TimelineJS's JSON |

```ts
import { checkPalette, sanguine } from '@silverpoint/core/palettes';

export const findings = checkPalette({ ...sanguine, ink: '#5A1F14' });
```

The geometry of the data is exact: the ground's hand-drawn inking only touches strokes that
carry no data, and it is deterministic for a given seed.

See [`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react),
[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) and
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) for usage, and the
[repository](https://github.com/ecrespo/silverpoint) for the specifications.

MIT.
