# Delta 012 — Everything in 0.2.0: the `cyanotype` ground, Angular's dashboard allowance, Angular SSR

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-26 ("Modifica los Specs para ajustar el versionado, la idea es implementar todo en la versión 0.2: implementa el REQ-028 ajustando los specs, implementa el dashboard en angular mitigando el requerimiento para angular, resuelve la app de ejemplo de angular, añade angular ssr"); ships in `0.2.0`; **folded into `specs/` on 2026-09-26**; **implemented 2026-09-26** (T-124..T-131) |
| **Affects** | Constitution (planned-grounds table, non-normative); PRD §4.1, §5, §6.2 (REQ-028), §6.5 (new REQ-222), §6.10 (REQ-220, REQ-221), §7, §12; API Spec §3.1, §6, §10, §12; Technical Design DD-002, new DD-019, §8, §10; Data Model §3 (new §3.7), §5; Implementation Plan Phase 5; `specs/tasks.md` Deferred table |
| **Raised by** | The user, 2026-09-26, after Phase 5 closed: the release line is `0.x`, so "After v1" means nothing; what is worth shipping ships in `0.2.0` |
| **Release** | `0.2.0` (changeset `minor`). The normalised SVG of every existing fixture is unchanged (§"Blast radius"); a new ground and a new optional attribute are a minor under API Spec §13 |

## Finding

1. **Versioning.** The specs still speak of "v1": success metrics due "Release v1.0" and "v1.1",
   scope limits "in v1", and a Deferred table whose two rows wait "After v1". The user decided on
   2026-09-25 that the line stays on `0.x` and `1.0.0` is parked. "After v1" is now a date that
   may never come, and it hides the one deferred requirement the engine was built for.
2. **REQ-028** (`tonalMechanism: 'weight'`, SHOULD) is the requirement that proves Art. 7: a second
   ground, with a different tonal mechanism, added without touching a chart. The `Ground` type has
   carried `'weight'` since Phase 0.
3. **REQ-220 and Angular.** Measured on the built packages (2026-09-26), a dashboard adds this much
   over the one-chart build, min+gzip: React client 1,872 B, React server 1,731 B, Vue 1,929 B,
   **Angular 2,492 B**. The test holds every dashboard entry at 47 kB, so it passes, but it does not
   check the increment itself, which is what REQ-220 says. Angular misses 2 KB for a structural reason:
   its partial-compilation output (APF) carries each component's template twice (declaration and class
   metadata) and a metadata record for each of the 13 signal inputs. The adapter's own code is as small
   as React's.
