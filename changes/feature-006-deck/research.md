# Research — slide decks: Marp/Marpit Markdown in the silverpoint style

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 0, drafted and approved 2026-10-31 (decisions in §6) |
| **Sources** | this repository at `b136a10` (`develop`, `0.8.0`); npm registry on 2026-10-31; `@marp-team/marpit` 3.2.3 and `@marp-team/marpit-svg-polyfill` 2.1.0 tarballs, probed in a scratch project |

## 1. The problem

silverpoint draws charts and the interface around them, but a talk about data still leaves the
library: the author exports PNGs into a slide tool and loses the ground, the type, the precision
mode and the accessible tables. Marp's Markdown is the plain-text slide format agents and developers
already write. A deck module that renders Marp Markdown **in the silverpoint style, with live
silverpoint charts inside the slides**, for React, Vue and Angular, closes that gap. A Reflex wrapper
(`reflex-silverpoint-marp`, a separate repository) will wrap the React component later, so the React
API must be serialisable: a Markdown string, primitive props, plain-object event payloads.

## 2. What this repository already has

| Asset | Where | Use here |
|---|---|---|
| Headless chart render, the canonical pipeline | `@silverpoint/grounds` `renderChart(recipe, props, env)` + `toSVGString` | The chart fence renders the chart's canonical SVG inside the slide, on the server or in the browser, with no framework (§4) |
| Chart slug → recipe, input validation, closest-name errors | `@silverpoint/mcp` `recipes.ts`, `render_chart`, `validate_props` (DD-047, DD-048) | The fence's input is the same shape as `render_chart`'s, so an agent can preview a fence with the tool it already has |
| Grounds as data (Art. 7), substrates as CSS custom properties | `@silverpoint/grounds` (`silverpoint`, `cyanotype`), `styles.css` | The theme reads `--sp-*` properties; the slide substrate comes from the ground's tokens |
| Inking behind the `Inker` interface, seeded PRNG | `@silverpoint/grounds` `RoughInker`, `WeightInker`; `@silverpoint/core` `resolveSeed`, `prng` | Generated slide backdrops (`hatched`, `plate`) are inked strokes that carry no data |
| UI layer: native buttons, frames, focus, `ui.css` | `@silverpoint/core/ui`, `@silverpoint/grounds/ui.css`, `SpButton` | The deck controls are drawn with it |
| An optional third-party peer behind its own subpath | `SpTimeline` (DD-042): `timeline` subpath ×3, dynamic import, `check-deps` allows the peer only as optional | The template for `/deck` |
| Secondary entry points in Angular | `packages/angular/timeline/ng-package.json` | `@silverpoint/angular/deck` |
| Parity gate over wrapper markup | DD-017, `tools/visual-gate/dashboard-gate.ts` | The deck's markup joins the tree gate as fixtures |
| No-growth bundle gate | REQ-444, `tools/bundle-budget/one-chart-0.6.0.json` | Proves chart-only users pull none of the deck |
| Agent catalog, MCP, skill, generated | `tools/agent-catalog`, `@silverpoint/mcp`, `skills/silverpoint/` | The deck is described to agents in the same release (user decision, §6) |
| Example apps and docs site | `examples/{vite-react,vite-vue,nextjs,angular}`, `docs/site` | A `/deck` page each. There is **no Storybook** |

## 3. Marpit, measured

| Package | Latest | Published | Licence | Notes |
|---|---|---|---|---|
| `@marp-team/marpit` | **3.2.3** | 2026-09-04 | MIT | CJS only (`lib/index.js`). Depends on `markdown-it` ^14.3.1, `markdown-it-front-matter`, `postcss` ^8.5, `postcss-nesting`, `@csstools/postcss-is-pseudo-class`, `js-yaml` ^5.4, `cssesc`, `lodash.kebabcase` |
| `@marp-team/marpit-svg-polyfill` | **2.1.0** | 2023-02-10 | MIT | Ships ESM (`lib/polyfill.mjs`) and types; peer `@marp-team/marpit >=0.5.0`; unchanged for 2½ years |
| `@marp-team/marp-core` | 4.4.0 | 2026-07-17 | MIT | Reference only: adds KaTeX/MathJax, highlight.js, `xss`; not used (§5) |

