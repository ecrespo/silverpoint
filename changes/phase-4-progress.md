# Phase 4 — execution ledger

Tasks: `changes/phase-4-tasks.md` (T-090..T-101). Every task test-first; tests cite REQs.
Base: Phase 3 closed at `e9bb182`.

| Task | State | Commit | Evidence |
|---|---|---|---|
| T-090 | done | (this commit) | 28 deferred minors triaged (Phase 0's second list 10, Phase 2 8, Phase 3 10): 21 fixed test-first, 7 ruled (below); Phase 0's first list of 6 was missed here and closed in the final-review fix pass (below). `close-out-minors.test.ts` RED 19 → GREEN (M1-M8, M-1..M-9; two tests corrected before any fix: an empty chart is `ready` with an `empty` label, and SP009 throws); M7 strengthened and mutation-checked (stacking disabled → red); traceability RED 2 → GREEN (skipped titles cite nothing; an empty PRD fails); pixel count guard mutation-checked (empty `FIXTURES` → 0 ≠ 264); markup-injection lint RED 5 → GREEN, then it caught the canonical page, rewritten with `DOMParser` + `importNode`; consumer id RED → GREEN (sanitised, SP002); React 18: the whole React suite runs on React 18.3 (385/385) as project `react-18`, with a guard mutation-checked (alias removed → 19 ≠ 18). Suite: vitest 3002/3002, lint, typecheck, traceability 99/99, size-limit, e2e 450/450, pixel 1068/1068; no canonical changed |
| T-091 | done | (this commit) | `fixtures.test.ts` "the full matrix" RED (264 ≠ 1,584; no `ALL_FIXTURES`) → the generator writes 33 × 2 × 4 × 2 × 3 = 1,584 cells (22 MB on disk); `loadFixtures()` keeps the PR slice (264), `loadFixtures('full')` all; the harness exports `ALL_FIXTURES` and `fixtureById` finds any cell; every canonical of the full matrix is checked current on every PR (tools 301/301 in 3.3 s) |
| T-092 | done | (this commit) | e2e "a sm/lg fixture lays out in a sm/lg container" RED in 4 apps (`md` hard-coded) → `sizeOf` in the harness, used by the four apps and the canonical page (12/12); `matrixScope` (`SP_MATRIX`, an unknown value throws) RED → GREEN; the string gate over the full matrix: 4,752 comparisons, 0 failures (18 s); the pixel gate over the full matrix in the pinned image: 6,348/6,348 (10.7 min); `nightly.yml` gains the `matrix` job; PR run unchanged: e2e 458/458, pixel 1068/1068, vitest 3008/3008 |
| T-093 | done | (this commit) | bench report RED (one budget) → `render · …` benchmarks held to 16 ms, geometry to 2 ms; `packages/grounds/bench` (a card per catalog chart: resolve, build, ink, round, serialise) with a dataset test RED on the missing module → GREEN after **a real bug it found**: the sankey counted a one-node layer as "crowded" and warned SP002 on its own demo (hidden by diagnostic de-duplication) — RED → GREEN in `close-out-minors.test.ts`; measured: 33 cards within 16 ms (slowest ActivityGrid 1.23 ms), 27 geometry benchmarks within 2 ms (slowest 0.67 ms); nightly runs both |
| T-094 | done | (this commit) | already held by `tools/bundle-budget/budget.real.test.ts` (Phases 0-3): every one of the six packages budgeted, every chart at 45 kB in every adapter entry, budgets hold, and a tight budget breaks the build. Measured now, 136 entries all within: heaviest one-chart bundle React 28.5 kB, Vue 30.0 kB, Angular 31.4 kB (PRD §4.1: < 45 KB); core whole 42.7/45 kB; grounds 11.9/40 kB; styles 2.1/4 kB; fonts 74.4/76 kB. No code change |
| T-095 | done | (this commit) | `changes/phase-4-req-124-review.md` — magnitude and identity channels compared across all 33; one catalog test: the 14 charts that tone their items each declare a non-hatch identity channel, checked in precision (written after the code; mutation-checked: varying polar-bar tones → undeclared chart caught; solid secondary bars → channel caught); "precision draws no hatching" widened to all 33 (the line chart was left out); the donut sweep helper fixed for sectors past half a turn (drawn as two arcs since I-1) and exercised with a 70 % sector, mutation-checked (√ sweep → red); grounds 250/250 |
| T-096 | done | (this commit) | `changes/phase-4-wcag-audit.md` — every A and AA criterion of WCAG 2.1 judged across the four apps and the site, each with its evidence. Three AA issues found and fixed test-first: **1.4.13** a pointer readout could not be dismissed with Escape unless the chart had focus — the three adapters now pass a document-level Escape to the core reducer while an item is active (wiring only, Art. 2), `e2e/wcag.spec.ts` RED in 4 apps → GREEN; **1.4.10** the hidden data table kept its width (a `<table>` ignores `width`/`overflow`) — the visually-hidden style moves to a `.sp-table-box` wrapper in all three adapters, site reflow tests RED → GREEN, grounds style test updated; **1.4.10** the apps' 320 px harness scrolled at 320 CSS px — `max-width`, RED in 8 cases → GREEN, no golden changed. Tests of behaviour that already held were mutation-checked: 2.1.2 (an adapter swallowing Tab → red), 2.4.7 (`outline: none` → red). One verdict rests on reasoning, stated in the audit: the SVG half of 1.4.12. Suite: vitest 3070/3070, lint, typecheck, e2e apps + a11y + docs + wcag 509/509 (2 SSR checks skipped on the client-rendered apps), pixel 1068/1068 |
| T-099 | done | (this commit) | Changesets 3.0.3 in the private `tools/release` package (the root manifest is read-only); `.changeset/config.json` fixes the six packages as one group, public access, base `develop`. `tools/release/version.test.ts` runs `changeset version` over a scratch copy of the workspace's manifests: RED (no release changeset; a fonts-only patch bumped the fonts alone, `0.1.0` ≠ `0.1.1`) → `fixed` group and `.changeset/silverpoint-one-point-zero.md` → GREEN: all six at `1.0.0` with a `## 1.0.0` changelog entry each, private packages untouched, and a patch to one package releases all six. `check-changeset.mjs` RED 2 → GREEN 4/4 (a new `.changeset/*.md` other than the README is required when `packages/` is touched); in CI on PRs into `develop`; run on this branch's T-096 commit it fails, exit 1. Dry run in a throwaway worktree: only the six manifests and six changelogs change. Suite: vitest 3076/3076, lint, traceability 99/99 |
| T-100 | done | (this commit) | `changes/phase-4-analyze.md`. Traceability over the whole PRD (`reports/traceability.md`, regenerated): 99/99 MUST cited, 0 deferred, 0 blocking, no undefined citation; of the 6 below MUST, REQ-028 (SHOULD) and REQ-047 (COULD) are uncited and deferred "After v1" by `specs/tasks.md`. B-01 settled (spec-check), B-05 settled (stands: Vue SSR verified with `@vue/server-renderer`), B-02 and B-03 carried as spec edits (`specs/` read-only), B-04 carried to the user (outside the repository). Deltas listed: 006 and 007 `APPROVED`, 001-005 and 008-010 `PROPOSED`, awaiting the user before T-101. No code change |
| T-097 | done | (this commit) | `docs/site` (Vite + React, hash routes, static): start page with the three quickstarts, gallery of 33, ground playground (chart, substrate, mode, hatch fill, size, seed, and the JSX it amounts to), a page per chart with its own and common props, and the parity page. Props read from the types with the TypeScript compiler (`scripts/props.ts`, docs project RED on the missing module → 3/3, committed JSON held current); parity renders from the three adapters' server output (`tools/visual-gate/parity.ts`, gates test RED → 2/2, all equal); `e2e/docs.spec.ts` RED 10/10 on a bare shell → GREEN, each page axe-clean. Looked at every page: the parity SVGs were drawn without ink (the ground's tokens come from the wrapper), which the spec had missed — an ink assertion was added and mutation-checked (substrate removed → red); the content region's focus outline removed. Examples now typecheck (`typecheck` in the four apps; vite-react gains `@types/react`, vite-vue `vue-tsc`), closing the T-090 ruling; the markup-injection lint covers the site. Suite: vitest 3064/3064, lint, `pnpm -r typecheck` (20 packages), e2e apps + a11y + docs 468/468, pixel 1068/1068 |
| T-098 | done | (this commit) | `tools/quickstart/quickstart.ts` follows the site's quickstart literally — the create command, the install over this checkout's `pnpm pack` tarballs, the files written verbatim, the app's own build, Chromium on the built app — and times it against 10 minutes; its substitution unit-tested and mutation-checked (core dropped → red). Run: React 23 s, Vue 11 s, **Angular failed**: `npm install` refused `@silverpoint/angular` because its peer range was `>=21 <22` while TD supports Angular 21 and 22 (the fresh app is 22.2) — a real defect of every release so far. Manifest test RED → peer range `>=21.0.0 <23.0.0` → GREEN; rerun: Angular 10 s on Angular 22, chart drawn and inked. Nightly `quickstart` job added. Suite: vitest 3069/3069, lint, typecheck |

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
- **T-098 · Ruling:** the quickstart runs over local tarballs, core included, until `1.0.0` is on
  npm; after publishing, the substitution goes and the nightly job installs from the registry —
  cost if wrong: a registry-only packaging fault (a file missing from `files`) is caught only
  after the first publish; `pnpm pack` uses the same `files` lists, which narrows it.
