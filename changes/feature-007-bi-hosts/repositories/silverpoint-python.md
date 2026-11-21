# Spec pack — `silverpoint-python`

| Field | Value |
|---|---|
| **Repository** | `github.com/ecrespo/silverpoint-python` |
| **Published as** | PyPI `silverpoint` (import name `silverpoint`) |
| **Licence** | MIT |
| **Description** | Silverpoint charts from Python: a chart from a DataFrame as self-contained HTML, for notebooks, Databricks, Flask and Django. |
| **Draws with** | `silverpoint-embed.full.js`, vendored from the silverpoint release it mirrors |
| **Wave** | 1 (the PyPI name is taken by the first real upload, PY-T-13) |
| **Ids** | `PY-REQ-nnn`, `PY-DD-nn`, `PY-T-nn` |
| **Status** | `APPROVED` gate-1 pack, 2026-11-20 (user decision); re-read against the released API in T-328 |

## Constitution

H-1..H-8 ([`README.md`](README.md) §3), and:

- **PY-Art. 1 — No picture is made in Python.** THE PACKAGE SHALL build a chart spec and the markup
  that carries it, and nothing else. It SHALL hold no geometry, no scale, no colour and no layout.
- **PY-Art. 2 — No required dependency.** THE BASE INSTALL SHALL depend on nothing but the standard
  library. pandas, polars, pyarrow, Flask and Django are detected, never imported at module load.
- **PY-Art. 3 — Self-contained output.** HTML THE PACKAGE WRITES SHALL work with no network: the
  script is inlined or served by the application itself. It SHALL never write a CDN URL.

Stack: Python ≥ 3.10; `uv`; `hatchling`; `ruff`; `pytest`; Node 20+ **in CI only** (the conformance
kit and `to_svg` tests); PyPI Trusted Publishing from a tag.

## Scope

**In:** `Chart`; one builder per chart; DataFrame inputs; `to_html`, `save`, notebook display;
`to_svg` where Node is available; `silverpoint.contrib.flask`; `silverpoint.contrib.django`; the host
catalog as Python data. **Out:** Reflex (that is `reflex-silverpoint-react`); dashboards, UI
components, decks; a pure-Python or embedded-engine SVG (silverpoint DD-069); server-side aggregation.

## Requirements

