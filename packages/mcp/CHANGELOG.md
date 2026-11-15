# @silverpoint/mcp

## 0.10.0

### Minor Changes

- 6fef7d8: Fixes from the issues found while writing the tutorial series. No change to the normalised SVG of any chart. A minor: `PALETTES` narrows its key, two subpaths are new, and a dashboard under a provider is drawn with the provider's ground.
  
  - `SpTable`: body cells align to the start unless their column says `align: 'end'` or `'center'`; they no longer take the right alignment of the charts' data table, whose `sp-table` class the component's root shares (#12). The empty row stays centred.
  - `@silverpoint/grounds`: `standaloneSVG(svg, css)` puts a stylesheet inside the SVG that `toSVGString()` returns, in CDATA, so the file paints itself when opened outside the app; `@silverpoint/grounds/styles-text` is `styles.css` as a string every bundler imports without loader attributes, `?raw` or prebundle settings (#14, #19). `toSVGString()` itself is unchanged: it is the canonical markup.
  - Angular: a literal `title="…"` on a chart, a dashboard or a UI component with a `title` input no longer stays on the host element, where the browser showed its native tooltip (#18).
  - `@silverpoint/core/palettes`: `PaletteName` is the union of the six preset names; `PALETTES` is keyed by it and `PALETTE_NAMES` lists it. Code that indexed `PALETTES` with a plain `string` now needs the name narrowed (#20).
  - `@silverpoint/react/provider`: `SilverpointProvider` on a subpath of its own, so a bundler that keeps the `'use client'` root barrel whole (Next.js with Turbopack) does not carry every chart into each route (#21).
  - A chart whose container is hidden with `display: none` (React `<Activity>`, a kept-alive route, a closed panel) keeps its last measured width and no longer warns `SP003`; a rendered container of 0 px still does (#22).
  - A dashboard's own frame, title and grid follow the provider: `Dashboard`, `SpDashboard` and `sp-dashboard` take the provider's `ground`, `substrate` and `palette` where they set none, as their charts already did (#17). React's `@silverpoint/react/server/dashboard` ships no client JavaScript and still reads no provider. Without a provider the markup is unchanged. `@silverpoint/core` exports `dashboardSection`. React's client `dashboard` entry is 0.1 kB larger for it.
  - Docs: the READMEs and the skill show the export of a standalone SVG.

### Patch Changes

- Updated dependencies [6fef7d8]
  - @silverpoint/core@0.10.0
  - @silverpoint/grounds@0.10.0
  - @silverpoint/marp@0.10.0

## 0.9.2

### Patch Changes

- 9ed4fb1: The agent catalog pins `reflex-silverpoint-react` 0.9.1's own Reflex catalog (it wraps 0.9.1, so no Reflex entry is stale any more) and joins its `sp_deck`: the deck's Reflex name, import and Python prop names. `generate_code { deck }` now writes Reflex code, and the skill and the `deck` guide name `sp_deck` instead of a pending `reflex-silverpoint-marp`. A Reflex catalog is stale only when it wraps another release line (major.minor), so a patch of silverpoint keeps the wrapper of its line current (#10).
- @silverpoint/core@0.9.2
  - @silverpoint/grounds@0.9.2
  - @silverpoint/marp@0.9.2

## 0.9.1

### Patch Changes

- @silverpoint/core@0.9.1
  - @silverpoint/grounds@0.9.1
  - @silverpoint/marp@0.9.1

## 0.9.0

### Minor Changes

- 7ba5fa7: Slide decks (feature-006): `@silverpoint/marp`, a new framework-free package that renders Marp/Marpit
  Markdown in the silverpoint style — the engine, the `silverpoint` theme, the `ground`/`substrate`/`mode`
  directives, a `silverpoint` code fence that draws any chart inside a slide, and a deck controller —
  and `SpDeck` on the `deck` subpath of `@silverpoint/react`, `@silverpoint/vue` and `@silverpoint/angular`.
  The normalised output of existing charts does not change.

### Patch Changes

- Updated dependencies [7ba5fa7]
  - @silverpoint/marp@0.9.0
  - @silverpoint/core@0.9.0
  - @silverpoint/grounds@0.9.0

## 0.8.0

### Minor Changes

- a797b9d: `@silverpoint/mcp`: a Model Context Protocol server that describes silverpoint to agents. It reads the
  agent catalog generated from the published types and answers what the library holds, which chart
  suits a dataset, the code that draws it in React, Vue, Angular or Reflex, the diagnostics its props
  raise, and its canonical render as a standalone SVG.

### Patch Changes

- @silverpoint/core@0.8.0
  - @silverpoint/grounds@0.8.0
