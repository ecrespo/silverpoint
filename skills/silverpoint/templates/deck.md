# Decks

A deck is Marp Markdown that renders as silverpoint slides: the `silverpoint` theme, its grounds and
substrates as directives, and real charts from `silverpoint` fences. `SpDeck` renders it in React, Vue
and Angular, on the server and in the browser, with a keyboard-driven controller; in Reflex, `sp_deck`
from `reflex-silverpoint-react` wraps the React one.

<!-- generated:deck-names -->

Install the peer beside the adapter (Reflex installs it for you):

```sh
npm install @silverpoint/marp@{{version}}
```

Import the stylesheets in this order: <!-- generated:deck-stylesheets -->. React and Vue import them in
the entry file. Angular lists them in the `styles` array of `angular.json`.

## Authoring

Slides are separated by `---` on a line of its own. The front matter sets the deck's directives. A
comment holding `key: value` sets a directive from that slide on, and the `_key` spot form sets it on
that slide only. Any other comment is a speaker note, shown under the slide when `showNotes` is on.

~~~markdown
---
ground: silverpoint
substrate: cream
paginate: true
footer: Quarterly review
---

<!-- _class: lead -->

# Quarterly review

The third quarter, in four slides.

---

## What changed

* Direct visits grew
* Search fell back
* Referrals held

<!-- Pause on the second point. -->
~~~

- Each list item is a **fragment**: the deck reveals them one step at a time. Print and a static
  render show every fragment.
- Headings, paragraphs, lists, tables, blockquotes, inline and block code, and images are styled by
  the theme. Code is set in EB Garamond with tabular figures, on a framed plate: there is no
  monospace.
- **Raw HTML is never rendered**: it shows as text. `javascript:` and non-image `data:` URLs are
  dropped. Do not reach for HTML to lay out a slide; use the classes and Marpit's image syntax.
- Marpit's image syntax works: `![bg](photo.jpg)`, split backgrounds (`![bg right:40%](photo.jpg)`),
  sizing and filters. The generated backdrop sits under them.
- Marpit's own directives keep their meaning: `theme`, `class`, `paginate`, `header`, `footer`,
  `backgroundColor`, `backgroundImage`, `color`, `size`, `headingDivider`, `lang`.
- A deck holds at most 512 KB, 300 slides and 60 chart fences. Past a limit it renders up to it and
  warns `SP029`.

## Directives

<!-- generated:deck-directives -->

A chart fence takes its slide's `ground`, `substrate` and `mode` unless its spec names its own. An
unknown value, or a substrate of another ground, warns `SP027` with the closest names and keeps the
inherited value.

~~~markdown
---
ground: silverpoint
---

# On cream paper

---

<!-- _ground: cyanotype -->
<!-- _mode: precision -->

# One slide in cyanotype, drawn with exact strokes

---

# Back on silverpoint
~~~

## Classes

Set with Marpit's `class` directive, or `_class` for one slide.

| Class | Effect |
|---|---|
| `lead` | A title slide: the content centred, the heading larger, one rule under it. |
| `invert` | Light text on the substrate darkened to the ground's ink; its contrast is computed per ground. |
| `plate` | An inked plate mark, a double rule inset from the edge, drawn behind the content. |
| `hatched` | An inked hatched band around the slide, drawn behind the content. |

~~~markdown
<!-- _class: plate -->

## A slide inside a plate mark

---

<!-- _class: hatched -->

## A slide with a hatched border

---

<!-- _class: invert -->

## A dark slide
~~~

## The chart fence

A fenced block whose info string is `silverpoint` holds one chart, as JSON: the input of the MCP
`render_chart` tool. The chart is drawn as static SVG where the fence was, and the deck hydrates it in
the browser, so it answers the pointer and the keys like any chart.

<!-- generated:deck-fence -->

~~~markdown
## Visits by quarter

```silverpoint
{"chart":"bar-chart","props":{"title":"Visits by quarter"},"height":400}
```
~~~

- `data` is what the chart reads, in the shape its reference names. Without it the chart draws its
  demo dataset: give real data in a real deck.
- `props` holds the chart's own props and the common view props. The fence's own keys (`data`,
  `width`, `height`, `id`, `ground`, `substrate`, `mode`, `palette`) go at the top level.
- A fence that is not JSON, names an unknown chart or prop, or asks for a size out of range draws a
  visible error figure in its place, warns `SP026` with the closest names, and leaves every other slide
  as it was.
- Inside a hydrated chart, the chart's keys win: the arrows move through its marks, not the deck.

## SpDeck

<!-- generated:deck-props -->

The page is 1-based. Bind `page` to the host's state and listen to `pageChange`, or give `defaultPage`
and let the deck hold it. A re-render with fewer slides clamps the page and reports it through
`pageChange`.

<!-- generated:deck-events -->

**Keys** (while focus is in the deck): `ArrowRight`, `ArrowDown`, `PageDown`, `Space`, `Enter` go to
the next step; `ArrowLeft`, `ArrowUp`, `PageUp`, `Shift+Space` go back; `Home` and `End` jump to the
first and last slide; `o` toggles the overview, `f` full screen, `n` the notes. Keys typed into a form
field are left alone.

### Example

The Markdown is kept verbatim in a template literal. In a real app, keep the deck in a `.md` file and
load it as a string (Vite: `import markdown from './deck.md?raw'`).

<!-- generated:deck-examples -->

### Server rendering

`SpDeck` renders the slides and their charts as markup on the server, so the first paint already shows
the deck; the browser adds the controller and hydrates the charts. In the Next.js App Router, a
component holding the page in state needs `'use client'`. With `interactive: false` the charts stay
static SVG. Print shows every slide at its own size, every fragment shown, the controls hidden.

## Agents

With the silverpoint MCP server connected, call `validate_deck` on the Markdown before you hand it
over: it reports each problem with its slide and fence. `render_deck` returns the deck, or one slide,
as a standalone HTML document. `generate_code` with `target: { deck: { markdown } }` writes the
`SpDeck` code. The `silverpoint://deck` resource is this reference's data.

<!-- generated:deck-diagnostics -->

## Marp CLI and VS Code

The theme also ships as a plain stylesheet, `@silverpoint/marp/theme.css`, carrying both grounds.

```sh
npx @marp-team/marp-cli --theme node_modules/@silverpoint/marp/theme.css deck.md
```

In the Marp VS Code extension, add the file to the `markdown.marp.themes` setting. There, and in Marp
CLI with `--theme`, some things degrade: there are no generated backdrops (`plate` and `hatched` show
no ink), a `silverpoint` fence shows as code, and there is no controller.

Marp CLI with the deck's own engine renders the directives, the backdrops and the fences as static
SVG:

```sh
npx @marp-team/marp-cli --engine @silverpoint/marp/cli deck.md
```