**Options verified in 3.2.3** (`lib/marpit.js`): `container`, `anchor`, `inlineSVG`,
`cssContainerQuery`, `headingDivider`, `lang`, `looseYAML`, `printable`, `slideContainer`, and
`render(markdown, { htmlAsArray: true })`.

**Probe** — `new Marpit({ inlineSVG: true, anchor: false, container: new Element('div', { class: 'sp-deck-a' }) })`
over a two-slide deck with `paginate: true`, a `*` list and a comment:

```html
<svg data-marpit-svg="" viewBox="0 0 1280 720"><foreignObject width="1280" height="720"><section data-marpit-fragments="2" data-paginate="true" data-marpit-pagination="2" style="--paginate:true;" data-marpit-pagination-total="2">
<ul>
<li data-marpit-fragment="1">b</li>
<li data-marpit-fragment="2">c</li>
</ul>
</section>
</foreignObject></svg>
```

`html.length` is 2 (one string per slide), `comments` is `[[], ["note"]]` (presenter notes per
slide), the CSS is 4,378 characters, and no `id` is emitted (`anchor: false`). Marpit marks
fragments and counts them but reveals nothing: the controller must.

**Bundle cost** — the probe bundled for the browser with esbuild (`--minify --format=esm`):
**429,502 bytes minified, 133,672 bytes gzip**, mostly postcss. The whole of `@silverpoint/core` is
under 45 kB. Consequences: the engine can never sit on a chart-only path (REQ-444), and
`@silverpoint/marp` must be optional for the adapters, not a plain dependency (§5).

## 4. Charts inside slides: static canonical SVG, hydrated

The prompt's design mounts framework charts into empty placeholders. Because the canonical render
is already headless (§2), the fence can do better at no extra cost:

1. `@silverpoint/marp` renders each fence to the chart's **canonical SVG** through
   `@silverpoint/grounds`, inside a `<figure>` slot that carries the parsed spec.
2. The adapter **hydrates** the slot on the client: it mounts the framework's own chart component
   into it (React `createPortal`, Vue `render(h(...))` into the slot, Angular `createComponent` with
   `hostElement`). Art. 3 makes the framework's markup identical to the static SVG, so the swap does
   not move a pixel; it adds the chart's keyboard model, tooltips and tabular alternative (Art. 5).

What it buys:

- **SSR and print with charts**: the server output already contains them.
- **Marp CLI with charts**: a custom engine (`--engine`) can draw them without any framework.
- **Lower PoC risk**: if hydration inside `<foreignObject>` misbehaves in an engine, the static SVG
  is still correct; only interaction degrades.
- **One input shape for agents**: the fence body is `render_chart`'s input.

Chart modules are loaded per slug on demand (`import('@silverpoint/react/bar-chart')`), so a deck
with two charts does not bundle sixty.

## 5. Constraints and conflicts found

