---
'@silverpoint/core': patch
'@silverpoint/grounds': patch
'@silverpoint/react': patch
'@silverpoint/vue': patch
'@silverpoint/angular': patch
'@silverpoint/marp': patch
'@silverpoint/mcp': patch
---

Fixes from the issues found while writing the tutorial series. No change to the normalised SVG of any chart.

- `SpTable`: body cells align to the start unless their column says `align: 'end'` or `'center'`; they no longer take the right alignment of the charts' data table, whose `sp-table` class the component's root shares (#12).
- `@silverpoint/grounds`: `standaloneSVG(svg, css)` puts a stylesheet inside the SVG that `toSVGString()` returns, in CDATA, so the file paints itself when opened outside the app; `@silverpoint/grounds/styles-text` is `styles.css` as a string every bundler imports without loader attributes, `?raw` or prebundle settings (#14, #19). `toSVGString()` itself is unchanged: it is the canonical markup.
- Angular: a literal `title="…"` on a chart, a dashboard or a UI component with a `title` input no longer stays on the host element, where the browser showed its native tooltip (#18).
- `@silverpoint/core/palettes`: `PaletteName` is the union of the six preset names; `PALETTES` is keyed by it and `PALETTE_NAMES` lists it. Code that indexed `PALETTES` with a plain `string` now needs the name narrowed (#20).
- `@silverpoint/react/provider`: `SilverpointProvider` on a subpath of its own, so a bundler that keeps the `'use client'` root barrel whole (Next.js with Turbopack) does not carry every chart into each route (#21).
- A chart whose container is hidden with `display: none` (React `<Activity>`, a kept-alive route, a closed panel) keeps its last measured width and no longer warns `SP003`; a rendered container of 0 px still does (#22).
- Docs: the READMEs and the skill say that a dashboard's own frame reads no provider and needs its own `ground`, `substrate` and `palette` (#17), and show the export of a standalone SVG.