- **T-098 · Ruling:** Angular 22 is validated by the quickstart (build and render on 22.2); the
  adapter's unit suite runs on 21, the workspace's version, as it did before — cost if wrong: a
  22-only behaviour outside the line chart's render goes unseen until a consumer meets it.
- **T-098 · Ruling:** `README.md` is read-only in this checkout (like `specs/`), so the quickstart
  lives in the site only; the README change is proposed to the user in the phase summary — cost if
  wrong: the repository's front page still says "In specification".
- **T-098 · README (user, 2026-09-24: "Ya cambié los permisos del README.md. Actualiza el archivo
  README.md"):** the README's "In specification" note is replaced by the React quickstart, written
  from `docs/site/src/quickstart.ts`; `tools/quickstart/readme.test.ts` RED → GREEN holds them equal.
  Supersedes the T-098 README ruling.
- **T-099 · Ruling:** `changeset version` is not applied in this commit; the `1.0.0` changeset waits in
  `.changeset/` and becomes the release commit in T-101, after the user approves the PROPOSED deltas,
  because `1.0.0` puts the API Spec in force — cost if wrong: none; the version commit is one command.
- **Deltas (user, 2026-09-25: "Apruebo los deltas puedes continuar"):** 001-005 and 008-010 move
  from `PROPOSED` to `APPROVED`; with 006 and 007, all ten await folding into `specs/` when it is
  writable. T-101's approval prerequisite is met; the npm organisation and Trusted Publishing remain.

## Final review (fresh reviewer, range `e9bb182..01efe4c`)

No correctness bug in the shipped library code, no constitution violation. 2 Important, 4 Minor.
Every one is closed below: fixed test-first, or ruled. Suite after the fix pass: vitest 3082/3082,
lint, typecheck, traceability 99/99; no source under `packages/*/src` changed, so e2e and pixel
(509/509 and 1068/1068 at T-096) stand.

- **Important 1 · fixed:** the documented release step `pnpm --filter @silverpoint/release exec
  changeset version` fails: Changesets 3.0.3 reads `.changeset/` from its working directory, which
  `--filter … exec` sets to `tools/release`. `tools/release/version.mjs` runs it from the root, as the
  `version-packages` script; `version.test.ts` now runs that script and holds the README to it. RED 3 →
  GREEN; the literal `pnpm --filter @silverpoint/release run version-packages <scratch>` was run
  on a scratch copy: six packages at `1.0.0`, the real tree untouched.
- **Important 2 · fixed:** the `docs` vitest project, which holds the committed props reference
  current (T-097), never ran in CI. `tools/traceability/ci-projects.test.ts`: every project of
  `vitest.config.ts` appears in a `vitest run --project` step of `ci.yml`. RED (`docs`) → GREEN.
- **Minor 4 · fixed:** 34 test titles in `packages/grounds/test/req-124.test.ts` cited REQ-124 only in
  their `describe`, which traceability does not read; each title now starts `REQ-124 · `.
- **Minor 5 · fixed:** the T-090 row's counts (27 = 22 + 7) did not add up; recounted above. The
  recount found Phase 0's first list of minors (six items) never dispositioned:
  - **fixed** `import x = require('d3-scale')` and the type query `import('d3-scale').T` evaded the
    import rules: `lint-rules.test.ts` RED 2 → GREEN (`TSImportEqualsDeclaration`, `TSImportType`);
  - **fixed** `checkConditionOrder` did not recurse into nested condition objects:
    `check-deps.test.ts` RED 2 → GREEN (a first version passed for the wrong reason, a missing
    top-level `types`, and was tightened before the fix);
  - **fixed** `pnpm audit` in CI: nightly job `audit` (`--prod --audit-level high`; clean today);
  - **ruled** below: the ground check's subdirectory convention, the `@silverpoint/source`
    condition, `round2(1.005)`.
- **Ruling (Minor 3):** Angular's Escape listener is a `(document:keydown)` host listener for the
  chart's life, checking `active()` inside, where React and Vue attach theirs only while an item is
  active; the behaviour is the same, and the examples are zoneless — cost if wrong: in an app on
  zone.js every keypress runs change detection once per chart (OnPush, so the check is shallow).
- **Ruling (Minor 6):** the release commit (`version-packages`) is pushed to `develop` directly or
  made on a release branch into `main`, never as a PR into `develop`, whose changeset check would
  refuse a commit that deletes the changeset it consumes — cost if wrong: one refused PR.
- **Ruling (Phase 0 minor):** the REQ-044 ground check recognises a ground as a directory under
  `grounds/src`, the only form a ground takes (`silverpoint/`; `ink/` excluded) — cost if wrong: a
  ground added as a single file escapes the check.
- **Ruling (Phase 0 minor):** the `@silverpoint/source` export condition stays in the published
  manifests: only the workspace's tooling sets that condition, and stripping it would publish a
  manifest other than the tested one — cost if wrong: a consumer who sets it resolves to an
  unpublished `src/` and the build fails loudly.
- **Ruling (Phase 0 minor):** `round2(1.005)` gives `1` (binary floating point); the ≤ 2-decimals
  guarantee and determinism both hold — cost if wrong: a value on an exact half-hundredth of a
  pixel rounds down.


## Phase 4 close

T-090 to T-100 done, and the final review closed. The Implementation Plan's Phase 4 Done criteria all
hold except publishing: WCAG 2.1 AA across the four apps and the site (T-096), REQ-124 in one pass
(T-095), budgets for the six packages (T-094), the 2 ms and 16 ms benchmarks (T-093), the site
with its gallery, playground and quickstart (T-097, T-098), and the full matrix nightly (T-091,
T-092). **`1.0.0` is not yet published (T-101).** Every delta is approved, and the `1.0.0`
changeset is ready. What remains is outside the repository: the `@silverpoint` npm organisation
and Trusted Publishing on npmjs.com. Then `pnpm --filter @silverpoint/release run version-packages`
(the release commit, pushed to `develop`), and `release.yml`.