| # | Finding | Resolution proposed |
|---|---|---|
| C1 | `0.8.0` is published (2026-10-21); `0.8.1` is queued (Reflex catalog, delta-014) | Target **`0.9.0`** (user decision, §6) |
| C2 | A ninth package joins the `fixed` group | Constitution scope line (amendment v1.11), TD §5.3 allowlist row, bundle budget, npm trusted publisher; first publish by hand as `mcp`'s was |
| C3 | DD-010: no monospace | Code is set in EB Garamond with `tnum`, on a framed plate (user decision) |
| C4 | Art. 4: deck container `sp-deck-<id>` | The id comes from the `id` prop or the framework's hydration-safe id, never random |
| C5 | Art. 2: generated backdrops are inked geometry | Computed in `@silverpoint/grounds` (`slideBackdrop`), not in `@silverpoint/marp`; the deck package computes no geometry |
| C6 | Art. 3: the deck emits wrapper markup | Deck fixtures join the tree gate (DD-017 rules) and the pixel gate |
| C7 | `markdown.html` needs a sanitiser (a new dependency) | HTML is **off and not configurable** in `0.9.0` (user decision) |
| C8 | Gates run on one pinned Chromium; the PoC needs Firefox and WebKit | A separate e2e job installs the three engines; the pixel gate stays on Chromium |
| C9 | Marpit is CommonJS | Vite and Next.js consume it as is; the Angular CLI warns: documented `allowedCommonJsDependencies` |
| C10 | Prompt names `<SilverpointDeck>`; API Spec §4 names components `Sp<Name>` / `sp-<name>` | `SpDeck` (React, Vue) and `sp-deck` (Angular), like `SpTimeline` |
| C11 | Prompt's `mode` values `silverpoint \| precision`; the library's `InkMode` is `ink \| precision` | `ink \| precision`, so a slide and a chart speak one vocabulary |
| C12 | Prompt makes Marpit an optional peer of the adapters | The adapters never import Marpit; they import `@silverpoint/marp`, so **`@silverpoint/marp` is the optional peer** and Marpit is its dependency. Chart-only users install none of it |
| C13 | Prompt's fence key `type: "bar"` | `chart: "bar-chart"` (the catalog slug), as `render_chart` takes it (§4) |
| C14 | Prompt's events `pageChange(page, total)` | One plain-object payload, `{ page, total }`: Angular outputs emit one value, and Reflex receives one argument |
| C15 | `@silverpoint/mcp` may render only through core and grounds (Art. 2) | Amendment: and through `@silverpoint/marp` for decks (`render_deck`, `validate_deck`) |
| C16 | The docs site routes by hash (`/#/ai`) | `hash` only reads and writes `#<n>` and ignores any other hash, so it cannot fight a hash router |

## 6. Decisions the user took (2026-10-31)

| # | Question | Decision |
|---|---|---|
| 1 | Version | **`0.9.0`** (`0.8.0` is published, C1), a `minor` from `0.8.x` |
| 2 | SDD format | `changes/feature-006-deck/` with deltas, as features 001..005 |
| 3 | Charts in the fence | Left to the agent: static canonical SVG + hydration (§4) |
| 4 | Code typeface | EB Garamond, no exception to DD-010 |
| 5 | Raw HTML | Off in `0.9.0`, no sanitiser |
| 6 | Agent catalog, MCP, skill | Updated in this release with the deck |
| 7 | Branches | `spec/feature-006-deck` for the gates; `feat/silverpoint-0.9` for the implementation |

## 7. Risks to validate first (Phase 10a, the PoC)

| Risk | Test | Fallback |
|---|---|---|
| R1 Framework charts inside `<svg><foreignObject>` with `inlineSVG` + the polyfill, in Chromium, Firefox and WebKit: layout, scale, pointer and focus | Playwright, the three engines, one hydrated chart per adapter at three container widths | No inline SVG: scale `<section>` with `transform: scale()` from a `ResizeObserver` (DD-051 records the outcome) |
| R2 Re-render on Markdown change: slots replaced, old mounts destroyed | Mount counters in component tests; heap snapshot in e2e | — |
| R3 Type and `rem` inside the scoped container | The theme uses canvas px only (REQ-578); `document.fonts.ready` before pixel fixtures | — |
| R4 SSR: the engine is pure; polyfill, listeners and hydration client-only | Next.js, `@vue/server-renderer`, Angular SSR with no hydration mismatch | — |
| R5 Marpit's 131 kB gzip | Bundle check: no Marpit module in a chart-only build; a budget for `/deck` | A pre-rendered `deck` prop (Future Considerations) |
