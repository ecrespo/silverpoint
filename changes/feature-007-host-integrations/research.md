# Research — drawing silverpoint charts inside BI tools, workflow tools and Python web frameworks

> Input to a future `prd-delta.md`. A first survey gathered 2026-11-20 from each vendor's public
> documentation (sources in §6) and from this repository at `0.10.1`. Nothing here was built or
> run against a host: every host claim is what its documentation says, and what the documentation
> did not say is listed in §5 as an open question. §3.7 (Flask, Django, Plone), added the same
> day, is the exception: no documentation was read for it, and it says so.

## 1. What silverpoint already has

| Piece | Where | Use for a host |
|---|---|---|
| A render with no framework | `renderChart`, `toSVGString`, `standaloneSVG` in `@silverpoint/grounds` | Draws any of the 60 recipes to an SVG string in Node; the path `@silverpoint/mcp` takes for `render_chart` |
| The ground's stylesheet as a string | `@silverpoint/grounds/styles-text` (0.10.0) | A bundle can carry the styles without a loader |
| A view model of the drawing | `toSvgView` in `@silverpoint/core` (`PathView`, `TextView`, `PatternView`) | Building the SVG node by node, where a host forbids `innerHTML` |
| The typeface, inlined | `@silverpoint/mcp` embeds EB Garamond 400 as base64 for `embedFonts` | Hosts that block every network request |
| A machine-readable catalog | `tools/agent-catalog`: every chart's props, generated from the types | The source for each host's field mapping |
| A React adapter | `@silverpoint/react` | Superset plugins are React components |

What it does not have: a browser entry point that needs no framework (the PRD keeps web
components out of `0.x`, §5.2), and anything callable from Python other than the Reflex wrapper.

## 2. Shared pieces

### 2.1 `@silverpoint/embed`

Power BI, Tableau and the notebook outputs all run the visual in an isolated frame with no React
and, where certified, no network. One file has to bring everything:

- `mount(element, chart, props)` and an `update`/`destroy` pair.
- The stylesheet and the typeface inside the file.
- The SVG built with `createElementNS` from the view model, not from a string.
- Hover, keyboard and selection as callbacks, so each host maps them to its own selection and
  tooltips. The core has an `interaction` module; how much of the adapters' wiring has to move
  into `embed` was not measured.

Art. 2 binds it as it binds the MCP server: it renders only through the core and the grounds.
Art. 3 needs a decision: whether `embed`'s DOM is compared against the canonical render as a
fourth output.

### 2.2 `silverpoint` on PyPI

A DataFrame and a chart name in, a self-contained HTML document out (the `embed` file and the
data inline). With `_repr_html_` the same object shows in Jupyter, in a Databricks notebook and
through KNIME's `view_ipy_repr`. The render happens in the browser, so the Python side needs no
JavaScript runtime. A static image (KNIME reports) does need one: Node.js in the node's
environment calling the headless render.

The web frameworks of §3.7 use the same package in two modes:

| Mode | What the page carries | For |
|---|---|---|
| Browser | The `embed` file as a static asset and the data as JSON; drawn on load | Interactive pages: hover, keyboard, selection |
| Server | The SVG already in the HTML | E-mail, PDF, pages without JavaScript |

The server mode needs a JavaScript engine beside Python: Node.js as a subprocess, or an embedded
engine. Whether the core runs in an embedded one was not tried.

### 2.3 Manifests from the agent catalog

Every host asks the visual to declare the fields it accepts. The catalog already lists each
chart's props (`xKey`, `valueKey`, `groupKey`, …), so one generator can write the four shapes:
Power BI `dataRoles`, Tableau encodings, KNIME node parameters, Superset controls.

## 3. Hosts

### 3.1 Apache Superset

- A plugin is an npm package (`superset-plugin-chart-*`) with `buildQuery`, `transformProps`,
  `controlPanel` and a React component, registered in `MainPreset` of `superset-frontend`.
- The component can wrap `@silverpoint/react` directly; `embed` is not needed.
- It installs into Superset's source, so it needs a custom build of the frontend.
- Cross-filtering has to be mapped from the charts' selection events.

### 3.2 n8n

- A community node in TypeScript (`n8n-nodes-*`): the workflow's items in, the chart out as SVG
  binary data or as HTML.
- It runs in Node, so the headless render is enough. PNG would need a rasteriser with native
  binaries; SVG first.
- Verified nodes must be MIT (silverpoint is), carry no runtime dependencies, read no environment
  variables or files, and integrate one third-party service; logic nodes are not accepted. A
  chart generator fits poorly, so the realistic target is an unverified community node.

### 3.3 Power BI

- A custom visual in TypeScript built with `pbiviz`; the host's `DataView` is mapped to the rows
  silverpoint takes, and ground, substrate, mode and palette go in the format pane.
- Certification forbids `fetch`, `XMLHttpRequest`, `eval`, `Function()`, `innerHTML`,
  `requestAnimationFrame` and minified source; it requires `npm audit` without high or moderate
  findings, ESLint with `eslint-plugin-powerbi-visuals`, the Rendering Events API, and a
  repository that holds **one** visual with a `certification` branch.
- `roughjs` and the `d3-*` modules have to pass `pbiviz package --certification-audit`.
- Uncertified visuals work (imported `.pbiviz`, organizational visuals) but lose export to
  PowerPoint and e-mail subscriptions.
