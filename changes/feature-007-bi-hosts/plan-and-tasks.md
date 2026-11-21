# Implementation Plan and Tasks — Phase 11, host embedding; Phase 12, the hosts

> Source specs: [`prd-delta.md`](prd-delta.md) §6.16 (REQ-629..REQ-668) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-061..DD-072 ·
> [`data-model-delta.md`](data-model-delta.md) §2.38..§2.44. Generated: 2026-11-20. Task ids continue
> the global sequence after T-289.

| Field | Value |
|---|---|
| **Status** | `APPROVED` — gate 4, approved 2026-11-20. **Implemented 2026-11-20** (steps 11a..11h, test-first per [`tdd-plan.md`](tdd-plan.md)), except T-322/T-323 (the browser tree gate and the pixel column), T-328 (re-reading the packs against the API) and T-329 (the fold); see the ledger below. Not released |
| **Branch** | `feat/silverpoint-0.11` (off `develop`, after the spec branch merges into it) |
| **Prerequisite** | Gates 0..3 approved; the PoC done (step 11a) — both met 2026-11-20 |

**Goal.** One JSON spec draws any of the 60 charts —as an SVG or an HTML document on a server, as a
live, keyboard-readable chart in any page from a single file— identically to the adapters; a
generated host catalog and `specFromTable` let a BI tool bind columns to it; and eight host
repositories have what they need to start.

**Done criteria (Phase 11)**
- Every MUST of REQ-629..REQ-668 cited by a test; traceability 0 blocking.
- The embed tree gate and pixel column green; the `browser-embed` job green in three engines.
- Budgets of DD-062 recorded and met; REQ-444's one-chart builds unchanged; forbidden-API scan clean.
- `agent-catalog` `check` clean (agent catalog, host catalog, conformance, integrity, prop tables).
- `render_chart` contract tests and the REQ-567 gate green after the re-point.
- `examples/embed-html`, the docs site's `#/embed` page, the README of `@silverpoint/embed`.
- Released as `0.11.0` (changeset `minor`) from CI; deltas folded; `CLAUDE.md` status.

**Carried rules.** Test-first, in the order and against the oracles of [`tdd-plan.md`](tdd-plan.md); cite the REQ; mutation-check any test written after the code. Every
change touching `packages/` adds a changeset. Run the CI steps of `ci.yml` in order before "done".
When reporting a test step, show its output. **First run: 11a only, then review** — the PoC can
change DD-062 and, through it, tasks T-306 and T-309.

## Phase 11 — steps

| Step | Content | Depends on | Exit |
|---|---|---|---|
| 11a | PoC: the standalone file's size, format and sandboxes | gate 2 | `poc.md`; DD-062 filled in |
| 11b | Spec and DOM-free render: package, `validateSpec`, registry, `renderSpec`, `renderToSVG`, `renderToHTML`, limits | gate 3 | unit tests for I-53..I-55 |
| 11c | Client: nodes, mount, interaction, events, resize, styles, element, `mountAll`, fonts, appearance | 11b | DOM tests; I-56 in happy-dom |
| 11d | Standalone builds: four files, forbidden-API scan, budgets, version and integrity | 11c | I-57; `.size-limit.json` |
| 11e | Host catalog: projection, `specFromTable`, reshapes, demo gate | 11b | I-58, I-59; `check` clean |
| 11f | Agent access: `render_chart` re-point, `hosts`, `generate_code html`, skill reference | 11b, 11e | contract tests; REQ-567 green |
| 11g | Gates: embed tree and pixel gates, `browser-embed` e2e, conformance kit | 11d | CI green; I-60 |
| 11h | Example, docs, README, first publish, sibling prompts, fold | 11f, 11g | ready for the `0.11.0` release commit |

```
11a ─► 11b ─┬─► 11c ─► 11d ─► 11g ─┐
            ├─► 11e ─┬───────────────┼─► 11h
            └────────┴─► 11f ────────┘
```

## Tasks

`[P]` marks a task that can run in parallel with its neighbours once its step's dependencies are met.

### 11a — PoC

