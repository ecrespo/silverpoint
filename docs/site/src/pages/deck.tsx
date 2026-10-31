import '@silverpoint/marp/deck.css';
import { DECK_DIRECTIVES, THEME_CLASSES } from '@silverpoint/marp';
import { DECK_DEMO } from '@silverpoint/marp/demo';
import { SpDeck } from '@silverpoint/react/deck';
import reference from '../../generated/props.json';
import { PropsTable } from './ui';

const STYLES = `import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import '@silverpoint/grounds/ui.css';
import '@silverpoint/marp/deck.css';`;

const REACT = `import { SpDeck } from '@silverpoint/react/deck';
import markdown from './talk.md?raw';

export function Talk() {
  const [page, setPage] = useState(1);
  return <SpDeck markdown={markdown} page={page} onPageChange={({ page }) => setPage(page)} showNotes />;
}`;

const VUE = `<script setup lang="ts">
import { ref } from 'vue';
import { SpDeck } from '@silverpoint/vue/deck';
import markdown from './talk.md?raw';
const page = ref(1);
</script>

<template>
  <SpDeck :markdown="markdown" v-model:page="page" show-notes />
</template>`;

const ANGULAR = `import { Component, signal } from '@angular/core';
import { SpDeckComponent } from '@silverpoint/angular/deck';

@Component({
  selector: 'app-talk',
  imports: [SpDeckComponent],
  template: \`<sp-deck [markdown]="markdown" [page]="page()" (pageChange)="page.set($event.page)" [showNotes]="true" />\`,
})
export class Talk {
  protected readonly markdown = TALK;
  protected readonly page = signal(1);
}`;

const SLIDES = `---
ground: silverpoint
substrate: cream
paginate: true
footer: Quarterly review
---

<!-- _class: lead -->

# Quarterly review

---

## What changed

* Direct visits grew
* Search fell back

<!-- A speaker note: shown under the slide when showNotes is on. -->`;

const DIRECTIVES = `<!-- _ground: cyanotype -->
<!-- _mode: precision -->

## One slide in cyanotype, drawn with exact strokes`;

const FENCE = `## Visits by quarter

\`\`\`silverpoint
{"chart":"bar-chart","props":{"title":"Visits by quarter"},"height":400}
\`\`\``;

const CLASSES: Readonly<Record<string, string>> = {
  lead: 'A title slide: the content centred, the heading larger, one rule under it.',
  invert: "Light text on the substrate darkened to the ground's ink, its contrast computed per ground.",
  plate: 'An inked plate mark, a double rule inset from the edge, behind the content.',
  hatched: 'An inked hatched band around the slide, behind the content.',
};

