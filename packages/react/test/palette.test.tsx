import { act, createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { __setDiagnosticSink, type Palette, type SpCode } from '@silverpoint/core';
import { paletteStyle, sanguine } from '@silverpoint/core/palettes';
import { afterEach, describe, expect, test } from 'vitest';
import { LineChart, SilverpointProvider, type ChartHandle } from '../src';
import { Dashboard, DashboardCell } from '../src/dashboard';
import { LineChart as ServerLineChart } from '../src/server/line-chart';
import { SpCard as ServerSpCard } from '../src/server/ui/card';
import { SpButton } from '../src/ui';

/*
 * `palette` in React (T-212, REQ-461, REQ-462, REQ-468): on every chart and component through the
 * shared bases, on Dashboard through its cells, on SilverpointProvider; a nested provider scopes a
 * section. The core resolves; React writes the root's `style`.
 */

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});
cleanup.push(__setDiagnosticSink((_code: SpCode) => {}));

const parse = (markup: string) => {
  const host = document.createElement('div');
  host.innerHTML = markup;
  return host;
};
const colour = (element: Element | null, property: string) => (element as HTMLElement).style.getPropertyValue(property);
/** The markup with every root's `style` removed: what a palette may not change (I-33). */
const unstyled = (markup: string) => markup.replace(/ style="--sp-[^"]*"/g, '');

const PROVIDER: Palette = { ink: '#111111', text: '#222222' };
const DASHBOARD: Palette = { ink: '#202020', grid: '#606060' };
const OWN: Palette = { ink: '#303030' };

describe('React palettes (T-212)', () => {
  test('REQ-461 · a chart and a component write their palette on the root, in the core\'s order', () => {
    const host = parse(
      renderToStaticMarkup(
        <>
          <LineChart id="l" width={320} palette={sanguine} />
          <SpButton id="b" palette={sanguine}>Go</SpButton>
          <ServerLineChart id="s" width={320} palette={sanguine} />
          <ServerSpCard id="sc" title="Card" palette={sanguine} />
        </>,
      ),
    );
    const roots = [...host.querySelectorAll('.sp-root, .sp-ui')];
    expect(roots).toHaveLength(4);
    for (const root of roots) expect(root.getAttribute('style')).toBe(paletteStyle(sanguine));
  });

  test('REQ-462 · element → dashboard → provider, field by field, for charts and components alike', () => {
    const host = parse(
      renderToStaticMarkup(
        <SilverpointProvider palette={PROVIDER}>
          <Dashboard id="ops" title="Ops" palette={DASHBOARD}>
            <DashboardCell>
              <LineChart palette={OWN} />
            </DashboardCell>
            <DashboardCell>
              <SpButton>Go</SpButton>
            </DashboardCell>
          </Dashboard>
        </SilverpointProvider>,
      ),
    );
    const chart = host.querySelector('.sp-root');
    expect([colour(chart, '--sp-ink'), colour(chart, '--sp-grid'), colour(chart, '--sp-text')]).toEqual(['#303030', '#606060', '#222222']);
    const button = host.querySelector('.sp-ui');
    expect([colour(button, '--sp-ink'), colour(button, '--sp-grid'), colour(button, '--sp-text')]).toEqual(['#202020', '#606060', '#222222']);
    // The section carries its own palette: a Server Component reads no provider (DD-037, as amended).
    const section = host.querySelector('section.sp-dashboard');
    expect([colour(section, '--sp-ink'), colour(section, '--sp-grid'), colour(section, '--sp-text')]).toEqual(['#202020', '#606060', '']);
  });

  test('REQ-462 · a nested provider scopes a section: its palette over the outer one, the outer ground kept', () => {
    const host = parse(
      renderToStaticMarkup(
        <SilverpointProvider ground="cyanotype" palette={PROVIDER}>
          <SpButton id="out">Out</SpButton>
          <SilverpointProvider palette={OWN}>
            <SpButton id="in">In</SpButton>
          </SilverpointProvider>
        </SilverpointProvider>,
      ),
    );
    const [outer, inner] = [host.querySelector('#out'), host.querySelector('#in')];
    expect(inner!.className).toContain('sp-ground-cyanotype');
    expect([colour(outer, '--sp-ink'), colour(inner, '--sp-ink'), colour(inner, '--sp-text')]).toEqual(['#111111', '#303030', '#222222']);
  });

  test('REQ-468 · I-33 · a palette changes only the root\'s style', () => {
    const plain = renderToStaticMarkup(
      <>
        <LineChart id="l" width={320} />
        <SpButton id="b">Go</SpButton>
      </>,
    );
    const toned = renderToStaticMarkup(
      <SilverpointProvider palette={PROVIDER}>
        <LineChart id="l" width={320} palette={sanguine} />
        <SpButton id="b" palette={sanguine}>Go</SpButton>
      </SilverpointProvider>,
    );
    expect(toned).not.toBe(plain);
    expect(unstyled(toned)).toBe(plain);
  });

  test('REQ-461 · toSVGString carries the palette on its <svg>', () => {
    const ref = createRef<ChartHandle>();
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    act(() => root.render(<LineChart ref={ref} id="l" width={320} palette={OWN} />));
    cleanup.push(() => {
      act(() => root.unmount());
      host.remove();
    });
    expect(ref.current!.toSVGString()).toMatch(/^<svg [^>]*style="--sp-ink:#303030"/);
  });
});
