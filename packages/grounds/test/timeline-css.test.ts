import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { TIMELINE_FRAMES, TIMELINE_TONES } from '@silverpoint/core/timeline';
import { describe, expect, test } from 'vitest';
import { buildTimelineCss } from '../src/timeline/timeline-css';
import { declarations, rules, type Rule } from './support/css';

/*
 * `@silverpoint/grounds/timeline.css` (T-211, REQ-511, REQ-512, DD-042): TimelineJS's skin. Phase 1
 * replaces its colours, type and rules with the ground's --sp- properties; phase 2 lays the
 * ground's own frame and tone masks, which timelineInk republishes as --sp-kl-*, on its pieces.
 */

const css = buildTimelineCss();
const all = rules(css);
const src = (path: string) => readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), 'utf8');
const inForcedColors = (rule: Rule) => rule.media.some((m) => m.includes('forced-colors: active'));
const ROOT = '.sp-ui.sp-timeline';
const find = (pick: (selector: string) => boolean) => all.filter((r) => pick(r.selector));
/** A selector list split at its own commas, not those inside `:is(…)`. */
const topLevel = (list: string) => {
  const out: string[] = [];
  let depth = 0;
  let from = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i] === '(') depth++;
    else if (list[i] === ')') depth--;
    else if (list[i] === ',' && depth === 0) {
      out.push(list.slice(from, i).trim());
      from = i + 1;
    }
  }
  return [...out, list.slice(from).trim()];
};
const body = (pick: (selector: string) => boolean) => find(pick).map((r) => r.body).join('\n');

