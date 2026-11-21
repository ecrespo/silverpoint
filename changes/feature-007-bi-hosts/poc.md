# PoC — the standalone file (feature-007, step 11a, T-290)

| Field | Value |
|---|---|
| **Status** | `DONE` — 2026-11-20, run against `develop` at `dd7232e8` (packages at `0.10.1`). Feeds DD-062 and API delta §7; approved with gate 3 (user decision 2026-11-20) |
| **Code** | [`tools/embed-poc`](../../tools/embed-poc/README.md) — a prototype, not the package |
| **Results** | `tools/embed-poc/results/`: `sizes.json`, `node.json`, `parity.json`, `browsers.json` |
| **Answers** | OQ-H1 (budgets) yes; OQ-H2 (WebKit, sandboxed frame) **carried to T-324** — see §5 |

## 1. What was built

`tools/embed-poc/src/embed.ts`: `renderSpec`, `renderToSVG` (the MCP's pipeline: `renderChart` →
`toSVGString`, the ground's stylesheet as the root's first child), and a client — nodes from the
core's `SvgView` with `createElementNS` and no markup parsing, palette declarations and readout
position through `style.setProperty`, the stylesheet adopted once per root (`<style>` fallback),
interaction through the core's `reduceInteraction` and `readout`, `sp-activechange`/`sp-select`,
`ResizeObserver`, forced precision from `FORCED_PRECISION_QUERY`, `mountAll`, and
`<silverpoint-chart>`. The registry imports the 60 recipes **by name**, as T-293's generated file
will. Not built: validation beyond the slug, limits, `specFromTable`, `conformance`, the error
figure, element attributes beyond `chart` and `ground`.

Built by `build.mjs` with esbuild 0.28.2: `minify`, `target: es2020`, IIFE with
`globalName: 'Silverpoint'` for `.js`, ESM for `.mjs`, no source map, a banner with the version.
The `full` files inline EB Garamond 400, 500 and 400 italic as base64 WOFF2 in one `@font-face` sheet.

## 2. Sizes

Bytes; gzip level 9, brotli quality 11.

| File | Raw (minified) | gzip | brotli |
|---|---:|---:|---:|
| `silverpoint-embed.js` | 374 622 | 121 121 | 99 029 |
| `silverpoint-embed.mjs` | 374 140 | 120 861 | 98 919 |
| `silverpoint-embed.full.js` | 474 351 | 197 533 | 173 923 |
| `silverpoint-embed.full.mjs` | 473 869 | 197 250 | 173 753 |
| *fallback* `silverpoint-embed.core.js` (first catalog, 33 charts) | 189 535 | 62 832 | 53 557 |

Where the base file's bytes go (minified, from the metafile): the core's recipes and shared engine
**286.6 KB (77 %)**, d3 33.5 KB, rough.js 27.5 KB, grounds 18.3 KB, the PoC's own code 6.2 KB, the
registry 1.3 KB. The three cuts add 99.7 KB raw, 76.4 KB gzip, 74.9 KB brotli: WOFF2 is already
compressed, so base64 costs what it weighs.

Importing the recipes by name instead of `import *` saved 2 % (the namespace import kept the
dashboard and UI code alive). The recipes themselves are the file: the first-catalog fallback is
the only lever that halves it, and it is not needed (§6).

## 3. Node: the module build is DOM-free

`node-check.mjs` defines `document`, `window`, `customElements`, `matchMedia` and `ResizeObserver`
as getters that throw, then imports `silverpoint-embed.mjs` and renders every chart twice at 480 px.

| Check | Result |
|---|---|
| Charts rendered | **60 / 60**, no DOM global touched on import or render |
| Deterministic | the two renders of each chart byte-equal (REQ-634) |
| Time | 265 ms for 120 renders (Node 22) |

So the n8n node and the Python package's `to_svg` can run the module build in Node as DD-069
assumes.

## 4. Parity through a JSON spec

`parity-check.ts` turns **every chart fixture of the full matrix** (3 402 fixtures, 60 charts,
both grounds, every substrate, both modes, three sizes, per-shape and state variants) into a
`ChartSpec` — data, props, `width`, `height`, `id`, `ground`, `substrate`, `mode`, with `seed` and
`hatchFill` in `props` — renders it with `renderToSVG`, sets the `<style>` aside, normalises with
`tools/svg-normalizer` and compares with the stored canonical.