| ID | Requirement | Priority |
|---|---|---|
| PY-REQ-001 | THE PACKAGE SHALL expose `Chart(chart, data=None, *, roles=None, options=None, ground=None, substrate=None, mode=None, palette=None, width=None, height=None, id=None)` whose `spec` property is a `ChartSpec` as a `dict` (silverpoint Data Model §2.38). | MUST |
| PY-REQ-002 | THE PACKAGE SHALL accept as `data` a list of mappings, a mapping of columns, a pandas or polars DataFrame, a pyarrow Table, or any object with `to_dict("records")` or `to_dicts()`, converting dates to ISO strings, NaN and NaT to `None`, and numpy scalars to Python numbers. | MUST |
| PY-REQ-003 | THE PACKAGE SHALL provide one function per chart of the pinned host catalog whose `binding` is not `none` —`silverpoint.bar_chart(df, x="team", value="wins", orientation="rows")`— with one keyword per role and per option in snake case, generated from the host catalog. | MUST |
| PY-REQ-004 | IF a required role is missing, a column is not in the data, an option is unknown or a value is outside an option's `values`, THEN THE PACKAGE SHALL raise `SpecError` naming it, with the closest valid names, before any HTML is written. | MUST |
| PY-REQ-005 | THE PACKAGE SHALL apply, in Python, the reshapes the host catalog declares (`matrix`, `dimensions`, `first-row`), with results equal to `specFromTable`'s for the fixtures of `fixtures/embed/tables`. | MUST |
| PY-REQ-006 | WHEN `to_html(full_document=True, script="inline")` is called, THE PACKAGE SHALL return the interactive document of `renderToHTML` (silverpoint API §1.5), byte-identical to the library's golden for the same spec and options. `script` SHALL accept `"inline"`, `"none"` and a URL string the application serves. | MUST |
| PY-REQ-007 | WHEN a `Chart` is the value of a notebook cell, THE PACKAGE SHALL display it through `_repr_mimebundle_` as `text/html` holding a sandboxed `<iframe srcdoc>` of the inline document, sized to the chart, so that the chart draws in Jupyter, JupyterLab, VS Code and Databricks without trusting the notebook. | MUST |
| PY-REQ-008 | THE PACKAGE SHALL inline the script once per notebook where the front end allows shared output (`silverpoint.notebook.enable()`), and once per chart otherwise. | SHOULD |
| PY-REQ-009 | WHERE Node 20+ is on `PATH`, `to_svg()` SHALL return the library's `renderToSVG` result by running the vendored module build in a subprocess with the spec on standard input; otherwise it SHALL raise `RuntimeUnavailable` saying how to get an SVG. | MUST |
| PY-REQ-010 | THE PACKAGE SHALL expose `silverpoint.catalog` (the pinned host catalog as data), `silverpoint.__version__` and `silverpoint.SILVERPOINT_VERSION`, and `silverpoint.static_path()` returning the folder of the vendored script. | MUST |
| PY-REQ-011 | `silverpoint.contrib.flask.Silverpoint(app)` SHALL register a route serving the vendored script with a long-lived immutable cache header and its integrity, and the Jinja globals `silverpoint_script()` and `silverpoint_chart(chart_or_spec)`, the latter writing a `<silverpoint-chart>` with the spec in a JSON child and no inline script. | MUST |
| PY-REQ-012 | `silverpoint.contrib.django` SHALL be an installable app providing the script through `staticfiles` and the template tags `{% silverpoint_script %}` and `{% silverpoint_chart chart %}`, equivalent to the Flask globals. | MUST |
| PY-REQ-013 | THE MARKUP OF PY-REQ-011 AND PY-REQ-012 SHALL render under `Content-Security-Policy: script-src 'self'; style-src 'self'`, verified by a browser test. | MUST |
| PY-REQ-014 | THE PACKAGE SHALL escape the spec for a script context exactly as the library does (`<`, `>`, `&`, U+2028, U+2029), verified over the library's hostile corpus. | MUST |
| PY-REQ-015 | CI SHALL run the conformance kit in Node against the vendored module build, and SHALL verify the vendored files against `integrity.json`. | MUST |
| PY-REQ-016 | THE WHEEL SHALL contain the vendored script, the host catalog, `integrity.json` and the licence of the embedded font, and SHALL be pure Python (`py3-none-any`). | MUST |

## Design decisions

- **PY-DD-01 — The version mirrors the library's.** `silverpoint` X.Y.Z vendors
  `@silverpoint/embed` X.Y.Z. Python-only fixes are `X.Y.Z.postN`. This is the one host whose version
  is not its own (silverpoint DD-068): it is the standalone file's Python distribution, and "which
  silverpoint is this" must have one answer.
- **PY-DD-02 — Vendoring is a build step, checked in.** `scripts/vendor.py X.Y.Z` downloads the
  hosts kit of the GitHub release `vX.Y.Z` (or the npm tarball) —`silverpoint-embed.full.js`,
  `.full.mjs`, `host-catalog.json`, `conformance.json`, `integrity.json`, the HTML goldens and the
  table fixtures— verifies digests, and
  writes `src/silverpoint/_vendor/`. The files are committed, so an sdist builds offline and a
  reviewer sees the diff. CI re-runs it with `--check`.
- **PY-DD-03 — Builders are generated.** `scripts/make_builders.py` writes `_builders.py` and its
  `.pyi` from the host catalog (H-3): signatures, docstrings from `summary` and `doc`, snake-case
  names with the camel-case original kept in a table. CI: `--check`.
- **PY-DD-04 — An iframe in notebooks.** Front ends differ on whether a `<script>` in an output
  runs, and Databricks renders HTML in a frame of its own. A `srcdoc` frame with
  `sandbox="allow-scripts"` behaves the same everywhere and keeps the chart's stylesheet off the
  notebook's. Cost: the script travels with each chart unless PY-REQ-008 applies.