/** Marp decks in silverpoint: the demo deck, usage, the authoring guide, Marp CLI and SSR (REQ-626, REQ-627). */
export function DeckPage() {
  return (
    <>
      <h2>Decks</h2>
      <p>
        A deck is Marp Markdown drawn as silverpoint slides: the <code>silverpoint</code> theme, the grounds and substrates as
        directives, and live charts from <code>silverpoint</code> fences. Click the deck, then use the arrow keys; <code>o</code>{' '}
        opens the overview and <code>n</code> the notes.
      </p>
      <div className="deck-sample">
        <SpDeck id="docs-deck" markdown={DECK_DEMO} label="silverpoint, presented by itself" />
      </div>

      <h3>Install and use</h3>
      <p>
        <code>@silverpoint/marp</code> carries the engine and Marpit. It is an optional peer of the adapters: install it beside
        yours, and import the four stylesheets in this order.
      </p>
      <pre>
        <code>npm install @silverpoint/marp</code>
      </pre>
      <pre>
        <code>{STYLES}</code>
      </pre>
      <h4>React</h4>
      <pre>
        <code>{REACT}</code>
      </pre>
      <h4>Vue</h4>
      <pre>
        <code>{VUE}</code>
      </pre>
      <h4>Angular</h4>
      <p>
        <code>pageChange</code> carries <code>{'{ page, total }'}</code>, so bind the page with <code>[page]</code> and set it from the event. List
        the stylesheets in the <code>styles</code> array of <code>angular.json</code>.
      </p>
      <pre>
        <code>{ANGULAR}</code>
      </pre>

      <h3>Writing a deck</h3>
      <p>
        Slides are separated by <code>---</code>. The front matter sets the deck's directives; a comment holding{' '}
        <code>key: value</code> sets one from that slide on, and the <code>_key</code> form sets it on that slide only. Any other
        comment is a speaker note. Each list item is a fragment, revealed one step at a time; print shows them all.
      </p>
      <pre>
        <code>{SLIDES}</code>
      </pre>
      <p>
        Headings, paragraphs, lists, tables, quotes, code and images are styled by the theme; code is set in EB Garamond on a
        framed plate. Marpit's images keep working, split backgrounds (<code>![bg right:40%](photo.jpg)</code>) included. Markdown's raw HTML
        is never rendered: it shows as text, and <code>javascript:</code> URLs are dropped.
      </p>
      <h4 id="deck-directives">Directives</h4>
      <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="deck-directives">
        <table className="props">
          <thead>
            <tr>
              <th scope="col">Directive</th>
              <th scope="col">Values</th>
              <th scope="col">Default</th>
              <th scope="col">Written as</th>
            </tr>
          </thead>
          <tbody>
            {DECK_DIRECTIVES.map((d) => (
              <tr key={d.name}>
                <th scope="row">
                  <code>{d.name}</code>
                </th>
                <td>{d.values === 'per-ground' ? "one of the slide's ground's substrates" : d.values.join(', ')}</td>
                <td>
                  <code>{d.default}</code>
                </td>
                <td>
                  <code>{d.attribute}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        An unknown value, or a substrate of another ground, warns <code>SP027</code> with the closest names and keeps the inherited
        value. A fence chart takes its slide's ground, substrate and mode.
      </p>
      <pre>
        <code>{DIRECTIVES}</code>
      </pre>
      <h4 id="deck-classes">Classes</h4>
      <div className="table-scroll" tabIndex={0} role="region" aria-labelledby="deck-classes">
        <table className="props">
          <thead>
            <tr>
              <th scope="col">Class</th>
              <th scope="col">What it does</th>
            </tr>
          </thead>
          <tbody>
            {THEME_CLASSES.map((c) => (
              <tr key={c}>
                <th scope="row">
                  <code>{c}</code>
                </th>
                <td>{CLASSES[c]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h4>The chart fence</h4>
      <p>
        A <code>```silverpoint</code> block holds one chart as JSON — <code>chart</code>, and optionally <code>props</code>,{' '}
        <code>data</code>, <code>width</code>, <code>height</code>, <code>id</code>, <code>ground</code>, <code>substrate</code>,{' '}
        <code>mode</code>, <code>palette</code> — the input of the MCP <code>render_chart</code> tool. It is drawn as static SVG and
        hydrated in the browser. A fence that is not JSON, names an unknown chart or prop, or asks for a size out of range draws an
        error figure in its place and warns <code>SP026</code>; every other slide is unaffected.
      </p>
      <pre>
        <code>{FENCE}</code>
      </pre>

      <h3 id="deck-props">Its props</h3>
      <PropsTable className="props" labelledBy="deck-props" props={reference.deck} />
      <p>
        Its events are <code>pageChange</code>, <code>fragmentChange</code> and <code>ready</code>: React <code>onPageChange</code>…,
        Vue <code>@page-change</code>…, Angular <code>(pageChange)</code>….
      </p>

      <h3>Server rendering</h3>
      <p>
        The server sends the current slide, its static charts and the controls; the browser adopts that markup, adds the
        controller and hydrates the charts. In Next.js's App Router, a component that holds the page in state needs{' '}
        <code>'use client'</code>; the deck still renders on the server. Vue renders it with <code>@vue/server-renderer</code>, and
        Angular with <code>@angular/ssr</code>. With <code>interactive</code> set to <code>false</code> the charts stay static SVG.
      </p>

      <h3>Marp CLI and VS Code</h3>
      <p>
        The theme also ships as a plain stylesheet carrying both grounds, <code>@silverpoint/marp/theme.css</code>. Pass it to Marp
        CLI with <code>--theme</code>, or add it to the <code>markdown.marp.themes</code> setting of the Marp VS Code extension.
        There, some things degrade: there are no generated backdrops, a fence is shown as code, and there is no controller.
      </p>
      <pre>
        <code>npx @marp-team/marp-cli --theme node_modules/@silverpoint/marp/theme.css talk.md</code>
      </pre>
      <p>Marp CLI with the deck's own engine draws the directives, the backdrops and the fences as static SVG:</p>
      <pre>
        <code>npx @marp-team/marp-cli --engine @silverpoint/marp/cli talk.md</code>
      </pre>
    </>
  );
}
