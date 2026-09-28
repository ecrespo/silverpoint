# Implementation Plan and Tasks — Phase 6, UI components

> Source specs: [`prd-delta.md`](prd-delta.md) §6 (REQ-300..REQ-333) · [`api-delta.md`](api-delta.md)
> · [`technical-design-delta.md`](technical-design-delta.md) DD-021..DD-027 ·
> [`data-model-delta.md`](data-model-delta.md) §2.14, §3.8, §4–§6.
> Generated: 2026-09-26. Gate 4 **not approved**. Task ids continue the global sequence after T-134.

**Goal.** A consumer builds the controls around their charts —buttons, form controls, tabs, steps,
cards, tags, progress, alerts— in React, Vue or Angular, drawn in the same ground as the charts,
exact where the user reads or aims, accessible, server-rendered, with parity across the three
adapters.

**Done criteria (Phase 6)**
- Every MUST in REQ-300..REQ-333 cited by a test; traceability 0 blocking (REQ-183, REQ-184).
- Parity gate green on the 180 PR / 510 nightly component fixtures; pixel gates green on all.
- The four example apps have the UI page, green in e2e (APG keyboard, forms, hydration) and axe.
- Budgets of REQ-330 green; chart budgets unchanged.
- Docs site: UI section with a live example and generated props per component (REQ-332).
- Released as `0.3.0` (changeset `minor` from 0.2.0) from CI; deltas folded into `specs/`.

**Carried rules.** Test-first; cite the REQ; mutation-check any test written after the code. Gates
that launch Chromium run alone. A component is a catalog row in its own `UI_COMPONENTS` list; every
gate iterates it. Every change touching `packages/` adds a changeset.

## Phases

| Step | Content | Depends on | Exit |
|---|---|---|---|
| 6a | Core: types, value, keyboard, frame variant and outlines, items, names, demo | Approval | Core unit tests + benchmarks green |
| 6b | Grounds: `ui` tokens, piece generator, `ui.css`, contrast and colour lint | 6a | Grounds tests; `ui.css` ≤ 24 KB |
| 6c | Adapters ×3, in three batches: **B1** Button, Input, Checkbox, Switch, Card, Divider · **B2** RadioGroup, Segmented, Tabs, Slider, Rate · **B3** Steps, Tag, Badge, Progress, Alert, Skeleton | 6b | Adapter unit tests per batch; a batch may ship alone (OQ-U3) |
| 6d | Fixtures, parity and pixel gates, mode invariance, budgets | 6c (per batch) | 180 / 510 green |
| 6e | Example apps UI page, e2e (APG, forms, hydration, reduced motion, RTL), axe | 6d | Four apps green |
| 6f | Docs site, changeset, fold deltas, `CLAUDE.md` status | 6e | Release `0.3.0` |

**First run: T-135..T-138 only** (6a), then review before scaling.

## Tasks

### 6a — Core

**[ ] T-135 · UI types and the component catalog row** — REQ-300, REQ-302
- `packages/core/src/ui/types.ts` (API delta §2) on the internal surface; `UI_COMPONENTS` (17 rows:
  name, slug, group, states).
- Tests: the catalog has 17 entries in the PRD's groups; every row names ≥ 1 state; types compile
  (type tests for required `items`/`label`/`name` where the API delta requires them).
- **Done:** tests green; mutation: drop a component → red.

**[ ] T-136 · `uiValue`, `uiProgressArc`, `uiSteps`** — REQ-302, REQ-304, REQ-324 `[P]`
- Tests (RED first): clamping, step rounding from `min`, fraction to 2 decimals, exact ends
  (I-22); invalid `min/max/step/count` → defaults + `SP017`; circle arc strokes are
  `role: 'encoding'` and match the polar engine; step statuses from `current`; `current` clamped.
- **Done:** tests green; benchmark < 0.05 ms per call.

**[ ] T-137 · `uiRovingKey`** — REQ-315, REQ-321, REQ-326 `[P]`
- Tests: every key × orientation × `ltr`/`rtl` × disabled patterns (all disabled, gaps, ends);
  Home/End skip disabled items; arrows wrap at the ends, as the APG tabs and radio-group patterns
  do (Rate and Segmented are radio groups).
- **Done:** tests green; mutation: ignore `dir` → RTL cases red.

