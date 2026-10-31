/**
 * Phase 10a PoC (REQ-617, REQ-618, REQ-580). Each case records its measurements to
 * test-results/poc/<engine>.jsonl so poc.md cites numbers, not a pass/fail.
 */
import { appendFileSync, mkdirSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const WIDTHS = [480, 960, 1600];
const SCALINGS = ['svg', 'transform', 'svg-transform'] as const;

function record(engine: string, row: object) {
  mkdirSync('test-results/poc', { recursive: true });
  appendFileSync(`test-results/poc/${engine}.jsonl`, `${JSON.stringify(row)}\n`);
  console.log(engine, JSON.stringify(row));
}

async function open(page: Page, query: string, width: number) {
  await page.setViewportSize({ width, height: 1400 });
  await page.goto(`/?${query}`);
  await page.waitForFunction(() => (window as any).__poc?.ready);
}

for (const scaling of SCALINGS) {
  for (const W of WIDTHS) {
    test(`${scaling} @ ${W}px: slide geometry, chart hit-testing, click and keyboard`, async ({ page, browserName }) => {
      await open(page, `scaling=${scaling}`, W);
      const m = await page.evaluate(() => {
        const deck = document.getElementById('deck')!;
        const W = deck.clientWidth;
        const k = W / 1280;
        // Slide 2 holds the chart. Under inline SVG a slide is one <section> per foreignObject
        // unless it has advanced backgrounds; slides 1 and 2 have none.
        const section = deck.querySelectorAll('section')[1]!.getBoundingClientRect();
        // Slide 3: `![bg left:40%]` — Marpit's advanced background exists only under inline SVG.
        const bgFigure = deck.querySelector('section[data-marpit-advanced-background="background"] figure');
        const bgRect = bgFigure?.getBoundingClientRect();
        const fig = document.querySelector('[data-sp-slot]')!.getBoundingClientRect();
        const svg = document.querySelector<SVGSVGElement>('[data-sp-slot] svg')!;
        const svgRect = svg.getBoundingClientRect();
        const marks = [...svg.querySelectorAll<SVGPathElement>('path[data-role="encoding"]')];
        const fig2 = document.querySelector('[data-sp-slot]')!;
        let inChart = 0;
        for (const p of marks) {
          const r = p.getBoundingClientRect();
          const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.75);
          if (el && fig2.contains(el)) inChart++;
        }
        // The first series' bars, in order: a real click on each must select that datum.
        const points = marks.slice(0, 4).map((p) => { const r = p.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.75 }; });
        return {
          W, k: +k.toFixed(4),
          slide: { w: +section.width.toFixed(2), h: +section.height.toFixed(2), errW: +Math.abs(section.width - W).toFixed(2), errH: +Math.abs(section.height - W * 9 / 16).toFixed(2) },
          figure: { errLeft: +Math.abs(fig.left - (section.left + 80 * k)).toFixed(2), errW: +Math.abs(fig.width - 1120 * k).toFixed(2) },
          chart: { layoutWidth: Number(svg.getAttribute('width')), errRenderedW: +Math.abs(svgRect.width - 1120 * k).toFixed(2) },
          elementFromPointInChart: `${inChart}/${marks.length}`, points,
          splitBackground: bgRect ? { widthRatio: +(bgRect.width / W).toFixed(3) } : 'absent',
        };
      });
      const clicks: string[] = [];
      for (const pt of m.points) {
        await page.mouse.click(pt.x, pt.y);
        clicks.push((await page.locator('[data-sp-slot] [aria-live]').textContent()) ?? '');
      }
      const clickFocused = await page.evaluate(() => !!document.activeElement?.closest('[data-sp-slot]'));
      await page.locator('[data-sp-slot] .sp-root').focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      const live = await page.locator('[data-sp-slot] [aria-live]').textContent();
      const focusRing = await page.evaluate(() => {
        const ring = document.querySelector('[data-sp-slot] [data-role="focus"], [data-sp-slot] [part~="sp-focus"]');
        if (!ring) return null;
        const r = ring.getBoundingClientRect(), f = document.querySelector('[data-sp-slot]')!.getBoundingClientRect();
        return { insideFigure: r.left >= f.left - 1 && r.right <= f.right + 1 && r.top >= f.top - 1 && r.bottom <= f.bottom + 1, w: +r.width.toFixed(1) };
      });
      const row = { scaling, ...m, points: undefined, clicks, clickFocused, live, focusRing };
      record(browserName, row);
      await page.locator('section').nth(1).screenshot({ path: `test-results/poc/${browserName}-${scaling}-${W}.png` });

      expect.soft(m.slide.errW, 'slide width = container').toBeLessThanOrEqual(1);
      expect.soft(m.slide.errH, 'slide keeps 16:9').toBeLessThanOrEqual(1);
      expect.soft(m.figure.errLeft, 'figure at its scaled place').toBeLessThanOrEqual(2);
      expect.soft(m.figure.errW, 'figure scaled').toBeLessThanOrEqual(2);
      expect.soft(m.chart.layoutWidth, 'chart measures the canvas width, not the scaled one').toBe(1120);
      expect.soft(m.chart.errRenderedW, 'chart scaled with the slide').toBeLessThanOrEqual(2);
      expect.soft(m.elementFromPointInChart, 'every mark hit-tests into the chart').toBe('8/8');
      expect.soft(clicks.map((c) => c.split(',')[0]), 'a click on bar i selects datum i').toEqual(['x Q1', 'x Q2', 'x Q3', 'x Q4']);
      expect.soft(clickFocused, 'a real click on a mark focuses the chart').toBe(true);
      expect.soft(live, 'the keyboard model runs inside the slide').toMatch(/value/);
      expect.soft(m.splitBackground, 'bg left:40% splits the slide (REQ-588)').toEqual({ widthRatio: 0.4 });
    });
  }

  test(`${scaling}: slides ignore the host root font size, and EB Garamond loads`, async ({ page, browserName }) => {
    const h1 = async (q: string) => {
      await open(page, q, 960);
      return page.evaluate(() => {
        const h = document.querySelectorAll('section h1')[1]!;
        return { h: +h.getBoundingClientRect().height.toFixed(2), font: getComputedStyle(h).fontFamily, loaded: document.fonts.check('500 64px "EB Garamond"') };
      });
    };
    const base = await h1(`scaling=${scaling}`);
    const rem10 = await h1(`scaling=${scaling}&rem=10`);
    record(browserName, { scaling, test: 'rem+font', base, rem10 });
    expect.soft(rem10.h).toBe(base.h);
    expect.soft(base.loaded).toBe(true);
  });
}
