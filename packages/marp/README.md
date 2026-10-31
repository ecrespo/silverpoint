# @silverpoint/marp

Marp Markdown slide decks in the silverpoint style. The `silverpoint` theme draws a deck on the
library's grounds and substrates, its directives move a slide to another ground or to `precision`
mode, and `silverpoint` fences become real charts: static SVG on the server, hydrated in the browser.

Most apps never import this package directly. They render `SpDeck` from their adapter, and this
package is the adapter's optional peer, which carries the engine and Marpit.

| Entry | What it is | Runs in |
|---|---|---|
| `@silverpoint/marp` | The engine (`createDeckEngine`), the directives and theme classes as data, the view and markup helpers, the pure controller. No DOM. | Node, browser, workers |
| `@silverpoint/marp/client` | The DOM bindings the adapters use: scaling, keys, swipe, fragments, hydration (`attachDeck`). | Browser |
| `@silverpoint/marp/cli` | An engine for Marp CLI's `--engine`. | Node |
| `@silverpoint/marp/demo` | `DECK_DEMO`, a deck presenting silverpoint. | Anywhere |
| `@silverpoint/marp/deck.css` | The deck's stylesheet: the slide box, the controls, the overview, print. | Browser |
| `@silverpoint/marp/theme.css` | The theme as a plain stylesheet, for Marp CLI and VS Code. | Marp |

## Install

```sh
npm install @silverpoint/marp @silverpoint/react   # or @silverpoint/vue, @silverpoint/angular
```

Import the stylesheets in this order. React and Vue import them in the entry file; Angular lists them
in the `styles` array of `angular.json`.

```ts
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import '@silverpoint/marp/deck.css';
```

## Usage

React, from `@silverpoint/react/deck`:

```tsx
import { useState } from 'react';
import { SpDeck } from '@silverpoint/react/deck';
import markdown from './talk.md?raw';

export function Talk() {
  const [page, setPage] = useState(1);
  return <SpDeck markdown={markdown} page={page} onPageChange={({ page }) => setPage(page)} showNotes />;
}
```

Vue, from `@silverpoint/vue/deck`:

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { SpDeck } from '@silverpoint/vue/deck';
import markdown from './talk.md?raw';
const page = ref(1);
</script>

<template>
  <SpDeck :markdown="markdown" v-model:page="page" show-notes />
</template>
```

Angular, from `@silverpoint/angular/deck` (`page` is a signal input, so `[(page)]` binds both ways):

```ts
import { Component, signal } from '@angular/core';
import { SpDeckComponent } from '@silverpoint/angular/deck';

@Component({
  selector: 'app-talk',
  imports: [SpDeckComponent],
  template: `<sp-deck [markdown]="markdown" [(page)]="page" [showNotes]="true" />`,
})
export class Talk {
  protected readonly markdown = TALK;
  protected readonly page = signal(1);
}
```

`SpDeck` takes `markdown`, the page (`page` with `pageChange`, or `defaultPage`), `ground`,
`substrate`, `mode`, `palette`, `size` (`16:9` or `4:3`), `showNotes`, `showControls`, `keyboard`,
`swipe`, `hash` (a `#<n>` deep link) and `interactive`. It emits `pageChange`, `fragmentChange` and
`ready`. With focus in the deck, the arrows, `PageUp`/`PageDown`, `Space`, `Home` and `End` move it;
`o` opens the overview, `f` full screen and `n` the notes.

### Server rendering

The server sends the current slide, its static charts and the controls; the browser adopts that
markup, adds the controller and hydrates the charts, with no mismatch.

- **Next.js:** `SpDeck` renders in the App Router; a component that holds the page in state needs
  `'use client'`, and the deck is still rendered on the server.
- **Vue:** `@vue/server-renderer` renders it; hydration adopts it.
- **Angular:** `@angular/ssr` renders it; hydration adopts it.

With `interactive` set to `false`, the charts stay static SVG. Print lays every slide out at its own
size, every fragment shown, the controls hidden.