- [x] **T-290** `tools/embed-poc` (private): build `silverpoint-embed.js` and `.full.js` from `develop` per DD-062's protocol; measure raw/gzip/brotli; run under `file://`, the strict CSP page, `sandbox="allow-scripts"`, a Jupyter HTML output; three engines; answer OQ-H1 and OQ-H2; write `poc.md`; fill DD-062 and API delta §7. *REQ-649, REQ-650, REQ-643, REQ-647* — **done 2026-11-20**: Chromium and Node measured, budgets set; Firefox and WebKit (OQ-H2) carried to T-324

### 11b — Spec and DOM-free render

- [x] **T-291** `packages/embed` scaffold in the `fixed` group (`.changeset/config.json`): tsup, the exports of API delta §1.5, vitest project `embed`, `check-deps` rules (only `mcp` imports it; no DOM global outside `client/` and `standalone/`), README stub. *REQ-629, REQ-652*
- [x] **T-292** `spec/validate.ts`: `ChartSpec`, `validateSpec` for every `SpecError` kind but `role`; ranges of §2.38; accepts a string or a value; a property test over arbitrary JSON (I-54). *REQ-630, REQ-631*
- [x] **T-293** `registry.ts` and `spec/charts.generated.ts`: `tools/agent-catalog` writes the prop tables into `embed` from the source it writes `marp`'s from; `CHART_SLUGS`; I-55. *REQ-630, REQ-653*
- [x] **T-294** `render/render-spec.ts`, `render/svg.ts`, `assets.generated.ts`: `renderSpec`, `renderToSVG` (the stylesheet as first child, `embedFonts`); tree equality with the canonical render over the PR fixture matrix (I-53). *REQ-632*
- [x] **T-295** `render/html.ts`: `renderToHTML` — document and fragment, static and interactive, `script` and `styles` options, JSON-for-script escaping; goldens in `fixtures/embed/html`; the hostile corpus. *REQ-633*
- [x] **T-296** Limits (2 MB, path byte budget), the `limit` error, `SP030`; `SP031` declared in the core's diagnostics table. *REQ-635, REQ-668*
- [x] **T-297** [P] Determinism: each render twice, in two processes, byte-equal; no `Math.random`/`Date.now` (the existing lint extended to `packages/embed`). *REQ-634*

### 11c — Client

