# Delta 011 — View props apply to the demo; VolvelleChart's index turns the demo too

| Field | Value |
|---|---|
| **Status** | `APPROVED` by the user on 2026-09-25 ("Apruebo el cambio que mencionas, las 4 puertas del dashboard y el delta-011"); ships in `0.2.0`; **folded into `specs/` on 2026-09-25** |
| **Affects** | PRD §6.4 (new REQ-098, REQ-099 under the cross-cutting catalog requirements); API Spec §5 (`data` JSDoc), §7 (`VolvelleChart` row, a note); Data Model §4 (demo datasets); delta-010 (the `indexRing`/`indexValue` bullet) |
| **Supersedes** | The Phase 3 minor **M-6** (`changes/phase-3-progress.md`), fixed in T-090 by warning `SP002` rather than by applying the index |
| **Raised by** | User report, 2026-09-25: "someone who tries the prop without data believes it does not work, and the warning is only seen in the console" |
| **Release** | `0.2.0` (changeset `minor` from 0.1.1; user decision 2026-09-25) — the normalised SVG changes for inputs that today warn (`indexRing`/`indexValue` without `data`); no default value changes, no canonical fixture changes (§"Blast radius") |

## Finding

`packages/core/src/charts/volvelle-chart/volvelle-chart.ts` ignores `indexRing` and `indexValue`
when `data` is omitted and warns, in development only:

> SP002 · VolvelleChart · indexValue — Without `data` the demo keeps its own index; `indexRing` and
> `indexValue` apply to your rings.

It is deliberate (M-6, T-090): the demo stays the same whatever is passed. The cost is the
experience. The demo is where a newcomer tries a prop first — the documentation site's
playground and the quickstart both start without `data` — and there the prop visibly does
nothing. The warning is stripped from production builds (API Spec §11) and never reaches the page.
The props table (`docs/site/generated/props.json`, read from the JSDoc in
`packages/core/src/types/props.ts`) says nothing about it either.

The rule behind the choice was never written down, and the catalog already follows a better one
without naming it:

| Prop kind | What it does | Under the demo today |
|---|---|---|
| **Accessor** (`xKey`, `valueKey`, `secondaryKey`, `pointKey`, `toneKey`, `keys`, `names`, …) | Says where a field lives in *your* rows | Ignored — correctly: the demo's rows have their own shape, and a key into the consumer's shape means nothing there |
| **View** (`rings`, `metric`, `delta`, `orientation`, `curve`, `legend`, …) | Chooses what the chart shows | Applied — `VolvelleChart`'s own `rings` caps the demo's rings; `KpiCard`'s `metric` and `delta` override the demo's |
| `indexRing`, `indexValue` | Choose which segment faces the pointer | **Ignored** — the one view prop that is |

`indexRing`/`indexValue` are view props: they pick a reading of the rings that are drawn, and the
demo's rings (`Day`, `Shift`, `Team` — Data Model §4, `VOLVELLE_CHART_DEMO`) are as addressable
as the consumer's.

## Options weighed

| Option | For | Against |
|---|---|---|
| A. Apply the index to the demo | The prop works where it is first tried; matches `rings` and `KpiCard`; the demo stays **deterministic** (same props → same SVG, REQ-005), which was the real concern behind "stable" | The demo's drawing now depends on two props — as it already does on `rings` |
| B. Document it in the props table | Zero behaviour change | The prop still does nothing in the playground; documentation of a surprise is not a fix |
| **A + B (chosen)** | A fixes Volvelle; B writes down the accessor/view rule so the next chart does not re-decide it, and tells a reader why `xKey` without `data` does nothing | Two small edits instead of one |

## Proposal

1. **Rule (REQ-098).** Under the demo dataset, a chart ignores its accessor props and applies its
   view props exactly as it would to consumer data.
2. **Volvelle.** Without `data`, `indexRing` and `indexValue` address the demo's rings as
   delta-010 defines for consumer rings: `indexRing` is 0-based over the demo's rings as given,
   `indexValue` names a segment of that ring, and an out-of-range ring or an absent value raises
   `SP002` and falls back to the default — the same fallback and message as with consumer data.
   `<VolvelleChart indexRing={1} indexValue="Night" />` turns the demo so `Night` faces the pointer
   and the readout becomes `Day … · Shift Night · Team …`.
3. **The warning goes.** The "demo keeps its own index" `SP002` is removed; the misuse it covered
   no longer exists.
4. **Documentation (REQ-099).** The props reference states, for every own prop, how it behaves
   without `data`:
   - `CommonChartProps.data` JSDoc: *"If omitted, the demo dataset is rendered (REQ-093): accessor
     props (`…Key`, `keys`, `names`) are ignored, every other prop applies."*
   - Each accessor prop's JSDoc ends with *"Ignored without `data`."*
   - `VolvelleChartProps.indexRing` / `indexValue` JSDoc names the demo's rings: *"Without `data`,
     it addresses the demo's rings: `Day`, `Shift`, `Team`."*

