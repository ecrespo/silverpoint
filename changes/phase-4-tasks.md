# Tasks — Phase 4, close-out

> Source specs: [Implementation Plan](../specs/implementation-plan.md) v1.3 Phase 4 and §7 (global
> Definition of Done) · [PRD](../specs/prd.md) v1.7 §4.1, §5.1, NFR "Performance", REQ-100,
> REQ-120..127, REQ-160..164, REQ-180..184 · [Technical Design](../specs/technical-design.md) v1.4
> §2, §8, §9 · [Data Model](../specs/data-model.md) v1.3 §5 (fixture coverage).
> Generated: 2026-09-24, as Phase 3 closed at `e9bb182`. `specs/` is read-only in this checkout, so
> the phase's tasks live here. Task ids continue the global sequence from T-090.

**Goal.** Publishable: every gate green over the whole catalog and the full matrix, the catalog
audited as a whole, documentation a newcomer can start from, and `1.0.0` ready to publish.

**Done criteria (Implementation Plan, Phase 4)**
- WCAG 2.1 AA audit across all four apps, no A or AA issues.
- REQ-124 verified across the whole catalog as a single pass, not chart by chart.
- Bundle budgets green for all six packages.
- The 2 ms and 16 ms benchmarks green.
- Documentation site with gallery, ground playground and the 10-minute quickstart.
- The full 1,584-fixture matrix green on the nightly run.
- `1.0.0` published; the API Spec comes into force.

**Carried from Phases 0-3.** A chart is a catalog row; every gate iterates the catalog. Gates that
launch Chromium run alone (never the Docker pixel job beside local e2e). `next dev` writes
`AGENTS.md`/`CLAUDE.md` into `examples/nextjs` — never committed.

## Tasks

### Debt carried into the close-out

