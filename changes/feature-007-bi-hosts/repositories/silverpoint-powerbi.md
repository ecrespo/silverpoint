# Spec pack — `silverpoint-powerbi`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/silverpoint-powerbi` |
| **Published as** | `silverpoint.pbiviz` on GitHub Releases; AppSource and certification later (silverpoint D6) |
| **Licence** | MIT |
| **Description** | Power BI custom visual that draws silverpoint charts from report fields. |
| **Draws with** | `@silverpoint/embed` (client and `/hosts`), bundled by `pbiviz` |
| **Wave** | 2 |
| **Ids** | `PBI-REQ-nnn`, `PBI-DD-nn`, `PBI-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8, and:

- **PBI-Art. 1 — Certifiable from the first commit.** `capabilities.json` SHALL declare
  `"privileges": []`. THE VISUAL SHALL pass `pbiviz package --certification-audit` and
  `eslint-plugin-powerbi-visuals` in CI, whether or not certification is requested.
- **PBI-Art. 2 — The report's query is the data.** THE VISUAL SHALL bind what the data view holds
  and SHALL tell the user when the data view was truncated by the host's data reduction.

Stack: TypeScript; `powerbi-visuals-tools` (latest) and the latest visuals API; the formatting-model
utilities; Jest; Playwright against a static harness that feeds recorded data views.

## Scope

**In:** one visual, a chart picker, generic field wells mapped to each chart's roles, the format
pane, theme and high-contrast, selection, rendering events, a landing page, localisation (en, es).
**Out (first release):** drill-down, bookmarks beyond what properties give for free, report-page
tooltips, AppSource submission.

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| PBI-REQ-001 | THE VISUAL SHALL declare two field wells, *Categories* (grouping, several fields) and *Values* (measures, several fields), and a `table` data view mapping over both. | MUST |
| PBI-REQ-002 | THE FORMAT PANE SHALL offer a *Chart* card with the chart type —every chart of the pinned host catalog whose `binding` is not `none`, grouped by family— and SHALL list, for the chosen chart, which well position feeds which role. | MUST |
| PBI-REQ-003 | THE VISUAL SHALL assign fields to the chosen chart's roles in the order of the generated role table: dimension and temporal roles from *Categories*, measure roles from *Values*, each in catalog order, required roles first. | MUST |
| PBI-REQ-004 | IF a required role has no field, THEN THE VISUAL SHALL show, in place of the chart, a message naming the missing roles and the well each belongs to. | MUST |
| PBI-REQ-005 | THE FORMAT PANE SHALL offer the chosen chart's options, the common view options (title, description, data table) and an *Appearance* card (ground, substrate, mode, palette), generated from the host catalog. | MUST |
| PBI-REQ-006 | THE VISUAL SHALL bind the data view's table with `specFromTable` and draw with the embed client, updating in place on every `update` whose data or settings changed, and resizing with the viewport. | MUST |
| PBI-REQ-007 | WHILE the host reports high contrast, THE VISUAL SHALL draw in `precision` mode; otherwise the default appearance SHALL come from `hostAppearance` over the report theme's background and foreground. | MUST |
| PBI-REQ-008 | WHEN an item is chosen in a chart with a single dimension role, THE VISUAL SHALL select the matching data point through the selection manager, so other visuals cross-highlight; a click on the background SHALL clear it. | SHOULD |
| PBI-REQ-009 | THE VISUAL SHALL call the rendering-started, -finished and -failed events around every draw. | MUST |
| PBI-REQ-010 | WHILE no field is bound, THE VISUAL SHALL show a landing page that says what to drop where. | MUST |
| PBI-REQ-011 | IF the data view's metadata says more rows exist than were delivered, THEN THE VISUAL SHALL show a notice with the delivered count. | MUST |
| PBI-REQ-012 | THE VISUAL SHALL use the `full` engine, so EB Garamond is drawn with no request, and SHALL make none. | MUST |
| PBI-REQ-013 | THE VISUAL'S own strings SHALL be localised through the visuals localisation API, English and Spanish shipped. | MUST |
| PBI-REQ-014 | CI SHALL run the conformance kit against the engine inside the packaged visual's bundle, and the certification audit. | MUST |

## Design decisions

- **PBI-DD-01 — One visual.** A report author adds one visual from one file; sixty `.pbiviz`
  files would be unmanageable in a tenant.
- **PBI-DD-02 — Generic wells, generated role table.** Power BI fixes `dataRoles` at package time,
  so a visual with a chart picker cannot rename its wells per chart. Two wells cover every tabular
  chart: `scripts/make-capabilities.ts` writes `capabilities.json`'s objects and
  `src/roles.generated.ts` (chart → ordered roles per well) from the host catalog (H-3). PBI-REQ-002
  is what makes the positional mapping legible. *PoC first (PBI-T-02): if the positional mapping
  tests badly with real users, the fallback is one visual per family with exact wells.*
- **PBI-DD-03 — The embed client, not React.** No framework in the bundle; the client is what the
  certification audit will read.
- **PBI-DD-04 — The embed's readout, not the host's tooltip service**, in the first release: it is
  the readout the keyboard reaches (H-5). The tooltip service is reconsidered with report-page
  tooltips.

## Tasks

- [ ] **PBI-T-01** Split this pack into `specs/`; `CLAUDE.md`; `pbiviz new`; the lint and audit in CI. Stop for review. *H-7, PBI-Art. 1*
- [ ] **PBI-T-02** PoC: the engine inside a developer visual in Power BI Desktop and the service — size of the `.pbiviz`, load time, fonts, `adoptedStyleSheets` in the visual's sandbox, the positional mapping on three charts. `specs/poc.md`. *PBI-DD-02, PBI-REQ-012*
- [ ] **PBI-T-03** `scripts/make-capabilities.ts` and `--check`. *PBI-REQ-001, PBI-REQ-002, PBI-REQ-005, H-3*
- [ ] **PBI-T-04** Data view → table → spec; missing roles; truncation notice. *PBI-REQ-003, PBI-REQ-004, PBI-REQ-006, PBI-REQ-011*
- [ ] **PBI-T-05** The formatting model: chart, options, appearance. *PBI-REQ-002, PBI-REQ-005*
- [ ] **PBI-T-06** Theme and high contrast; rendering events; landing page. *PBI-REQ-007, PBI-REQ-009, PBI-REQ-010*
- [ ] **PBI-T-07** Selection. *PBI-REQ-008*
- [ ] **PBI-T-08** Localisation, keyed on the host catalog's stable ids (silverpoint OQ-H4: hosts translate); a test fails when a key of the pinned catalog has no `en` or `es` string. *PBI-REQ-013*
- [ ] **PBI-T-09** The harness tests (recorded data views, keyboard), the kit, the audit. *PBI-REQ-014, H-4, H-5*
- [ ] **PBI-T-10** README with a sample `.pbix`; release `0.1.0` (`.pbiviz` attached).

## Open questions

- **PBI-OQ-1** AppSource: needs a Partner Center account. Decide after the first release.
- **PBI-OQ-2** The row ceiling to request in `dataReductionAlgorithm`, against the embed's 2 MB limit.

## Bootstrap prompt

````text
This repository will ship a Power BI custom visual that draws silverpoint charts with @silverpoint/embed. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, that folder's README.md, api-delta.md and repositories/README.md §3, and Microsoft's pages on capabilities.json and certified visuals.

Do PBI-T-01 only: split the pack into specs/ without changing its content, write CLAUDE.md, create the visual with `pbiviz new`, set "privileges": [] and wire eslint-plugin-powerbi-visuals and `pbiviz package --certification-audit` into CI. Show me the tree, capabilities.json and the audit's output, then stop. PBI-T-02 is a PoC I run with you in Power BI Desktop.
````
