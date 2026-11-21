/**
 * `renderToHTML` (REQ-633, DD-069): the chart root `toChartRootString` writes — a complete,
 * accessible chart with no script at all — as a document or a fragment; with `interactive`, the
 * spec as JSON in a `data-sp-embed` box for a client on the page to adopt. This markup is a
 * documented contract another language writes (`fixtures/embed/html`).
 */
import { toChartRootString } from '@silverpoint/grounds';
import type { ChartSpec, SpecResult } from '../spec/types';
import { escapeHtml, escapeJsonForScript, escapeScriptText } from './escape';
import { renderSpec } from './render-spec';
import { standaloneStyle, type FaceSource } from './svg';

export interface HTMLOptions {
  /** `document`: `<!doctype html>` …; `fragment`: one `<div>` to place in a page. Default `document`. */
  readonly as?: 'document' | 'fragment';
  /** Adds the spec as JSON and `data-sp-embed`, so a client on the page mounts it. Default `false`. */
  readonly interactive?: boolean;
  /** With `interactive`: where the standalone file comes from. Default `none` (the page loads it). */
  readonly script?: { readonly src: string; readonly integrity?: string } | { readonly inline: string } | 'none';
  /** `inline` (default) writes the stylesheet in a `<style>`; `none` leaves styling to the page or the client. */
  readonly styles?: 'inline' | 'none';
  readonly embedFonts?: boolean;
  /** The document's `<title>`; the chart's name when absent. */
  readonly title?: string;
  /** Default `"en"`. */
  readonly lang?: string;
}

export function createRenderToHTML(face: FaceSource) {
  return function renderToHTML(spec: ChartSpec | string, options: HTMLOptions = {}): SpecResult<{ html: string }> {
    const rendered = renderSpec(spec);
    if (!rendered.ok) return rendered;
    const value = typeof spec === 'string' ? (JSON.parse(spec) as ChartSpec) : spec;
    const root = toChartRootString(rendered.value);
    const style = options.styles === 'none' ? { css: '', missingFace: false } : standaloneStyle(options.embedFonts, face);
    const sheet = options.styles === 'none' ? '' : `<style>${style.css}</style>`;
    const body = options.interactive
      ? `<div data-sp-embed><script type="application/json">${escapeJsonForScript(value)}</script>${sheet}${root}</div>`
      : `<div class="sp-embed">${sheet}${root}</div>`;
    let html = body;
    if ((options.as ?? 'document') === 'document') {
      const script = !options.interactive || options.script === undefined || options.script === 'none'
        ? ''
        : 'inline' in options.script
          ? `<script>${escapeScriptText(options.script.inline)}</script>`
          : `<script src="${escapeHtml(options.script.src)}"${options.script.integrity ? ` integrity="${escapeHtml(options.script.integrity)}" crossorigin="anonymous"` : ''}></script>`;
      const title = escapeHtml(options.title ?? rendered.value.name);
      html = `<!doctype html><html lang="${escapeHtml(options.lang ?? 'en')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head><body>${body}${script}</body></html>`;
    }
    return { ok: true, value: { html }, diagnostics: rendered.diagnostics };
  };
}
