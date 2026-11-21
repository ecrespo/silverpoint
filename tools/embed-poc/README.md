# embed-poc — feature-007 step 11a (T-290)

A prototype of `@silverpoint/embed`, written only to measure the standalone file and to run it in
the sandboxes of DD-062's protocol. **Not the package**: no validation beyond the chart slug, no
limits, the element reads only `chart` and `ground`. Every picture comes from `renderChart`
(Art. 2). Findings and numbers: [`changes/feature-007-bi-hosts/poc.md`](../../changes/feature-007-bi-hosts/poc.md).

No `package.json`, like the other dependency-free tools: it resolves the built `packages/*/dist`
by alias, so run `pnpm build` first.

```sh
node tools/embed-poc/build.mjs                 # the five files in dist/, results/sizes.json
node tools/embed-poc/node-check.mjs            # every chart in plain Node, DOM globals that throw: results/node.json
pnpm exec tsx tools/embed-poc/parity-check.ts  # the whole fixture matrix through a JSON spec: results/parity.json
python tools/embed-poc/notebook.py             # an executed notebook with the srcdoc output (needs nbconvert, ipykernel)
NOTEBOOK_HTML=$PWD/tools/embed-poc/results/notebook.html \
  node tools/embed-poc/browser-check.mjs chromium,firefox,webkit   # results/browsers.json
```

`browser-check.mjs` takes `PLAYWRIGHT` (the `playwright` package to load) and `CHROMIUM` (an
executable) from the environment when the defaults are not installed.