**3 402 / 3 402 equal; 0 differ; 0 skipped** (no fixture carries a function in its props, so
A-04's concern is empty today; T-322 keeps the check).

In the browser the client's first chart on each page was compared with
`toChartRootString(renderSpec(…))`, parsed, element by element (tag, attributes but `style`,
children, text): **equal on every page** (§5, column *parity*). I-53 and I-56 are reachable as
specified.

## 5. Browsers

`browser-check.mjs` serves the pages (the strict ones with
`default-src 'none'; script-src 'self'; style-src 'self'; img-src data:; font-src data:; frame-src 'self'`)
and records, per scenario: chart roots, SVGs and tables drawn, the readout announced after focus
and `ArrowRight`, requests, console errors and CSP violations, adopted sheets, the faces loaded,
and the time from navigation to the last chart drawn (script parse included).

**Chromium 153 (Chrome for Testing):**

| Scenario | Charts | Keyboard (live region) | Requests | Errors | Faces | Parity | Last chart |
|---|---|---|---|---|---|---|---:|
| `file://`, one chart (element) | 1/1 | "x Q2, value 58" | page, script, probe | 0 | 3 loaded | ✓ | 114 ms |
| `file://`, twenty charts (element) | 20/20 | "hour 02, hits 14" | page, script, probe | 0 | 3 loaded | ✓ | 231 ms |
| `file://`, `mountAll` over five hosts | 5/5 | "x 5, y 24" | page, script, probe | 0 | 3 loaded | ✓ | 91 ms |
| Strict CSP page (element + `mountAll`) | 2/2 | "hour 02, hits 14" | page, script, probe | 0 | 3 loaded | ✓ | 91 ms |
| `sandbox="allow-scripts"` srcdoc, script inlined | 1/1 | "label Mon, #2 34" | the parent page only | 0 | 3 loaded | ✓ | 102 ms |
| `sandbox="allow-scripts"` frame of the strict CSP page | 2/2 | "hour 02, hits 14" | parent, page, script, probe | 0 | 3 loaded | ✓ | 114 ms |
| Jupyter: executed notebook (nbconvert 7.17), srcdoc output | 1/1 | "subject Range, value 6" | none of the chart's¹ | 0 | 3 loaded | ✓ | 98 ms |

¹ nbconvert's HTML template loads require.js and MathJax from a CDN; those two requests (refused by
the proxy) are the host's and are listed apart in `browsers.json`.

Every scenario adopted **one** constructed stylesheet and created **no** `<style>` element: the
constructable path works under `style-src 'self'` and in an opaque-origin sandboxed frame, and the
readout's position set through `style.setProperty` raised no CSP violation (DD-063 holds).

**Firefox and WebKit: not run.** This environment has no Firefox or WebKit build and could not
download one. OQ-H2 (WebKit's `adoptedStyleSheets` in a sandboxed frame) is therefore **carried
to T-324**, whose `browser-embed` job runs the same scenarios in the pinned Playwright image in all
three engines; a failure there reopens DD-062 through its fallbacks (§6), decided with the user.

## 6. Decisions this PoC supports

| Item | Decision |
|---|---|
| Format | IIFE (`.js`, `globalThis.Silverpoint`, the element defined on load) + ESM (`.mjs`, no side effect); `target: es2020`; minified; no source map in the package |
| Contents | 60 recipes, both grounds and their inkers, the stylesheet text; `full` adds the **three** cuts. The fonts fallback (400 only) is not needed |
| Fallback size variant | **Not shipped.** The 33-chart file stays documented as the first fallback if a host refuses the size |
| Budgets (gzip, the unit of `.size-limit.json`) | `silverpoint-embed.js` / `.mjs` **≤ 140 kB**; `.full.js` / `.full.mjs` **≤ 220 kB**; main entry own code **≤ 12 kB**; client entry own code **≤ 8 kB**. Measured 121 / 197.5 kB with a 6 kB prototype client; the margin holds the real client, validation, `specFromTable`, `conformance` and the generated prop tables (estimated +8–12 kB gzip) |
| Brotli, recorded | 99 / 174 kB measured; not a gate |

## 7. Findings for the next steps

| ID | Finding | Goes to |
|---|---|---|
| F-P1 | **The element is upgraded at its start tag**, before the parser reaches its JSON child, whenever the script is in `<head>` — the integration API delta §1.5 shows. Reading the spec in `connectedCallback` finds an empty element and draws nothing (seen in the first run: 0 charts on every element page). The PoC waits for the child with a `MutationObserver` and parses only complete JSON | DD-070 amended; T-304 gains two red cases (element defined before parse; JSON child arriving in chunks) |
| F-P2 | `seed` and `hatchFill` travel in `props` and reproduce the canonical exactly | Data Model §2.38 unchanged: both are common chart props `validateSpec` accepts |
| F-P3 | A notebook with one inline `full` chart weighs 812 KB as HTML; the script travels with each chart | `silverpoint-python` PY-REQ-008 (once per notebook) and PY-OQ-1 (Databricks) keep their place |
| F-P4 | Recipes are 77 % of the file; a size cut means fewer charts, not a smarter bundle | Recorded for any future budget discussion |
| F-P5 | A stray `style` attribute **in the test page** produced the only CSP violation seen; the library's CSSOM writes produced none | The e2e pages of T-324 use no inline style |