**[ ] T-138 · `uiFrameVariant`, `uiFrameOutline`, `uiItems`, `uiRequireName`, `UI_DEMOS`** — REQ-307, REQ-319, REQ-325 `[P]`
- Tests: variant purity and range, `0` without seed and id (I-21); outline per kind is exact
  (`role: 'encoding'` vertices at 2 decimals); duplicate keys → first kept + `SP019`; missing name →
  `SP018`; `UI_DEMOS` deep-frozen with one entry per declared state (45).
- **Done:** tests green. **6a closed.**

### 6b — Grounds

**[ ] T-139 · `ui` tokens on both grounds and the schema** — REQ-312
- Data Model §3.8 values; a ground without `ui` gets the defaults (test with a consumer ground).
- **Done:** tests green; REQ-044 path watch extended to `core/src/ui/**` and adapters' `ui/`.

**[ ] T-140 · Piece generator** — REQ-305, REQ-307 `[P]`
- `packages/grounds/scripts/ui-pieces.ts`: outline per kind → ground inker with a fixed seed per
  variant → 9 pieces → data URIs.
- Tests: same bytes on two runs; `cyanotype` generates none (`frame: 'css'`).
- **Done:** tests green; the pieces appear in `dist/ui.css`.

**[ ] T-141 · `ui.css`** — REQ-301, REQ-305, REQ-306, REQ-308, REQ-316, REQ-317, REQ-320
- Sizes from `--sp-ui-height-*`, frames as masks on `::before`, tones as masks, `precision` border,
  forced-colours block, focus indicator, reduced-motion block, visually-hidden native inputs.
- Lint (RED on seeded violations): no literal colour outside `forced-colors` (I-19); no
  `display: none` on `.sp-ui input`; no `transition`/`animation` outside `prefers-reduced-motion:
  no-preference`.
- **Done:** lint green; `styles.css` byte-identical to 0.2.0 (REQ-301).

**[ ] T-142 · Contrast gate and weight** — REQ-313, REQ-330
- Contrast pairs of Data Model §3.8 on every substrate; `ui.css` ≤ 24 KB gzip in size-limit;
  measure 4 vs 6 variants (OQ-U5).
- **Done:** gate green; OQ-U5 answered with the numbers.

### 6c — Adapters (per batch: React, Vue and Angular tasks may run `[P]`)

**[ ] T-143 · Adapter UI base ×3** — REQ-311, REQ-329, REQ-333
- Config resolution shared with charts (component → dashboard → provider → default, then the
  REQ-123 override); `${id}--${part}` ids; root attributes of the markup contract.
- **Done:** precedence tests green in the three adapters; no framework id hook in emitted ids.

**[ ] T-144 · B1 React** — REQ-300, REQ-304, REQ-310, REQ-314, REQ-322, REQ-326
**[ ] T-145 · B1 Vue** — same REQs, plus REQ-108
**[ ] T-146 · B1 Angular** — same REQs, plus REQ-101, REQ-323 (CVA), DD-024 attribute selectors
- Button, Input, Checkbox, Switch, Card, Divider.
- Tests per component: markup contract, native element and hidden input, controlled/uncontrolled
  (or `v-model`, or `model()` + Reactive Forms), disabled emits nothing, name warning.
- **Done:** B1 unit tests green in the adapter.

**[ ] T-147 · B2 React** · **[ ] T-148 · B2 Vue** · **[ ] T-149 · B2 Angular** — REQ-300, REQ-309, REQ-315, REQ-322, REQ-323, REQ-325, REQ-326
- RadioGroup, Segmented, Tabs (+ TabPanel), Slider, Rate; roving focus through `uiRovingKey`;
  one heightening per instance (I-18).
- **Done:** B2 unit tests green.

**[ ] T-150 · B3 React** · **[ ] T-151 · B3 Vue** · **[ ] T-152 · B3 Angular** — REQ-300, REQ-308, REQ-318, REQ-319
- Steps, Tag, Badge, Progress, Alert, Skeleton; roles per REQ-318; server-safe entries in React.
- **Done:** B3 unit tests green.

### 6d — Gates

**[ ] T-153 · Component fixtures** — REQ-327, REQ-182
- `fixtures/ui/` from `UI_DEMOS` × the matrix of Data Model §5; canonicals from the React server
  render, reviewed.
- **Done:** 510 fixtures generated; manifest counts asserted.