4. **Angular SSR.** The `angular` example app is client-rendered (`APPS.angular.ssr: false`), so
   the hydration tests of REQ-103, REQ-207 and REQ-221 skip it. Angular's *server render* is proven
   by the tree gate (`renderApplication`); what no test covers is a real Angular CLI SSR app
   hydrating in a browser. That is the integration CLAUDE.md calls first-class ("Integrations: Vite,
   Next.js, Angular CLI").

## Proposal

### A. Versioning

- Every "v1" that dates a target becomes **`0.2.0`**: the §4.1 metrics are all met by `0.2.0`,
  including "add the second ground without touching chart code", which REQ-028 now delivers.
- Scope limits that say "in v1" describe the `0.x` line and say so.
- The Deferred table's targets are releases that exist: REQ-028 is implemented and leaves the table;
  REQ-047 (the Tailwind preset, COULD) stays, with target **"After 0.2.0"**. It needs a new package
  and, before its first release, a trusted publisher on npmjs.com that only the user can create.

### B. The `cyanotype` ground (REQ-028)

- **Tokens** (Data Model §3.7). One substrate, `prussian` `#1B3F6B`, white-line inks computed
  against it. The ground has one substrate, so its colours sit on the ground-wide rule. A chart that names
  another substrate (the library default is `cream`) is still painted on Prussian blue.
- **Heightening inverts.** On a dark ground, white is the ink, so the heightened element is the
  deepest blue (`#0C2240`), a reserve. REQ-031's outline in the main ink still applies, and it is what
  carries the contrast (13.11:1 against `primary`).
- **The weight ramp.** `ToneSpec` gains a variant `{ style: 'weight'; weight: number }`. The
  cyanotype ramp is 1.5, 2.25, 3 and 4 times the stroke width, for levels 1 to 4.
- **`WeightInker`** (`@silverpoint/grounds`, name `'weight'`). It does not use rough.js: a cyanotype
  is a contact print, so its line is exact. It returns every stroke untouched, except that a toned
  shape becomes its own outline with `paint: 'stroke'` and the internal `tonalWeight` set to its
  tonal level. It emits
  no hatch, no tile and no `<pattern>` (REQ-028: "SHALL omit all hatching"). The vertices do not move
  (Art. 1).
- **The view.** `PathView` gains `weight`, written as `data-weight` and omitted when `null`, like
  `data-dash`. The three adapters map it one to one (Art. 2). The stylesheet resolves it:
  `.sp-chart [data-weight='n'] { stroke-width: calc(var(--sp-stroke-width) * var(--sp-weight-n)) }`,
  with `--sp-weight-1..4` declared by the ground. `Stroke.weight` is left alone: it is a relative
  weight that `BulletChart`'s target tick already sets and the view never wrote, and giving it the new
  meaning would have changed 48 `silverpoint` canonicals (found while regenerating, T-128).
- **Precision mode** is the `NullInker`, as in every ground: no hatch there, no weight here. The
  encoding vertices are identical in both modes (REQ-006).
- **Registered by default** beside `silverpoint`; `cyanotype` and `WeightInker` are exported.
- **Fixtures.** The matrix gains `cyanotype` × `prussian` × both modes × three sizes, `tile` only:
  `hatchFill` has no effect under `weight`, so the axis collapses. That is 198 nightly fixtures and 66 more on PR (330 in all),
  each with a golden. The dashboard fixtures gain `cyanotype` × `prussian` × both modes: 6 more tree
  fixtures and 18 more pixel fixtures.
- **Contrast gate** audits both grounds.

### C. REQ-220 with an allowance per adapter

> REQ-220 · unwanted · IF an adapter's `dashboard` subpath adds to its one-chart build more than
> its allowance min+gzip —2 KB for React (client and server) and Vue, 3 KB for Angular, whose
> partial-compilation output carries each component's template and input metadata— THEN CI SHALL
> fail (REQ-164). · MUST

- The size-limit budgets become 47 kB for React and Vue, and **48 kB** for Angular.
- A new test measures the increment itself: the dashboard entry minus its one-chart entry must be
  within the allowance, for each of the four pairs. REQ-220 is then enforced as written, not through
  a proxy.

### D. Angular CLI SSR (new REQ-222)

> REQ-222 · event · WHEN the Angular CLI app renders on the server with `@angular/ssr`, THE SYSTEM
> SHALL produce markup that hydrates without mismatches. · MUST

- `examples/angular` becomes an `@angular/ssr` app: `outputMode: 'server'`, one server route
  `'**'` rendered per request (the gates pass their fixture in the query string, which
  prerendering cannot see), `provideClientHydration()`, and a Node server built on
  `AngularNodeAppEngine`.
- The app reads its URL through `PlatformLocation`, not `location`, so the same component
  renders on both sides.
- `APPS.angular.ssr` becomes `true`: the hydration tests of REQ-103/109 (chart) and REQ-207/221
  (dashboard) run against Angular as they do against Next.js and Vue.
- The "ruled deviation" in the feature-001 ledger (Angular example client-rendered) is closed.

## Blast radius

- **Canonical fixtures: none of the existing 1,584 + 24 change.** `data-weight` is omitted when
  `null`, and no `silverpoint` stroke carries a tonal weight.
- **Adapters:** one attribute each, in React `chart-svg.tsx`, Vue `ChartPath.vue` and Angular `chart-frame.ts`.
- **Chart recipes: none touched** (PRD §4.1 "0 chart files modified", REQ-044).
- **Budgets:** the core view gains one field, and grounds gains a ground and an inker. Every budget
  is re-measured.

## Tasks

Task ids continue the global sequence from T-123.

**[x] T-124 · Specs** — Art. 9
- Fold §A–§D into `specs/`, with version bumps and history rows. Remove REQ-028 from the
  Deferred table once T-127 cites it; retarget REQ-047.

**[x] T-125 · The weight tonal mechanism** — REQ-028, REQ-006, REQ-022
- Test-first: `ToneSpec`'s `weight` variant; `WeightInker` turns a toned shape into its outline
  with `tonalWeight` = tone and `paint: 'stroke'`, emits no hatch, no tile, no pattern, and leaves
  every vertex and every untoned stroke as given; `toSvgView` writes `weight` and `svgString`
  writes `data-weight` (omitted when absent).

**[x] T-126 · `data-weight` in the three adapters** — REQ-028, REQ-100, REQ-102
- Test-first per adapter: a weighted stroke renders `data-weight`; an unweighted one does not.

**[x] T-127 · The `cyanotype` ground** — REQ-028, REQ-040, REQ-041, REQ-044, REQ-126, REQ-127
- Test-first: tokens of Data Model §3.7; JSON round-trip; registered by default; the stylesheet
  declares its variables and the weight rule; the contrast gate passes both grounds and bites
  on a lightened substrate; rendering every catalog chart in `cyanotype` emits no `hatch` role
  and no `<pattern>`, and touches no chart file.

**[x] T-128 · Fixtures and goldens** — REQ-100, REQ-180, REQ-181, REQ-210, REQ-211
- Extend the fixture generator and the dashboard fixtures; regenerate; the tree gate and the
  pixel gate (Docker) pass with the new goldens.

**[x] T-129 · REQ-220 per adapter** — REQ-220
- Test-first: the increment of each dashboard entry over its one-chart entry is within its
  allowance (RED against a 2 KB Angular allowance); Angular's budget becomes 48 kB.

**[x] T-130 · Angular CLI SSR** — REQ-222, REQ-103, REQ-109, REQ-207, REQ-221
- `@angular/ssr` in `examples/angular`; `APPS.angular.ssr: true` (RED: the hydration tests
  now run and fail before the server exists); e2e green on all four apps.

**[x] T-131 · Close** — Art. 9
- Changeset `minor`; docs site lists the ground; CLAUDE.md status, README, ledgers.

## Execution log

*Closed 2026-09-26.* All eight tasks, test-first.

- **Found while regenerating (T-128).** `Stroke.weight` was not unused. `BulletChart`'s target tick
  sets `weight: 2`, a relative weight the view never wrote. Writing it as `data-weight` changed 48
  `silverpoint` canonicals, and the diff caught it. The tonal level now travels as the internal
  `Stroke.tonalWeight`, a test holds the difference, and no existing canonical changed. §B is
  amended to match.
- **Found running the Angular example under SSR (T-130).** A cell that an `@for` generates is
  queried before its inputs are set, while an earlier cell's chart already renders. The dashboard
  resolved the layout with that cell unnamed and warned a transient `SP015` for every layout cell.
  The HTML was right, and no gate saw the warning. Fixed test-first (`e650762`): until every cell's
  `ngOnInit` has run, children go in source order with no layout.
- **Also needed by Angular SSR.** A router with one component-less `'**'` route, because without a
  router the SSR engine serves only `/`. `allowedHosts: ['localhost', '127.0.0.1']`, because
  Angular 21 guards against SSRF.
- **REQ-220 measured:** React client +1,872 B, React server +1,731 B, Vue +1,929 B, Angular +2,479 B.
  The mutation check fails a 2 KB Angular allowance.
- **Weight:** `ops` server HTML is 78 KB in `cyanotype` against 130 KB in `silverpoint`, because there
  is no hatching.
- **CI:**
  - unit: 3,329 tests.
  - gates: 316 tests. The tree gate covers 330 PR chart fixtures and 30 dashboard fixtures × 3
    adapters.
  - traceability: 121/121 MUST, 0 deferred, 0 blocking.
  - pixel (Docker): 1,696, with 84 new `cyanotype` goldens, reviewed by eye.
  - e2e: 541 passed. The 2 skipped are `vite-react`'s hydration tests; that app is client-rendered by
    design.

## Constitution check

- **Art. 1.** `WeightInker` leaves every vertex exact. The weight is a stroke width set by the
  stylesheet, not a change to the geometry.
- **Art. 2.** Each adapter maps one more attribute. The weight inker lives in `grounds` and the view
  in `core`.
- **Art. 3.** The new ground enters the fixture matrix and both gates. No existing canonical changes.
- **Art. 4.** The weight inker uses no seed and no randomness.
- **Art. 6.** `weight` is a tonal mechanism with no fill opacity. REQ-023 holds, and the ground
  declares `tonalMechanism: 'weight'`.
- **Art. 7.** The ground is data, and is added without touching a chart (REQ-044).
- **Art. 9.** A delta, approved and folded before implementation. Each task cites its REQ.
- **Exception requested:** none. REQ-220's allowance for Angular is an amendment to the requirement,
  approved by the user, not an exception to an article.