- One visual per repository forces a choice for 60 charts: one visual with a type selector, or
  one visual per family.

### 3.4 Tableau

- A viz extension is a `.trex` manifest plus a web page that loads Tableau's Extensions API; the
  manifest declares the encodings shown on the Marks card, so one extension per chart family.
- The page has to be hosted. A network-enabled extension asks the user for permission and, on
  Tableau Server and Cloud, needs its URL on the site's allowlist.
- Listing on Tableau Exchange requires being a Tableau Technology Partner (Salesforce ISV
  programme); a local `.trex` needs neither.

### 3.5 Databricks

- **AI/BI dashboards**: custom visualizations are in Public Preview and are Vega-Lite JSON
  specifications. No custom JavaScript; image marks take inline base64 PNG, JPEG or WebP up to
  37 KB, not SVG. silverpoint cannot draw there. Out of scope.
- **Notebooks**: `displayHTML` with the document from §2.2.
- **Databricks Apps**: an application of one's own; not surveyed.

### 3.6 KNIME

- A Python node extension (KNIME Analytics Platform 5.5+), `@knext.node` with
  `@knext.output_view`, the environment declared in `pixi.toml`, a `LICENSE.TXT`, published on a
  local update site or, after review, on the Community Hub.
- `view_html` takes a self-contained document that references no external resource;
  `view_svg` is what reports include.
- Selection shared with other nodes is documented only for Plotly figures.

### 3.7 Flask, Django and Plone

**Not surveyed.** No framework documentation was read for this section; it records the intended
shape from general knowledge of the three, and every line is to be verified at gate 0.

These hosts serve pages of their own: no isolated frame and no store to certify against, so they
ask less than the BI tools. Each is a thin layer over §2.2.

| | Flask | Django | Plone |
|---|---|---|---|
| Package | `flask-silverpoint` | `django-silverpoint` | One add-on for Volto, another for Classic UI |
| Use | A Jinja global: `{{ silverpoint_chart("line", data=hits) }}` | A template tag: `{% silverpoint_chart "line" data=hits x_key="t" %}` | A block the editor inserts in a page |
| Static file | A blueprint with its `static` folder | An app with `static/`, collected by `collectstatic` | Resources registered by the add-on |
| Data | Whatever the view passes | The view's context, or a QuerySet through `.values()` | The block's fields, an attached CSV or JSON, or a collection |

- **Flask**: an extension with `init_app` that registers the blueprint and the Jinja global.
- **Django**: an installable app with the template tag, the static files and project-wide
  defaults in `settings.py` (ground, substrate, mode, palette). Data travels through
  `json_script`. Natural extras: a Wagtail block and an admin widget.
- **Plone**: Volto, Plone 6's interface, is built on React, so its block can wrap
  `@silverpoint/react` as the Superset plugin does. Classic UI renders server templates, where a
  view or a tile carries `embed`. Two add-ons, hence the larger effort.

## 4. Proposed additions to PRD §5.3 (Future Considerations)

To be folded only when this feature's PRD delta is approved (Art. 9):

- A framework-free browser entry (`@silverpoint/embed`) for hosts that run a visual in an
  isolated frame.
- A Python package that returns a chart as a self-contained HTML document.
- Host integrations built on them: Apache Superset, n8n, Power BI, Tableau, KNIME, and notebook
  output for Databricks and Jupyter.
- Python web framework integrations on the same package: Flask, Django and Plone (Volto and
  Classic UI).

## 5. Open questions

1. The React version of current Superset against `@silverpoint/react`'s 18.2 floor; the plugin
   steps read are from a Superset 2 guide.
2. Whether a managed Superset accepts a plugin without a custom build.
3. Whether Tableau viz extensions can be sandboxed (hosted by Tableau, no network), and the
   minimum Tableau version.
4. Whether unverified n8n community nodes install on n8n Cloud.
5. How much of the adapters' interaction wiring `embed` has to own.
6. Whether `embed` joins the parity gate (Art. 3).
7. Where each integration lives: this monorepo's `fixed` group, or a sibling repository per host.
8. A selection-aware KNIME view (a Java node with a JavaScript view) was not surveyed.
9. Flask, Django and Plone were not surveyed at all (§3.7): extension points, packaging and
   static-file handling are to be read from each project's documentation.
10. The React version of current Volto against `@silverpoint/react`'s 18.2 floor.
11. Which JavaScript engine the Python package's server mode uses, and whether the core runs in
    an embedded one.

## 6. Sources

- Power BI — <https://learn.microsoft.com/en-gb/power-BI/developer/visuals/power-bi-custom-visuals-certified>
- Tableau — <https://tableau.github.io/extensions-api/docs/vizext/trex_viz_getstarted>,
  <https://help.tableau.com/current/pro/desktop/en-us/viz_extensions.htm>,
  <https://tableau.github.io/extensions-api/docs/publish/trex_sandbox_publish>
- KNIME — <https://docs.knime.com/2025-07/pure_python_node_extensions_guide/index.html>,
  <https://docs.knime.com/ap/latest/python-script-api/views>
- Databricks — <https://docs.databricks.com/aws/en/dashboards/manage/visualizations/custom-visualizations>
- Apache Superset — <https://www.preset.io/blog/building-custom-viz-plugins-in-superset-v2>
- n8n — <https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines>
