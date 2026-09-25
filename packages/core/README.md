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

The geometry of the data is exact: the ground's hand-drawn inking only touches strokes that
carry no data, and it is deterministic for a given seed.

See [`@silverpoint/react`](https://www.npmjs.com/package/@silverpoint/react),
[`@silverpoint/vue`](https://www.npmjs.com/package/@silverpoint/vue) and
[`@silverpoint/angular`](https://www.npmjs.com/package/@silverpoint/angular) for usage, and the
[repository](https://github.com/ecrespo/silverpoint) for the specifications.

MIT.
