# examples/embed-html

silverpoint in a plain page, with nothing but the standalone file (REQ-667): the
`<silverpoint-chart>` element, a `data-sp-embed` box mounted on load, and the `mount` API with
`update` and `destroy`. `csp.html` is served under `script-src 'self'; style-src 'self'`, and
`frame.html` puts it in a `sandbox="allow-scripts"` frame. The `browser-embed` job runs
`e2e/embed.spec.ts` over these pages in Chromium, Firefox and WebKit (REQ-665).

```sh
pnpm --filter @silverpoint/embed build
node examples/embed-html/serve.mjs --port 4106
```
