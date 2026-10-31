/**
 * feature-006 Phase 10a PoC (REQ-617, REQ-618). Not product code: it answers one question —
 * can a framework-mounted silverpoint chart live inside a Marpit slide, scaled, in Chromium,
 * Firefox and WebKit — under two scaling methods:
 *   ?scaling=svg        Marpit `inlineSVG` + `@marp-team/marpit-svg-polyfill` (`observe`)
 *   ?scaling=transform  no inline SVG; each <section> scaled by `transform: scale()` from a ResizeObserver
 *   ?scaling=svg-transform  inline SVG at a fixed 1280×720, no polyfill; the whole <svg> scaled by
 *                       `transform: scale()` from a ResizeObserver (keeps Marpit's advanced backgrounds)
 * `?rem=10` sets the host's root font size to check that slides ignore it (REQ-580).
 */
import '@silverpoint/fonts/fonts.css';
import '@silverpoint/grounds/styles.css';
import { Element, Marpit } from '@marp-team/marpit';
import { observe } from '@marp-team/marpit-svg-polyfill';
import { BarChart } from '@silverpoint/react/bar-chart';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';

const params = new URLSearchParams(location.search);
const scaling = (['transform', 'svg-transform'] as const).find((s) => s === params.get('scaling')) ?? 'svg';
const boxed = scaling !== 'svg';
if (params.get('rem')) document.documentElement.style.fontSize = `${params.get('rem')}px`;

const THEME = `/* @theme poc */
section { width: 1280px; height: 720px; box-sizing: border-box; padding: 64px 80px;
  font-family: 'EB Garamond', Georgia, serif; font-size: 30px; line-height: 1.3;
  background: #EDE7DA; color: #3F4348; overflow: hidden; }
h1 { font-size: 64px; font-weight: 500; margin: 0 0 24px; }
figure.sp-deck-chart { margin: 0; width: 1120px; height: 420px; }
`;

const MARKDOWN = [
  '# Slide one',
  '',
  '* first',
  '* second',
  '',
  '---',
  '',
  '# A chart in a slide',
  '',
  '```silverpoint',
  '{ "chart": "bar-chart" }',
  '```',
  '',
  '---',
  '',
  '# Split background',
  '',
  '![bg left:40%](/a.svg)',
].join('\n');

const marpit = new Marpit({
  anchor: false,
  inlineSVG: scaling !== 'transform',
  container: new Element('div', { class: 'sp-deck-poc' }),
  // The transform method needs a box per slide; it must come from Marpit, whose scoped selectors
  // use child combinators (`div.sp-deck-poc > section`): wrapping the DOM afterwards breaks them.
  ...(boxed ? { slideContainer: new Element('div', { class: 'sp-slide-box' }) } : {}),
});
marpit.themeSet.default = marpit.themeSet.add(THEME);
// The fence becomes an empty slot here; the product renders the static SVG into it (DD-053).
type FenceRule = (tokens: Array<{ info: string }>, idx: number, ...rest: unknown[]) => string;
const rules = marpit.markdown.renderer.rules as { fence: FenceRule };
const fallback = rules.fence;
rules.fence = (tokens, idx, ...rest) =>
  tokens[idx]!.info.trim() === 'silverpoint'
    ? '<figure class="sp-deck-chart" data-sp-slot="s2-c1"></figure>\n'
    : fallback(tokens, idx, ...rest);

const { html, css } = marpit.render(MARKDOWN);

function Deck() {
  const host = useRef<HTMLDivElement>(null);
  const [slots, setSlots] = useState<HTMLElement[]>([]);

  useLayoutEffect(() => {
    const root = host.current!;
    root.innerHTML = html;
    const cleanups: Array<() => void> = [];
    if (scaling === 'svg') {
      for (const svg of root.querySelectorAll<SVGElement>('svg[data-marpit-svg]')) {
        svg.style.display = 'block';
        svg.style.width = '100%';
        svg.style.height = 'auto';
      }
      cleanups.push(observe(root));
    } else {
      // One scaled element per slide: the <section> (transform) or the whole <svg> (svg-transform).
      const scaled = scaling === 'transform' ? 'section' : 'svg[data-marpit-svg]';
      for (const box of root.querySelectorAll<HTMLElement>('.sp-slide-box')) {
        box.style.cssText = 'position:relative;overflow:hidden;width:100%;aspect-ratio:16/9';
        const el = box.querySelector<HTMLElement>(scaled)!;
        el.style.transformOrigin = '0 0';
        if (scaling === 'svg-transform') { el.setAttribute('width', '1280'); el.setAttribute('height', '720'); el.style.display = 'block'; }
      }
      const ro = new ResizeObserver(() => {
        const k = root.clientWidth / 1280;
        for (const s of root.querySelectorAll<HTMLElement>(scaled)) s.style.transform = `scale(${k})`;
      });
      ro.observe(root);
      cleanups.push(() => ro.disconnect());
    }
    setSlots([...root.querySelectorAll<HTMLElement>('[data-sp-slot]')]);
    return () => cleanups.forEach((c) => c());
  }, []);

  useLayoutEffect(() => {
    if (slots.length === 0) return;
    void document.fonts.ready.then(() => {
      requestAnimationFrame(() => {
        (window as unknown as { __poc: unknown }).__poc = { ready: true, scaling };
      });
    });
  }, [slots]);

  return (
    <>
      <style>{css}</style>
      <div ref={host} id="deck" />
      {slots.map((slot) => createPortal(<BarChart id="poc-bar" />, slot, slot.dataset.spSlot))}
    </>
  );
}

createRoot(document.getElementById('app')!).render(<Deck />);
