# Analyze — feature-004 cross-artifact validation

| Field | Value |
|---|---|
| **Status** | Drafted 2026-10-18 over gates 0..4 · **0 blocking** · gates approved 2026-10-18 |
| **Artifacts** | [`research.md`](research.md), [`prd-delta.md`](prd-delta.md), [`api-delta.md`](api-delta.md), [`technical-design-delta.md`](technical-design-delta.md), [`data-model-delta.md`](data-model-delta.md), [`plan-and-tasks.md`](plan-and-tasks.md), [`constitution-amendment.md`](constitution-amendment.md) |

## 1. Coverage — every requirement has a task

| Requirements | Tasks |
|---|---|
| REQ-460..REQ-462, REQ-467, REQ-468 | T-200, T-212 |
| REQ-463..REQ-466 | T-201, T-209 |
| REQ-470, REQ-471 | T-206, T-208, T-213, T-214 |
| REQ-472..REQ-485, REQ-487 | T-206, T-213, T-214 |
| REQ-474, REQ-476, REQ-486 | T-202, T-203 |
| REQ-488 | T-214, T-216 |
| REQ-489 | T-213 |
| REQ-490..REQ-503 | T-204, T-205, T-207, T-215, T-216, T-223 |
| REQ-510..REQ-515 | T-205, T-208, T-211, T-221 |
| REQ-516, REQ-517 | T-217, T-218, T-219 |
| REQ-518, REQ-519 | T-200 (measure), T-220 |
| REQ-520 | T-222, T-223 |
| REQ-521 | T-224 |
| REQ-522 | T-209, T-210, T-218, T-223 |
| REQ-523 (SHOULD) | T-204, T-223 |

57 of 57 covered; no task without a requirement.

## 2. Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| A-01 | major | `paletteStyle` on the chart path may push one-chart builds past the REQ-444 allowance (0.25 KB uncompressed) | Measured in T-200: ≈ 0.56 KB for the core part. **User decision 2026-10-18 (OQ-C3):** re-baseline REQ-444 to `0.6.0` with a 1 KB allowance for the palette (T-220) |
| A-02 | minor | Reflex's `left`/`right` sides do not mirror in RTL | Renamed `start`/`end` in the API (REQ-523) |
| A-03 | minor | Reflex hatches table rows with a CSS gradient over a mixed transparent colour, and the backdrop with opacity — both against Art. 6 | Replaced by the ground's ramp (REQ-475, REQ-499, DD-038, DD-040); I-24 makes it a lint |
| A-04 | minor | `sp_trigger` has no reason to exist outside Reflex | Dropped; every overlay takes a trigger slot, `SpButton` is the usual trigger (research §4) |
| A-05 | minor | TimelineJS needs its own stylesheet before ours | Documented in the API (§1) and the docs; the example apps import it |
| A-06 | minor | A Select's hidden `<input type="hidden" name>` is not validated by the browser, so `required` cannot be native | `required` sets `aria-required="true"` and, in Angular, the `required` validator through the CVA; documented as not native |
| A-07 | minor | The palette's `focus` field sets `--sp-ui-focus-color`, which `ui.css` defaults to `var(--sp-ink)` on the same root | Inline declaration wins over the `:where()` default; T-212 tests it |
| A-08 | note | Reflex's `sp_collapse` names an accordion group by `id(items)` (a Python object id: not stable across renders) | `${id}--accordion` from the component's `id` (REQ-329, DD-040) |
| A-09 | note | Reflex's table renders `rx.cond` for an empty var; static and dynamic data are the same in the three adapters | One `emptyText` row, one tree |
| A-10 | note | Reflex 0.7 has no Vue or Angular counterpart to compare with | The reference is the core's canonical render, as for every fixture (Art. 3) |

## 3. Consistency checks

- **Counts.** PRD: 57 requirements (56 MUST, 1 SHOULD), REQ-460..REQ-523 with gaps 469 and
  504..509 left free. Catalog: 21 rows + `SpTimeline`; companions `SpAvatarGroup`,
  `SpCollapseItem`, `SpToaster` in their rows' subpaths. Fixtures: 36 states → 360 nightly / 144 PR,
  plus 36 palette fixtures.
- **Diagnostics.** `SP023`..`SP025` new, each with one REQ; `SP017`..`SP019` widened. 22 → 25.
- **Design decisions.** DD-037..DD-043, after DD-036.
- **Tasks.** T-200..T-225, after T-199.
- **Constitution.** v1.9 amends the preamble, Art. 3 and Art. 6; no exception requested.

## 4. Decisions the user took (2026-10-18)

| # | Question | Decision |
|---|---|---|
| OQ-C1 | Overlay behaviour: platform or per-framework headless library | Platform: `<dialog>`, Popover API, core keyboard and placement |
| OQ-C2 | The Knight Lab timeline | Optional `timeline` subpath, optional peer, skin in `@silverpoint/grounds/timeline.css` |
| — | SDD process | All gates drafted together, one approval, then phases with a review at each end |
| — | Branch | `feat/silverpoint-0.7` off `develop` |
