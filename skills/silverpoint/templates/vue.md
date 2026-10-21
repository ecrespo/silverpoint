# Vue

```sh
npm install @silverpoint/vue @silverpoint/grounds @silverpoint/fonts
```

Vue 3. Import the stylesheets once, in `main.ts`, and set the application's defaults with the
plugin:

```ts vue
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import { provideSilverpoint } from '@silverpoint/vue';
import { createApp, h } from 'vue';

createApp({ render: () => h('main') })
  .use(provideSilverpoint({ ground: 'silverpoint', substrate: 'cream' }))
  .mount('#app');
```

## Names and props

Every component is `Sp<Name>`: `SpLineChart`, `SpModal`. Each one is imported from its own subpath,
`@silverpoint/vue/line-chart` or `@silverpoint/vue/ui/modal`. Props are the same camelCase names as
in React. In a template, write them in kebab-case (`x-key`, `value-key`) and bind non-strings with
`:` (`:data="rows"`, `:height="240"`).

- Values: `v-model`. Open state: `v-model:open`. Pagination: `v-model:current`.
- Events: `@active-change`, `@select`, `@root-change`, `@sort`, `@toggle`.
- Content: slots `trigger`, `footer`, `extra`, `prefix`, `suffix`, `action`, `fallback`, `tooltip`.
- A section of the page: `<SilverpointProvider :palette="sepia">`. It renders no element of its
  own.
- Server rendering works with `@vue/server-renderer`. Nuxt is not a validated integration.

## Example

<!-- generated:vue-example -->