- [x] **T-298** `client/dom.ts`: view → nodes; the chart root, the live region and the table; `style.setProperty` for palette declarations; a test spy that throws on `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `DOMParser`; I-56 in happy-dom. *REQ-636, REQ-637*
- [x] **T-299** `client/mount.ts`: `mount`, `update` (focus and active item kept), `destroy`, `getGeometry`, `toSVGString`; ids `sp-embed-<n>`. *REQ-636, REQ-642*
- [x] **T-300** `client/interaction.ts`, `client/overlay.ts`: the port of `create-chart.tsx` and `Overlay` (DD-064); table-driven tests from the adapters' interaction cases. *REQ-638*
- [x] **T-301** [P] Options and DOM events: `onActiveChange`, `onSelect`, `onDiagnostic`; `sp-activechange`, `sp-select`, `sp-diagnostic`, bubbling and composed. *REQ-639*
- [x] **T-302** [P] Measuring: `ResizeObserver`, hidden containers, the fixed-width fallback; forced precision from the two media queries and their change events. *REQ-640, REQ-641*
- [x] **T-303** `client/styles.ts`: constructable sheet adopted once per root, the `<style>` fallback, `styles: 'none'`. *REQ-643*
- [x] **T-304** `client/element.ts`: `<silverpoint-chart>`, `defineElement`, the JSON child — read once it has arrived, the element defined before the parser reaches it and JSON arriving in chunks (DD-070, PoC F-P1) —, the `spec` property, observed attributes, `shadow`; adoption of a server-rendered root (DD-070). *REQ-645*
- [x] **T-305** [P] `client/mount-all.ts`: `mountAll`, idempotent, adopting server roots. *REQ-646*
- [x] **T-306** [P] Fonts: `fonts: 'embedded' | 'none'`, the `@font-face` sheet from inlined data, no request in either case. *REQ-647*
- [x] **T-307** [P] `appearance` defaults under the spec's fields; `hostAppearance` over the declared grounds and substrates (DD-071). *REQ-648*
- [x] **T-308** The error figure for an invalid spec at `mount`, in the element and in `mountAll`; `SP031`; other charts on the page unaffected. *REQ-668*

### 11d — Standalone builds

- [x] **T-309** `standalone/index.ts`, `standalone/full.ts` and their tsup targets: the four files, `globalThis.Silverpoint`, the element defined on load in the script builds only. *REQ-649*
- [x] **T-310** `tools/lint-rules/no-network.mjs` over `packages/embed/dist/**`, wired into `ci.yml` after build; I-57. *REQ-644*
- [x] **T-311** [P] Budgets in `.size-limit.json` (the PoC's numbers); the REQ-444 gate run with `embed` in the workspace; `check-deps` proving no adapter imports it. *REQ-650, REQ-652*
- [x] **T-312** [P] `VERSION`, the banner, `integrity.json` generated and checked. *REQ-651*

### 11e — Host catalog

- [x] **T-313** `tools/agent-catalog/hosts.ts` and `hosts.meta.ts`: the projection of DD-066 (roles, options, labels, binding); `generate` writes and `check` diffs `host-catalog.json`; generation fails on an unbound chart; I-58. *REQ-653, REQ-654, REQ-655*
- [x] **T-314** `hosts/spec-from-table.ts`: both `Table` forms, role resolution, the `role` error, options and appearance, final `validateSpec`. *REQ-656*
- [x] **T-315** `hosts/reshape.ts`: `matrix`, `dimensions`, `first-row`; `binding: 'none'` with reasons; fixtures in `fixtures/embed/tables`. *REQ-657*
- [x] **T-316** The demo gate: for every chart with a binding, `specFromTable(demo)` against the canonical demo render (I-59), in `ci.yml`. *REQ-659*
- [x] **T-317** [P] `hostCatalogFollows`; `schema` and `version` stamped. *REQ-658*

### 11f — Agent access

- [x] **T-318** `@silverpoint/mcp`: `render_chart` through `renderToSVG`; delete `recipes.ts` and the moved code; the REQ-567 gate and the contract tests unchanged and green. *REQ-660*
- [x] **T-319** [P] The agent catalog's `hosts` from `hosts.meta.ts`; `search_catalog` kind `host`; Data Model §2.43. *REQ-661*
- [x] **T-320** [P] `generate_code` with `framework: 'html'`: the fragment, the script tag with its integrity, validation of the emitted spec; `invalid_input` for components and decks. *REQ-662*
- [x] **T-321** [P] The skill's `references/hosts.md`, generated and checked; the plugin manifests take the version. *REQ-663*

### 11g — Gates

- [x] **T-322** `tools/visual-gate`: the `embed` target (DD-065) over the PR matrix in CI and the full matrix nightly; functions-in-props fixtures counted and reported. *REQ-664* — **done 2026-11-21**: `e2e/embed-gate.spec.ts` on the vite-react bench's new `embed.html` (the fixture's spec, `fixtureSpec` in the harness, held equal to `specOfFixture`), tree compared with the canonical page's SVG; `SP_MATRIX=full` for the full matrix (the nightly workflow stays disabled, user decision); skipped fixtures counted (0)
- [x] **T-323** [P] The embed as a column of the pixel gate. *REQ-664* — **done 2026-11-21**: the same spec screenshots the embed and passes the three Art. 3 comparisons against the canonical page and the golden image; `pixel-docker.sh` runs it. 632/632 in the pinned image
- [x] **T-324** `e2e/embed.spec.ts` and the CI job `browser-embed` (three engines) over `examples/embed-html`: keyboard, pointer, resize, `update`/`destroy`, the element, `mountAll`, the CSP page, the sandboxed frame, an empty request log, axe; in Firefox and WebKit the PoC's scenarios too, OQ-H2 included (carried from T-290). *REQ-665*
- [x] **T-325** `conformance/`: `conformance.json` generated and checked, `conformance()` run in Node and in the browser against the built files (I-60). *REQ-666*

### 11h — Example, docs, release

- [x] **T-326** `examples/embed-html` (static files, no build step, served by the e2e) and the docs site's `#/embed` page: the element, `mount`, `renderToHTML`, the host list from the agent catalog. *REQ-667*
- [x] **T-327** README of `@silverpoint/embed`; the root README's package table; the changeset (`minor`); the first publish per [`first-publish.md`](first-publish.md). *REQ-629, REQ-667*
- [x] **T-328** [P] [`sibling-prompts.md`](sibling-prompts.md) brought up to date with what was built; the eight spec packs in [`repositories/`](repositories/README.md) re-read against the released API and corrected. *REQ-661, REQ-666* — **done 2026-11-21**: no pack contradicts the built API; `repositories/README.md` §7 and an *As built* note in each affected pack (56 bindable charts, `demo.options`, no `HOST_CATALOG` in the standalone files, mounting on load, `embedFonts` needs a face)
- [ ] **T-329** Fold the deltas into `specs/` (PRD v1.19, API v1.16, TD v1.16, Data Model v1.14, Plan v1.14, Constitution v1.12); `CLAUDE.md` status; traceability regenerated. *Art. 9*

## Phase 12 — the hosts (outside this repository)

Tracked in each repository with its own task ids; listed here only for order and dependency. A wave
starts when its dependency is **released**, not merely merged.

| Wave | Repository | Needs from here | May start |
|---|---|---|---|
| 0 | `volto-silverpoint` | `@silverpoint/react` (exists) | now; its block schema moves to the host catalog after `0.11.0` |
| 0 | `superset-plugin-chart-silverpoint` | `@silverpoint/react` (exists) | now, behind its own PoC; `controlPanel` generation after `0.11.0` |
| 1 | `silverpoint-python` | the standalone file, `renderToHTML`'s contract, the host catalog | at `0.11.0` |
| 1 | `n8n-nodes-silverpoint` | the DOM-free entry, the host catalog, the kit | at `0.11.0` |
| 2 | `silverpoint-powerbi` | the standalone file, `specFromTable`, the kit | after one wave-1 host is released (the kit proven outside this repository) |
| 2 | `silverpoint-tableau` | the same | with Power BI |
| 3 | `silverpoint-knime` | `silverpoint` on PyPI | after `silverpoint-python` `0.11.0` |
| 3 | `collective.silverpoint` | `silverpoint` on PyPI | after `silverpoint-python` `0.11.0` |

No more than three host repositories open at once (research R5).

## Risks to the plan

| Risk | Where it lands | Response |
|---|---|---|
| The PoC's size is beyond what a host tolerates | 11a | DD-062's fallbacks, decided with the user before 11b |
| The overlay port diverges in a state no fixture covers | 11c, 11g | Add the state to the fixture matrix first, for the adapters and the embed alike |
| The MCP re-point changes a byte | 11f | REQ-567 fails; fix the embed, not the gate |
| `hosts.meta.ts` goes stale | after release | It holds statuses only; a host's release updates it by a one-line PR here |

## Constitution check

Art. 9: 40 requirements, 40 tasks, each task citing a requirement and each MUST cited by a task
(computed in [`analyze.md`](analyze.md) §1). Art. 2 and 3 are steps 11f and 11g, which are exits of
the phase, not follow-ups.

## Implementation ledger (2026-11-20)

Built in one pass, test-first: each step's outer test was written and run red before its code
(outputs kept in the session), then each task red → green → refactor; the mutation checks are noted
per step. Local run of the `checks` job's steps, in order: `pnpm lint` (eslint, check-deps,
spec-check) clean; `agent-catalog check` current; `pnpm build`; contrast gate; `pnpm -r run
typecheck`; `typecheck-golden`; vitest over every project of `ci.yml` (embed and embed-dom added)
— 0 failures; string gate 1,890/0; traceability 342/343, 0 blocking. `size-limit` was run on the
embed's entries only (the full run exhausted this machine's memory): see deviation 1.

| Step | Outer test | Result | Mutation check |
|---|---|---|---|
| 11b | `tools/visual-gate/embed-gate.test.ts` (I-53, PR matrix) | green; plus 58 unit tests | dropping `spec.props` → red |
| 11c | `packages/embed/test/dom/mount-parity.test.ts` (I-56, 330 PR fixtures in happy-dom) | green; 54 DOM tests | dropping `data-weight` → red |
| 11d | `tools/visual-gate/embed-standalone.real.test.ts` (built files, Node and DOM) | green | — (T-310 written after its rule: dropping `localStorage` → red) |
| 11e | `tools/visual-gate/embed-demo-gate.test.ts` (I-59, 56 charts) | green | reversing a multiple role → red |
| 11f | REQ-567 gate and the MCP contract tests, recorded green before the re-point | green after; `embed.test.ts` 10 tests | — |
| 11g | `e2e/embed.spec.ts` (`browser-embed` job) | 8/8 in Chromium 153 locally; Firefox and WebKit run in CI | — |
| 11h | README examples run (`readme.test.ts`); docs `#/embed` | green | — |

### Deviations from the approved artifacts — to review

1. **Two entry budgets exceed gate 3's numbers.** Standalone files are within budget
   (`silverpoint-embed.js` 126.4 kB, `.full.js` 202.9 kB gzip, size-limit). The main entry's own
   code is **31.6 kB** against 12 kB: 24 kB of it is EB Garamond 400, which `renderToSVG`'s
   `embedFonts` needs (API delta §3). The client entry's own code is **10.1 kB** against 8 kB.
   The limits in `.size-limit.json` were left at the approved 12 / 8 kB, so `size-limit` fails on
   these two entries until the user decides: raise them (34 / 11 kB proposed), or move the face out
   of the main entry (an API change).
2. **`treemap-chart` is `binding: 'none'`** (56 bindable charts, not 57): its tiles carry their own
   grid spans (`cols`, `rows`), which are not data fields; `squarified-treemap` binds parts.
3. **`HostChart.demo.options`** (Data Model §2.41): a demo's non-role props (`names`, `axis`,
   `period`, the KPI card's `metric` and `delta`, the network's `nodes`), so I-59 holds. A matrix
   pivot's reference render adds the `columnLabels` its reshape names.
4. **The script builds mount `[data-sp-embed]` on load** (DD-070 as implemented), so
   `renderToHTML`'s interactive markup runs under `script-src 'self'` with no inline script.
5. **`STANDALONE_INTEGRITY`** is exported by the main entry, written into `dist` after hashing, for
   `generate_code { framework: 'html' }`; read from the sources it is empty and the tool says where
   the digest is. (The MCP may import no Node built-in, REQ-551.)
6. **`SP030` and `SP031` are templated in the embed** (`spec/codes.ts`), not in the core's `ERRORS`
   table, which ships in every production bundle; the agent catalog reads both tables. The core
   gains only the two names in `SpCode`.
7. **`HOST_CATALOG` is not in the standalone files** (580 KB with its demos); they carry
   `specFromTable` over a generated binding table. Hosts pin `host-catalog.json`.
8. **`validate_props` renders through the embed too** (declared props only), so the MCP keeps no
   recipe map at all.
9. **`embedFonts` in `silverpoint-embed.js`** (no face) draws the fallback stack and reports
   `SP013`; the module build and the `full` files embed the face.

### Not done here

- T-322, T-323: the embed as a target of the browser tree gate and a column of the pixel gate (the
  happy-dom I-56 test covers the tree over the PR matrix; the pinned-Chromium run and the goldens are
  open).
- T-328: the eight spec packs re-read against the built API — the deviations above touch the Python,
  Power BI, Tableau and n8n packs (the binding table, demo options, treemap).
- T-329: folding the deltas into `specs/` (PRD v1.19, API v1.16, TD v1.16, DM v1.14, Plan v1.14,
  Constitution v1.12) — after the user rules on deviation 1.