### Without a framework

The engine is pure: the same Markdown, options and id give the same render, on the server and in the
browser.

```ts
import { createDeckEngine } from '@silverpoint/marp';

const deck = createDeckEngine({ id: 'talk', ground: 'silverpoint' }).render(markdown);
deck.slides; // per slide: its HTML, notes, fragment count, ground, substrate, mode, classes
deck.css; // the theme, scoped to the deck's id
deck.diagnostics; // SP026, SP027, SP029, … with their slide
```

## Writing a deck

Slides are separated by `---`. The front matter sets the deck's directives. A comment holding
`key: value` sets one from that slide on, and the `_key` form sets it on that slide only. Any other
comment is a speaker note. Each list item is a fragment, revealed a step at a time.

```markdown
---
ground: silverpoint
substrate: cream
paginate: true
---

<!-- _class: lead -->

# Quarterly review

---

<!-- _ground: cyanotype -->

## What changed

* Direct visits grew
* Search fell back

<!-- A speaker note. -->
```

| Directive | Values | Default |
|---|---|---|
| `ground` | `silverpoint`, `cyanotype` | `silverpoint` |
| `substrate` | one of the slide's ground's substrates (`cream`, `green`, `blue`, `ochre`; `prussian`) | the ground's first |
| `mode` | `ink`, `precision` | `ink` |

An unknown value, or a substrate of another ground, warns `SP027` with the closest names and keeps the
inherited value. Marpit's own directives (`theme`, `class`, `paginate`, `header`, `footer`,
`backgroundColor`, `backgroundImage`, `color`, `size`, `headingDivider`, `lang`) keep their meaning,
and so do its images: `![bg](…)`, split backgrounds (`![bg right:40%](…)`), sizing and filters.

| Class | Effect |
|---|---|
| `lead` | A title slide: the content centred, the heading larger, one rule under it. |
| `invert` | Light text on the substrate darkened to the ground's ink; its contrast computed per ground. |
| `plate` | An inked plate mark, a double rule inset from the edge, behind the content. |
| `hatched` | An inked hatched band around the slide, behind the content. |

Raw HTML is never rendered: it shows as text, and `javascript:` and non-image `data:` URLs are
dropped. A deck holds up to 512 KB, 300 slides and 60 fences; past a limit it renders up to it and
warns `SP029`.

### The chart fence

A ```` ```silverpoint ```` block holds one chart as JSON: `chart` (a catalog slug) and, optionally,
`props`, `data`, `width` (160..1280), `height` (90..720, default 360), `id`, `ground`, `substrate`,
`mode` and `palette` — the input of the MCP `render_chart` tool. It takes its slide's ground,
substrate and mode unless it names its own.

````markdown
## Visits by quarter

```silverpoint
{"chart":"bar-chart","props":{"title":"Visits by quarter"},"height":400}
```
````

A fence that is not JSON, names an unknown chart or prop, or asks for a size out of range draws a
visible error figure in its place and warns `SP026` with the closest names; every other slide and fence
renders as usual.

## Marp CLI and VS Code

`@silverpoint/marp/theme.css` carries both grounds as a plain Marp theme.

```sh
npx @marp-team/marp-cli --theme node_modules/@silverpoint/marp/theme.css talk.md
```

In the Marp VS Code extension, add the file to the `markdown.marp.themes` setting. There, and in
Marp CLI with `--theme`, some things degrade: there are no generated backdrops (`plate` and `hatched`
draw no ink), a fence is shown as code, and there is no controller.

With the deck's own engine, Marp CLI draws the directives, the backdrops and the fences as static SVG:

```sh
npx @marp-team/marp-cli --engine @silverpoint/marp/cli talk.md
```

## Agents

The silverpoint MCP server (`@silverpoint/mcp`) checks a deck with `validate_deck`, renders it as a
standalone document with `render_deck`, and writes the `SpDeck` code with `generate_code`. The
`silverpoint` skill carries the same guide in `references/deck.md`.

## License

MIT