### PRD additions (§6.4, cross-cutting catalog requirements)

| ID | Pattern | Criterion | Priority |
|---|---|---|---|
| REQ-098 | state | WHILE a chart renders its demo dataset, THE SYSTEM SHALL ignore the chart's accessor props and SHALL apply every other own prop as it would to consumer data. | MUST |
| REQ-099 | ubiquitous | The props reference SHALL state, for every accessor prop, that it is ignored without `data`. | MUST |

### Delta-010 amendment

The bullet *"`indexRing` (0-based, default 0) and `indexValue` …"* gains: *"They apply to the demo
rings as to the consumer's (REQ-098)."*

## Blast radius

- **Canonical fixtures: none change.** The fixture matrix renders the demo with no `indexRing`
  or `indexValue` (Data Model §5), which keeps the default index.
- **Tests that change:** `close-out-minors.test.ts` M-6 asserts the warning; it is rewritten to
  assert the turn (RED first — it fails against today's code because the demo does not turn).
- **Other charts:** the audit in T-104 found no other view prop ignored under the demo (§Finding
  table). T-104 keeps it that way with a catalog-driven test.
- **Adapters:** none — the change lives in the core recipe (Art. 2).

## Tasks

Task ids continue the global sequence from T-101.

**[x] T-102 · Volvelle's index turns the demo** — REQ-098, REQ-090
- Test-first in `packages/core/test/close-out-minors.test.ts` (M-6 rewritten) and
  `phase3-charts.test.ts`: without `data`, `indexRing: 1, indexValue: 'Night'` puts `Shift Night`
  in the readout and the description; out-of-range `indexRing: 9` and absent `indexValue: 'Nope'`
  on the demo warn `SP002` with the same message as with consumer data and fall back; no
  `indexRing`/`indexValue` leaves the demo's SVG byte-identical to today's canonical render.
- Remove the `usesDemo` branches from the index resolution in `volvelle-chart.ts`; drop the warning.
- **Done:** the tests are green; `tools/visual-gate` reports no canonical changed. *Closed 2026-09-26: core 811, unit job 2796, gates 311, pixel 1068 (Docker), e2e 509 — all green; no canonical changed.*

**[ ] T-103 · The props reference says what the demo ignores** — REQ-099 `[P]`
- Test-first in `docs/site/test/props.test.ts`: every own prop whose name ends in `Key`, plus
  `keys` and `names`, has a `doc` ending "Ignored without `data`."; `CommonChartProps.data`'s doc
  states the rule; `VolvelleChart.indexRing`'s doc names the demo's rings.
- Edit the JSDoc in `packages/core/src/types/props.ts`; regenerate `docs/site/generated/props.json`.
- **Done:** test green; the site's VolvelleChart page shows the note.

**[ ] T-104 · The catalog keeps the rule** — REQ-098 `[P]`
- Catalog-driven test in `packages/core/test/catalog-contract.test.ts`: each catalog row declares
  one view-prop probe (a value other than the default); building the chart without `data` with
  and without the probe yields different geometry, and emits no diagnostic.
- Mutation-check: reinstate the `usesDemo` guard in Volvelle → the test goes red.
- **Done:** 33 rows covered; mutation check recorded in the ledger.

**[ ] T-105 · Release note** — Art. 9
- Changeset `minor` for `@silverpoint/core` (the fixed group bumps all six to `0.2.0`) naming the
  behaviour change. (REQ-098/099 and the delta-010 amendment were folded into `specs/` on
  2026-09-25; on close, move REQ-098/099 out of the Deferred table of `specs/tasks.md`.)

## Decision

- ~~**Before or after 1.0.0?**~~ **Decided 2026-09-25 by the user:** the line stays on 0.x; this
  ships in **`0.2.0`** (changeset `minor` from 0.1.1). The `1.0.0` changeset stays parked in
  `changes/release-1.0.0-changeset.md`. Original recommendation, for the record: before 1.0.0 — it is the cheaper moment, and the prop's current
  behaviour is the kind that ends up relied on.

## Constitution check

- **Art. 4** — the demo stays deterministic: the same props give the same SVG; what changes is
  that two more props are part of "the same props". No new source of variation.
- **Art. 2** — the change is confined to the core recipe; no adapter touched.
- **Art. 3** — no canonical fixture changes (defaults unchanged); the parity gate is unaffected.
- **Art. 9** — enters as a delta, supersedes a ruled minor explicitly, and each task cites its REQ.
- **Exception requested:** none.
