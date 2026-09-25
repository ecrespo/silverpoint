# Phase 4 — execution ledger

Tasks: `changes/phase-4-tasks.md` (T-090..T-101). Every task test-first; tests cite REQs.
Base: Phase 3 closed at `e9bb182`.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-090 | done | (this commit) | 27 deferred minors triaged: 22 fixed test-first, 7 ruled (below). `close-out-minors.test.ts` RED 19 → GREEN (M1-M8, M-1..M-9; two tests corrected before any fix: an empty chart is `ready` with an `empty` label, and SP009 throws); M7 strengthened and mutation-checked (stacking disabled → red); traceability RED 2 → GREEN (skipped titles cite nothing; an empty PRD fails); pixel count guard mutation-checked (empty `FIXTURES` → 0 ≠ 264); markup-injection lint RED 5 → GREEN, then it caught the canonical page, rewritten with `DOMParser` + `importNode`; consumer id RED → GREEN (sanitised, SP002); React 18: the whole React suite runs on React 18.3 (385/385) as project `react-18`, with a guard mutation-checked (alias removed → 19 ≠ 18). Suite: vitest 3002/3002, lint, typecheck, traceability 99/99, size-limit, e2e 450/450, pixel 1068/1068; no canonical changed |
| T-091 | done | (this commit) | `fixtures.test.ts` "the full matrix" RED (264 ≠ 1,584; no `ALL_FIXTURES`) → the generator writes 33 × 2 × 4 × 2 × 3 = 1,584 cells (22 MB on disk); `loadFixtures()` keeps the PR slice (264), `loadFixtures('full')` all; the harness exports `ALL_FIXTURES` and `fixtureById` finds any cell; every canonical of the full matrix is checked current on every PR (tools 301/301 in 3.3 s) |
| T-092 | done | (this commit) | e2e "a sm/lg fixture lays out in a sm/lg container" RED in 4 apps (`md` hard-coded) → `sizeOf` in the harness, used by the four apps and the canonical page (12/12); `matrixScope` (`SP_MATRIX`, an unknown value throws) RED → GREEN; the string gate over the full matrix: 4,752 comparisons, 0 failures (18 s); the pixel gate over the full matrix in the pinned image: 6,348/6,348 (10.7 min); `nightly.yml` gains the `matrix` job; PR run unchanged: e2e 458/458, pixel 1068/1068, vitest 3008/3008 |
| T-093 | done | (this commit) | bench report RED (one budget) → `render · …` benchmarks held to 16 ms, geometry to 2 ms; `packages/grounds/bench` (a card per catalog chart: resolve, build, ink, round, serialise) with a dataset test RED on the missing module → GREEN after **a real bug it found**: the sankey counted a one-node layer as "crowded" and warned SP002 on its own demo (hidden by diagnostic de-duplication) — RED → GREEN in `close-out-minors.test.ts`; measured: 33 cards within 16 ms (slowest ActivityGrid 1.23 ms), 27 geometry benchmarks within 2 ms (slowest 0.67 ms); nightly runs both |
| T-094 | done | (this commit) | already held by `tools/bundle-budget/budget.real.test.ts` (Phases 0-3): every one of the six packages budgeted, every chart at 45 kB in every adapter entry, budgets hold, and a tight budget breaks the build. Measured now, 136 entries all within: heaviest one-chart bundle React 28.5 kB, Vue 30.0 kB, Angular 31.4 kB (PRD §4.1: < 45 KB); core whole 42.7/45 kB; grounds 11.9/40 kB; styles 2.1/4 kB; fonts 74.4/76 kB. No code change |
| T-095 | done | (this commit) | `changes/phase-4-req-124-review.md` — magnitude and identity channels compared across all 33; one catalog test: the 14 charts that tone their items each declare a non-hatch identity channel, checked in precision (written after the code; mutation-checked: varying polar-bar tones → undeclared chart caught; solid secondary bars → channel caught); "precision draws no hatching" widened to all 33 (the line chart was left out); the donut sweep helper fixed for sectors past half a turn (drawn as two arcs since I-1) and exercised with a 70 % sector, mutation-checked (√ sweep → red); grounds 250/250 |
| T-097 | done | (this commit) | `docs/site` (Vite + React, hash routes, static): start page with the three quickstarts, gallery of 33, ground playground (chart, substrate, mode, hatch fill, size, seed, and the JSX it amounts to), a page per chart with its own and common props, and the parity page. Props read from the types with the TypeScript compiler (`scripts/props.ts`, docs project RED on the missing module → 3/3, committed JSON held current); parity renders from the three adapters' server output (`tools/visual-gate/parity.ts`, gates test RED → 2/2, all equal); `e2e/docs.spec.ts` RED 10/10 on a bare shell → GREEN, each page axe-clean. Looked at every page: the parity SVGs were drawn without ink (the ground's tokens come from the wrapper), which the spec had missed — an ink assertion was added and mutation-checked (substrate removed → red); the content region's focus outline removed. Examples now typecheck (`typecheck` in the four apps; vite-react gains `@types/react`, vite-vue `vue-tsc`), closing the T-090 ruling; the markup-injection lint covers the site. Suite: vitest 3064/3064, lint, `pnpm -r typecheck` (20 packages), e2e apps + a11y + docs 468/468, pixel 1068/1068 |