**[ ] T-090 · Deferred minors**
- **What**: every `minor (deferred)` of the Phase 0-3 ledgers (5 + 5 + 8 + 10, plus Phase 0's list)
  triaged by effect: fixed test-first where a person using the library meets it (a silent drop, a
  wrong description, an unreachable item, a misleading message), otherwise ledgered as a ruling
  with its cost. The global DoD allows no known debt without its issue.
- **REQ**: as each minor cites · Implementation Plan §7
- **Done**: each minor has a `fixed` line (with its RED → GREEN test) or a `Ruling:` line.

### The full matrix

**[ ] T-091 · 1,584 fixtures** `[P]`
- **What**: the matrix generator covers the nightly product — 33 charts × 2 modes × 4 substrates ×
  2 `hatchFill` × 3 sizes — with a canonical per cell (measured: 11.9 MB of canonical text, so they
  are committed like the PR matrix's 264); `FIXTURES` exposes the PR subset (`md`, `tile`: 264) and
  the full set.
- **REQ**: REQ-182 · Data Model §5
- **Done**: a fixture test pins 1,584 cells and 264 on PR; every canonical round-trips.

**[ ] T-092 · Full-matrix gates on the nightly run**
- **What**: the string gate over all 1,584 × 3 adapters, and the pixel gate over the full matrix in
  the pinned image, in `nightly.yml`; the PR jobs keep the reduced matrix.
- **REQ**: REQ-180, REQ-181 · TD §8
- **Done**: both run locally green over the full matrix (string gate on Node; pixel in Docker, run
  alone); the nightly workflow runs them.

### Performance and budgets

**[ ] T-093 · The 16 ms render benchmark** `[P]`
- **What**: a benchmark of the full initial render of a card, inking included (recipe → inked
  SVG string), for every catalog chart at `md`, reported beside the 2 ms geometry benchmark.
- **REQ**: PRD NFR "Performance" · TD §2, §8
- **Done**: every chart under 16 ms locally; the nightly report shows both thresholds.

**[ ] T-094 · Budgets for all six packages** `[P]`
- **What**: check that `size-limit` covers core, grounds, react, vue, angular and fonts, and that
  the PRD's adoption metric — `@silverpoint/react` + core with one chart, minified and compressed,
  < 45 KB — holds for every chart; a coverage test pins it.
- **REQ**: REQ-164 · PRD §4.1
- **Done**: `pnpm exec size-limit` green; the coverage test fails if a package or a chart lacks an entry.

### Audits over the whole catalog

**[ ] T-095 · REQ-124, one pass over the catalog**
- **What**: one review of all 33 charts together (`changes/phase-4-req-124-review.md`), comparing
  like channels across charts rather than chart by chart, and one catalog-driven test proving that
  `precision` (no hatching) still carries every item for every chart.
- **REQ**: REQ-124
- **Done**: the review and the test; the test mutation-checked.

**[ ] T-096 · WCAG 2.1 AA audit of the four apps**
- **What**: axe-core already runs on every app; the audit adds the AA criteria axe cannot decide —
  keyboard operation (2.1.1, 2.1.2), focus visible (2.4.7), focus order (2.4.3), non-text contrast
  of the chart ink and focus ring (1.4.11), reflow at 320 CSS px (1.4.10), text spacing (1.4.12),
  reduced motion — each as a Playwright check where it can be automated, and a written audit
  (`changes/phase-4-wcag-audit.md`) listing every A and AA criterion with its verdict.
- **REQ**: REQ-120..REQ-125 · PRD §4.1
- **Done**: zero A or AA issues across the four apps; the audit lists every criterion.

### Documentation

**[ ] T-097 · Documentation site**
- **What**: a static site (`docs/site`, Vite + React — a validated integration, so the site
  consumes the packages as a user does): the gallery of 33 charts, a ground playground (substrate,
  mode, `hatchFill`, size, seed), each chart's props, and one fixture shown as rendered by all
  three adapters (PRD acceptance, REQ-100).
- **REQ**: PRD §5.1 · REQ-100
- **Done**: the site builds; an e2e test opens the gallery, the playground and the adapter page,
  and axe finds no A or AA issue there.

**[ ] T-098 · The 10-minute quickstart**
- **What**: a quickstart for each framework (React, Vue, Angular) in the site and the README; a
  test that follows it literally — packed tarballs installed into a fresh Vite app, the snippet
  pasted, the first chart rendered — and times it.
- **REQ**: PRD §4.2 (from `install` to first render in < 10 minutes)
- **Done**: the quickstart test passes for the three frameworks.

### Release

**[ ] T-099 · Versioning and changelog**
- **What**: Changesets (TD §9: every PR touching `packages/` carries a changeset; the six packages
  share one version), a CI check for the changeset, and a `1.0.0` changelog entry.
- **REQ**: REQ-160, REQ-161 · TD §9
- **Done**: `changeset version` produces `1.0.0` in all six packages; the CI check fails without a
  changeset.

**[ ] T-100 · Analyze gate and traceability**
- **What**: re-run traceability over the whole PRD: every MUST cited by a test or deferred with a
  target; the Analyze findings (B-01..B-05) settled or carried; the deltas' status listed.
- **REQ**: REQ-183, REQ-184 · Implementation Plan §6
- **Done**: the traceability report shows no uncited MUST.

**[ ] T-101 · Publish `1.0.0`** — **needs the user**
- **What**: publish the six packages from `release.yml`. Prerequisites outside the repository: the
  `@silverpoint` npm organisation and Trusted Publishing on npmjs.com; and the user's approval of
  the PROPOSED deltas (001-005, 008-010), because `1.0.0` puts the API Spec in force.
- **REQ**: REQ-160 · TD §9
- **Done**: the user approves and the release workflow publishes; until then the phase closes with
  this task open, as Phase 0 closed with `0.1.0` unpublished.

## Order

T-090 first (it touches the recipes, so the matrix and the goldens are cut after it); T-091 →
T-092; T-093, T-094 and T-095 in parallel; T-096 after T-097 so the site is audited with the apps;
T-098 after T-097; T-099 and T-100 last; T-101 waits for the user.