describe('timeline.css (T-211)', () => {
  test('REQ-511 · every rule is scoped to an SpTimeline root: TimelineJS elsewhere on the page is untouched', () => {
    expect(all.length).toBeGreaterThan(30);
    const loose = all.flatMap((r) => topLevel(r.selector)).filter((s) => !s.startsWith(ROOT));
    expect(loose).toEqual([]);
  });

  test('REQ-511 · I-19 · no literal colour outside forced colours: every paint is a --sp- property', () => {
    const literal = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(|\b(?:black|white|red|green|blue|gray|grey)\b/i;
    const offending = all
      .filter((r) => !inForcedColors(r))
      .flatMap((r) => declarations(r).filter((d) => literal.test(d.value)).map((d) => `${r.selector} { ${d.property}: ${d.value} }`));
    expect(offending).toEqual([]);
    const system = /\b(?:CanvasText|Canvas|Highlight|GrayText)\b/;
    expect(all.filter((r) => !inForcedColors(r)).filter((r) => system.test(r.body))).toEqual([]);
  });

  test('I-32 · no opacity, gradient or colour mix: eras are toned by hatching or line weight (Art. 6)', () => {
    expect(css).not.toMatch(/opacity|gradient\(|color-mix\(/);
  });

  test('REQ-511 · phase 1: TimelineJS paints the substrate, writes the text in the ground\'s face and draws its rules in --sp-rule', () => {
    expect(body((s) => s === `${ROOT} .tl-timeline`)).toMatch(/background-color: var\(--sp-substrate\)/);
    expect(body((s) => s === `${ROOT} .tl-timeline`)).toMatch(/font-family: var\(--sp-font-display\)/);
    expect(body((s) => s.includes('.tl-timenav') && !s.includes(' .tl-timenav-'))).toMatch(/border-block-start: 1px solid var\(--sp-rule\)/);
  });

  test('REQ-309 · the active marker is the heightening, outlined in ink', () => {
    const active = body((s) => s.includes('.tl-timemarker-active .tl-timemarker-content-container') && !s.includes('[data-kl-inked'));
    expect(active).toMatch(/background-color: var\(--sp-heighten\)/);
    expect(active).toMatch(/outline: 1px solid var\(--sp-ink\)/);
  });

  test('REQ-512 · phase 2: markers take the control frame, the menubar the box frame, only when the host is inked', () => {
    const inked = find((s) => s.includes("[data-kl-inked='true']"));
    expect(inked.length).toBeGreaterThan(0);
    const masks = inked.flatMap((r) => declarations(r)).filter((d) => d.property === 'mask-image').map((d) => d.value);
    expect(masks).toEqual(expect.arrayContaining(['var(--sp-kl-mask-control)', 'var(--sp-kl-mask-box)']));
    // Every --sp-kl-mask a rule reads is one timelineInk writes.
    const names = [...css.matchAll(/--sp-kl-mask(?:-position|-size)?-([a-z]+)/g)].map((m) => m[1]);
    for (const name of names) expect(TIMELINE_FRAMES).toContain(name);
    for (const r of all.filter((r) => /--sp-kl-mask/.test(r.body))) expect(r.selector).toContain("[data-kl-inked='true']");
  });

  test('REQ-512 · C-7 · eras fold TimelineJS\'s six colours onto the four levels of the ramp, from the probed tone tiles', () => {
    const level = (colour: number) => {
      const r = find((s) => s.includes("[data-kl-toned='true']") && s.includes(`.tl-timeera-color${colour}`))[0];
      return /var\(--sp-kl-tone-(\d)\)/.exec(r?.body ?? '')?.[1];
    };
    expect([0, 1, 2, 3, 4, 5].map(level)).toEqual(['1', '2', '3', '4', '1', '2']);
    const names = [...css.matchAll(/--sp-kl-tone(?:-size)?-(\d)/g)].map((m) => m[1]);
    for (const name of names) expect(TIMELINE_TONES).toContain(name);
  });

  test('DD-019 · untoned (a weight ground, or before the probes are read), an era is a rule of the ramp\'s weight, never a flat fill', () => {
    const era = body((s) => s === `${ROOT} .tl-timeera .tl-timeera-background`);
    expect(era).toMatch(/background: none/);
    expect(era).toMatch(/border-block-start: 0 solid var\(--sp-ink-secondary\)/);
    expect(era).toMatch(/border-block-start-width: calc\(var\(--sp-stroke-width\) \* var\(--sp-kl-era-weight, 1\) \* 1px\)/);
    const weights = [0, 1, 2, 3, 4, 5].map((c) => /--sp-kl-era-weight: var\(--sp-weight-(\d)\)/.exec(body((s) => s.includes(`.tl-timeera-color${c}`) && !s.includes('data-kl-toned')))?.[1]);
    expect(weights).toEqual(['1', '2', '3', '4', '1', '2']);
  });

  test('REQ-511 · eras keep a strip of their own below the tick labels: neither the title nor the tone crosses them', () => {
    // TimelineJS lays a 40px era over its 39px axis, so an era's title lands on the major ticks'
    // row. With an era, the axis grows by the strip (TimelineJS reads its height back, so markers
    // give the room up) and the era is laid only in that strip.
    const axis = body((s) => s === `${ROOT} .tl-timenav:has(.tl-timeera) :is(.tl-timeaxis-background, .tl-timeaxis)`);
    expect(axis).toMatch(/height: 57px/);
    expect(body((s) => s === `${ROOT} .tl-timeera`)).toMatch(/height: 18px/);
    expect(body((s) => s === `${ROOT} .tl-timeera .tl-timeera-content`)).toMatch(/padding-block: 0/);
    const title = body((s) => s === `${ROOT} .tl-timeera .tl-timeera-content-container .tl-timeera-content .tl-timeera-text h2.tl-headline`);
    expect(title).toMatch(/line-height: 18px/);
    // The title is read on a plate of the substrate, never across the era's hatching.
    expect(title).toMatch(/background: var\(--sp-substrate\)/);
  });

  test('REQ-513 · the probes are measurable but never seen, heard or hit; the mount fills the surface', () => {
    const probe = body((s) => s === `${ROOT} .sp-kl-probe`);
    expect(probe).toMatch(/visibility: hidden/);
    expect(probe).toMatch(/pointer-events: none/);
    expect(probe).not.toMatch(/display: none/);
    expect(body((s) => s === `${ROOT} .sp-kl-mount`)).toMatch(/block-size: 100%/);
    expect(body((s) => s === `${ROOT}[data-kl-card='true']`)).toMatch(/padding: 6px/);
  });

  test('REQ-306 · what depends on the mode or the probes is paint only', () => {
    const paint = /^(-webkit-)?(mask(-[a-z]+)*|background(-[a-z]+)*|border(-[a-z]+)*|outline|content|position|inset|z-index|pointer-events|--sp-[a-z0-9-]+)$/;
    const keyed = find((s) => /data-mode|data-kl-/.test(s) && !s.endsWith(`${ROOT}[data-kl-card='true']`));
    expect(keyed.flatMap((r) => declarations(r).filter((d) => !paint.test(d.property)).map((d) => `${r.selector} { ${d.property} }`))).toEqual([]);
  });

  test('REQ-123 · forced colours: no mask, exact CanvasText rules', () => {
    const forced = all.filter(inForcedColors);
    expect(forced.some((r) => /border-color: CanvasText/.test(r.body))).toBe(true);
    expect(forced.some((r) => /mask-image: none/.test(r.body))).toBe(true);
  });

  test('REQ-511 · timeline.css is an opt-in file of the package, within 6 kB gzipped, the same bytes on every build', () => {
    const pkg = JSON.parse(src('package.json')) as { exports: Record<string, unknown> };
    expect(pkg.exports['./timeline.css']).toBe('./dist/timeline.css');
    expect(src('scripts/build-ui-css.ts')).toMatch(/timeline\.css/);
    expect(gzipSync(css).length).toBeLessThanOrEqual(6_000);
    expect(buildTimelineCss()).toBe(css);
  });
});