**[ ] T-154 · Parity gate on components** — REQ-327
- The DD-004 tree gate over `fixtures/ui/`, three adapters.
- **Done:** 180 PR fixtures green; nightly 510 green.

**[ ] T-155 · Pixel gates and mode invariance** — REQ-304, REQ-306, REQ-328
- Three gates per fixture at its width; I-17 checked on computed boxes of `ink` vs `precision`.
- **Done:** green in the pinned Docker image.

**[ ] T-156 · Budgets** — REQ-330
- size-limit entries per `ui/<name>` and the UI runtime ×3; `ui.css`.
- **Done:** green; chart budgets unchanged.

### 6e — Example apps

**[ ] T-157 · UI page in the four apps** — REQ-329, REQ-331
- The 17 components from `UI_DEMOS`, under `silverpoint/cream` and `cyanotype`.
- **Done:** e2e: no hydration mismatch (`vite-react`, `vite-vue`, `nextjs`, `angular` with SSR).

**[ ] T-158 · Keyboard, forms and motion e2e** — REQ-315, REQ-316, REQ-317, REQ-320, REQ-321, REQ-323
- APG script per composite; native form submit carries every value; focus ring visible and ≥ 3:1;
  targets ≥ 24 px (I-20); reduced motion; RTL mirror (SHOULD); Firefox and WebKit presence checks.
- **Done:** green in the three browsers.

**[ ] T-159 · Accessibility audit** — REQ-313, REQ-314, REQ-318, REQ-331
- axe on the UI page of every app; manual NVDA and VoiceOver pass recorded in
  `changes/feature-002-ui-components/a11y-audit.md`.
- **Done:** 0 A/AA issues; audit file committed.

### 6f — Close-out

**[ ] T-160 · Docs site UI section** — REQ-332
- `docs/site`: a UI gallery and one page per component, props generated from the types.
- **Done:** docs build green; props not retyped (the generator test).

**[ ] T-161 · Changeset** — release
- `minor` changeset for the seven packages' shared version: `0.3.0`.
- **Done:** `version-packages` dry run shows 0.3.0.

**[ ] T-162 · Fold the deltas** — Art. 9
- PRD v1.11, API v1.9, TD v1.8, DM v1.6, Implementation Plan v1.7 (Phase 6), Constitution v1.7,
  `specs/tasks.md` Deferred table updated.
- **Done:** `spec-check` green.

**[ ] T-163 · Traceability and status** — REQ-183, REQ-184
- `reports/traceability.md` regenerated: every MUST of REQ-300..333 cited; `CLAUDE.md` status table.
- **Done:** 0 blocking.

## Traceability — REQ → tasks

| REQ | Tasks | REQ | Tasks |
|---|---|---|---|
| 300 | T-135, T-144–T-152 | 317 | T-141, T-158 |
| 301 | T-141 | 318 | T-150–T-152, T-159 |
| 302 | T-135, T-136 | 319 | T-138, T-150–T-152 |
| 303 | T-156 (allowlist check in `check-deps`) | 320 | T-141, T-158 |
| 304 | T-136, T-144–T-146, T-155 | 321 | T-137, T-158 |
| 305 | T-140, T-141 | 322 | T-144–T-149 |
| 306 | T-141, T-155 | 323 | T-146, T-149, T-158 |
| 307 | T-138, T-140 | 324 | T-136 |
| 308 | T-141, T-150–T-152 | 325 | T-138, T-147–T-149 |
| 309 | T-147–T-149 | 326 | T-137, T-144–T-149 |
| 310 | T-144–T-146 | 327 | T-153, T-154 |
| 311 | T-143 | 328 | T-155 |
| 312 | T-139 | 329 | T-143, T-157 |
| 313 | T-142, T-159 | 330 | T-142, T-156 |
| 314 | T-144–T-146, T-159 | 331 | T-157, T-159 |
| 315 | T-137, T-147–T-149, T-158 | 332 | T-160 |
| 316 | T-141, T-158 | 333 | T-143 |

Every task cites at least one REQ; no orphan task.

## Constitution check

- **Art. 9** — no task before gate 4; the deltas fold in T-162; every task cites its REQ.
- **Art. 2 / Art. 3** — 6a before 6c: adapters consume the core; 6d holds them to parity per batch.
- **Exception requested:** none.
