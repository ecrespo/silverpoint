# feature-007 — host integrations: silverpoint charts inside BI and workflow tools

| Field | Value |
|---|---|
| **Status** | `DRAFT` — roadmap entry, drafted 2026-11-20. Gate 0 ([`research.md`](research.md)) is a first survey, **not approved**; no other artifact exists yet |
| **Target release** | Not set. The line stays on `0.x`; `1.0.0` stays parked |
| **Requirements** | None assigned (the PRD delta will take the next free range after REQ-628) |
| **Constitution** | An amendment is expected: a framework-free browser package and a Python package enter the scope, bound by Art. 2 as `@silverpoint/mcp` and `@silverpoint/marp` are |
| **Sibling repositories** | Expected, one per host (Power BI certification requires a repository holding a single visual) |

## What it is

Six tools people already chart in, and the two shared pieces that let silverpoint draw inside them.
None of them is a data connector: each is the host's own extension point for a visualization.

| Host | Extension point | Built on |
|---|---|---|
| Apache Superset | Visualization plugin (React) | `@silverpoint/react`, as published |
| n8n | Community node that returns the chart as SVG or HTML | The headless render (`renderChart` + `standaloneSVG`), as published |
| Power BI | Custom visual (`pbiviz`) | `@silverpoint/embed` (new) |
| Tableau | Viz extension (`.trex` + a web page) | `@silverpoint/embed` (new) |
| KNIME | Python node extension with a view | `silverpoint` on PyPI (new), which carries `embed` |
| Databricks, Jupyter | Notebook output (`displayHTML`, `_repr_html_`) | `silverpoint` on PyPI (new) |

Out: Databricks AI/BI dashboards. Their custom visualizations are Vega-Lite specifications and run
no JavaScript of ours (research §3.5).

## Shared pieces to build

1. **`@silverpoint/embed`** — one browser file with no framework: `mount(element, chart, props)`,
   the ground's stylesheet and EB Garamond inside it, the SVG built node by node, and the core's
   interaction wired to plain callbacks.
2. **`silverpoint` (PyPI)** — a DataFrame in, a self-contained HTML document out, on top of `embed`.
3. **Host manifests generated from the agent catalog** — the fields each chart takes, written as
   `capabilities.json` data roles, `.trex` encodings, KNIME node parameters and Superset controls.

## Proposed order

1. n8n node — needs nothing new in this repository.
2. Superset plugin — reuses `@silverpoint/react`; its React version is to be confirmed.
3. `@silverpoint/embed`.
4. `silverpoint` on PyPI, then the KNIME node and the notebook output.
5. Power BI custom visual.
6. Tableau viz extension.

A first family (line, bar, donut, KPI) before the 60 charts.

## Reading order and approval gates

| Gate | Artifact | Decides | Approved |
|---|---|---|---|
| 0 | [`research.md`](research.md) | What each host allows; what exists to build on; open questions | — first survey, not approved |
| 1 | `prd-delta.md` | The what: scope, personas, requirements | — |
| 2 | `api-delta.md` | The contract: `embed`, the Python package, the manifest generator | — |
| 3 | `technical-design-delta.md` + `data-model-delta.md` | The how | — |
| 4 | `plan-and-tasks.md` | Phases and tasks | — |