- **PY-DD-05 — Flask and Django are sub-packages** (silverpoint D3), each importing its framework
  only inside its own module. Extras `silverpoint[flask]`, `silverpoint[django]` declare the
  frameworks' minimum versions and nothing else.

## Structure

```
src/silverpoint/
  __init__.py  chart.py  data.py  spec.py  reshape.py  html.py  notebook.py  svg.py  errors.py
  _builders.py (generated)   _builders.pyi (generated)
  _vendor/  silverpoint-embed.full.js  silverpoint-embed.full.mjs  host-catalog.json
            conformance.json  integrity.json  html-goldens/  OFL.txt
  contrib/flask.py
  contrib/django/  __init__.py  apps.py  templatetags/silverpoint.py  static/silverpoint/ (symlinked or copied at build)
scripts/  vendor.py  make_builders.py  conformance.mjs
tests/    examples/ (notebooks: Jupyter, Databricks)   docs/
```

## Tasks

- [ ] **PY-T-01** Split this pack into `specs/`; `CLAUDE.md`; `uv` project, `ruff`, `pytest`, CI skeleton. Stop for review. *H-7*
- [x] **PY-T-02** *Withdrawn (user decision, 2026-11-20):* no placeholder release; the name `silverpoint` on PyPI is reserved by the first real upload in PY-T-13, whose Trusted Publisher is set up as a pending publisher before that release. *PY-REQ-016*
- [ ] **PY-T-03** `scripts/vendor.py` and its `--check`; integrity verification. *PY-REQ-015, PY-REQ-016, H-2*
- [ ] **PY-T-04** `spec.py`, `errors.py`: validation against the catalog. *PY-REQ-001, PY-REQ-004*
- [ ] **PY-T-05** `data.py`: every input kind, with and without pandas/polars installed (tox-style matrix). *PY-REQ-002*
- [ ] **PY-T-06** `reshape.py` against the library's table fixtures. *PY-REQ-005*
- [ ] **PY-T-07** `scripts/make_builders.py`, `_builders.py`, stubs, `--check`. *PY-REQ-003, H-3*
- [ ] **PY-T-08** `html.py` against the goldens and the hostile corpus. *PY-REQ-006, PY-REQ-014*
- [ ] **PY-T-09** `notebook.py`; a Playwright test that opens an executed notebook's HTML export and reads the chart by keyboard. *PY-REQ-007, PY-REQ-008, H-5*
- [ ] **PY-T-10** `svg.py` and `scripts/conformance.mjs`; the kit in CI. *PY-REQ-009, PY-REQ-015, H-4*
- [ ] **PY-T-11** `contrib/flask.py` with an example app and the CSP browser test. *PY-REQ-011, PY-REQ-013*
- [ ] **PY-T-12** `contrib/django` with an example project and the CSP browser test. *PY-REQ-012, PY-REQ-013*
- [ ] **PY-T-13** `catalog`, versions, `static_path`; README with one example per host (Jupyter, Databricks `displayHTML(chart.to_html())`, Flask, Django); release `0.11.0`. *PY-REQ-010*

## Open questions

- **PY-OQ-1** Databricks: does `displayHTML` accept the document size of the `full` file per cell
  without truncation? Measure in PY-T-09 on Free Edition; the fallback is the script served from a
  workspace file.
- **PY-OQ-2** An optional extra with an embedded JavaScript engine for `to_svg` without Node: only
  if users ask.

## Bootstrap prompt

````text
This repository will publish `silverpoint` on PyPI: silverpoint charts from Python. Its design is in specs/spec-pack.md, written in the silverpoint repository (~/WebstormProjects/silverpoint/changes/feature-007-bi-hosts). Read the pack, then that folder's README.md, api-delta.md and repositories/README.md §3.

Do PY-T-01 only: split the pack into specs/constitution.md, specs/prd.md, specs/technical-design.md and specs/tasks.md without changing its content; write CLAUDE.md pointing at the constitution and listing PY-Art. 1..3; set up the uv project, ruff, pytest and a CI workflow that runs them. Write no package code. Show me the tree and the output of `uv run pytest` and `uv run ruff check .`, then stop.
````
