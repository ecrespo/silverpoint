# @silverpoint/mcp

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