## Rulings

- **T-091 · Ruling:** the 1,584 canonicals are committed, as the PR matrix's are (Data Model §5:
  the canonical is stored with the fixture) — measured at 11.9 MB of text — cost if wrong: repo
  weight; they could move to a nightly artifact.
- **T-097 · Ruling:** the documentation site is a Vite + React app in `docs/site`, consuming the
  published builds — Vite + React is a validated integration, so the site is one more consumer —
  cost if wrong: a site generator to swap; the pages are plain components.
- **T-090 · Ruling:** Phase 0's `sideEffects` test rewriting the tracked `package.json` stands — the
  race it caused is closed by the gates' later group (Phase 3 ruling), and rewriting the real file is
  what it proves — cost if wrong: a test that edits a tracked file.
- **T-090 · Ruling:** the string gate compares the `<svg>` only, and React's server entry only: the
  table and overlay are checked per app by the e2e a11y suite (every fixture's table and readout),
  and the client entry's output by the hydration tests (no mismatch with the server's) — cost if
  wrong: a divergence in the table markup between adapters caught by e2e rather than the gate.
- **T-090 · Ruling:** the normaliser's `v-N` / `ngN` patterns stay: fixture ids are `<chart>--…`
  and never match them; a consumer id like `v-2` only meets the normaliser inside our own gates —
  cost if wrong: a false pass for a consumer who runs our normaliser over such ids.
- **T-090 · Ruling:** `adapter-boundary` stays at `Math.*`: arithmetic operators have legitimate
  adapter uses (indexes, `-1` sentinels), and Art. 2 is also held by review and the parity gates —
  cost if wrong: a computation slipping into an adapter until review.
- **T-090 · Ruling:** `process.env.NODE_ENV` stays as the production-strip switch: a `typeof process`
  guard would keep every warning in bundled production builds, which is worse; the quickstart
  (T-098) states that a bundler is required — cost if wrong: unbundled ESM use throws.
- **T-090 · Ruling (M-7):** orbit periods 0 and 1 both stay valid and coincide at 12 o'clock, as
  delta-009 reads 0-1 inclusive and a cycle's end is its start — cost if wrong: a half-open range
  to propose in delta-009 before it is approved.
- **T-090 · Ruling (M-10):** the orbit readout keeps the shared pattern (first column, one value);
  the period is in the table and the description, and markers are traversed in period order. Making
  the readout name two columns changes every chart's announcement — cost if wrong: keyboard users
  hear "orbit Inner, value 4" without the period; revisit with the API Spec's readout wording.
- **T-090 · Ruling (found on the way):** the examples are not typechecked by `pnpm -r typecheck`
  (no `typecheck` script); vite-react's `main.tsx` has union-JSX errors, and `vue-tsc` is absent.
  The canonical page's error was fixed with its rewrite; the rest goes to T-097, where the site
  meets the same pattern — cost if wrong: a type error in an example ships unseen (Vite does not
  typecheck).
- **T-092 · Ruling:** golden images stay committed for the 264 PR cells only; the 1,320 other
  nightly cells compare each adapter with the canonical page rendered in the same run (Art. 3's
  first two comparisons). A golden guards drift of the rasteriser and stylesheet over time, which
  the PR cells already catch, while geometry drift in every cell is caught by the committed
  canonicals — cost if wrong: a size- or fill-specific CSS regression surfaces as a difference
  between adapters only if it hits them unequally; ~40 MB of goldens would close it.
- **T-093 · Ruling:** "full initial render of a card" is timed through the render pipeline every
  adapter calls — resolve, build, ink, round, serialise — without a framework's DOM work, which
  Art. 2 keeps a translation; timing it would time React, Vue and Angular — cost if wrong: an
  adapter whose DOM work alone approaches 16 ms goes unmeasured.
- **T-095 · Ruling:** the three order-based limits (a gap in a stacked bar or a wind-rose sector; a
  donut or tracks without room for their legend) stand for `1.0.0`; the remedy, a key name printed
  inside any item tall enough, reaches every golden of five charts and is left to a minor release —
  cost if wrong: on paper, in those cases, an item is identified only through the table.
