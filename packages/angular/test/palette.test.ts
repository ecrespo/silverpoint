import '@angular/compiler';
import { Component, type ApplicationRef, type EnvironmentProviders, type Provider } from '@angular/core';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { provideServerRendering, renderApplication } from '@angular/platform-server';
import { provideSilverpoint } from '@silverpoint/angular';
import { SpDashboard, SpDashboardCell } from '@silverpoint/angular/dashboard';
import { SpLineChart } from '@silverpoint/angular/line-chart';
import { SpButton } from '@silverpoint/angular/ui';
import { __setDiagnosticSink, type Palette } from '@silverpoint/core';
import { paletteStyle, sanguine } from '@silverpoint/core/palettes';
import { Window } from 'happy-dom';
import { afterEach, describe, expect, test } from 'vitest';

/*
 * `palette` in Angular (T-212, REQ-461, REQ-462, REQ-468): on every chart and component through the
 * shared bases, on sp-dashboard through its cells, on `provideSilverpoint`, which also scopes a
 * section from a component's `providers`. The core resolves; Angular writes the root's `style`.
 */

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});
cleanup.push(__setDiagnosticSink(() => {}));

const PROVIDER: Palette = { ink: '#111111', text: '#222222' };
const DASHBOARD: Palette = { ink: '#202020', grid: '#606060' };
const OWN: Palette = { ink: '#303030' };

/** A section: a component whose own providers re-colour what it holds. */
const Section = Component({ selector: 'app-section', imports: [SpButton], providers: [provideSilverpoint({ palette: OWN })], template: '<button spButton id="in">In</button>' })(class {});

function ssr(template: string, providers: (Provider | EnvironmentProviders)[] = []): Promise<string> {
  const Page = Component({ selector: 'app-root', imports: [SpDashboard, SpDashboardCell, SpLineChart, SpButton, Section], template })(
    class {
      sanguine = sanguine;
      dashboard = DASHBOARD;
      own = OWN;
    },
  );
  return renderApplication((context: BootstrapContext): Promise<ApplicationRef> => bootstrapApplication(Page, { providers: [provideServerRendering(), ...providers] }, context), {
    document: '<html><head></head><body><app-root></app-root></body></html>',
  });
}
function parse(html: string): Document {
  const window = new Window();
  window.document.write(html);
  return window.document as unknown as Document;
}
const colour = (element: Element | null, property: string) => (element as HTMLElement).style.getPropertyValue(property);
const declarations = (style: string | null) => (style ?? '').split(';').map((d) => d.trim()).filter(Boolean);
/** The app root's markup with every `--sp-` style removed: what a palette may not change (I-25). */
const unstyled = (markup: string) => parse(markup).querySelector('app-root')!.innerHTML.replace(/ style="--sp-[^"]*"/g, '');

describe('Angular palettes (T-212)', () => {
  test('REQ-461 · a chart and a component write their palette on the root, in the core\'s order', async () => {
    const doc = parse(await ssr('<sp-line-chart id="l" [width]="320" [palette]="sanguine" /><button spButton id="b" [palette]="sanguine">Go</button>'));
    const roots = [...doc.querySelectorAll('.sp-root, .sp-ui')];
    expect(roots).toHaveLength(2);
    for (const root of roots) expect(declarations(root.getAttribute('style'))).toEqual(declarations(paletteStyle(sanguine)));
  });

  test('REQ-462 · element → dashboard → provider, field by field, for charts and components alike', async () => {
    const doc = parse(
      await ssr(
        `<sp-dashboard id="ops" title="Ops" [palette]="dashboard">
          <sp-dashboard-cell><sp-line-chart [palette]="own" /></sp-dashboard-cell>
          <sp-dashboard-cell><button spButton>Go</button></sp-dashboard-cell>
        </sp-dashboard>`,
        [provideSilverpoint({ palette: PROVIDER })],
      ),
    );
    const chart = doc.querySelector('.sp-root');
    expect([colour(chart, '--sp-ink'), colour(chart, '--sp-grid'), colour(chart, '--sp-text')]).toEqual(['#303030', '#606060', '#222222']);
    const button = doc.querySelector('.sp-ui');
    expect([colour(button, '--sp-ink'), colour(button, '--sp-grid'), colour(button, '--sp-text')]).toEqual(['#202020', '#606060', '#222222']);
    const section = doc.querySelector('section.sp-dashboard');
    expect([colour(section, '--sp-ink'), colour(section, '--sp-grid'), colour(section, '--sp-text')]).toEqual(['#202020', '#606060', '']);
  });

  test('REQ-462 · provideSilverpoint in a component\'s providers scopes a section, over the app\'s, its ground kept', async () => {
    const doc = parse(await ssr('<button spButton id="out">Out</button><app-section />', [provideSilverpoint({ ground: 'cyanotype', palette: PROVIDER })]));
    const [outer, inner] = [doc.querySelector('#out'), doc.querySelector('#in')];
    expect(inner!.className).toContain('sp-ground-cyanotype');
    expect([colour(outer, '--sp-ink'), colour(inner, '--sp-ink'), colour(inner, '--sp-text')]).toEqual(['#111111', '#303030', '#222222']);
  });

  test('REQ-468 · I-25 · a palette changes only the root\'s style', async () => {
    const plain = await ssr('<sp-line-chart id="l" [width]="320" /><button spButton id="b">Go</button>');
    const toned = await ssr('<sp-line-chart id="l" [width]="320" [palette]="sanguine" /><button spButton id="b" [palette]="sanguine">Go</button>', [provideSilverpoint({ palette: PROVIDER })]);
    expect(unstyled(toned)).not.toBe(parse(toned).querySelector('app-root')!.innerHTML);
    expect(unstyled(toned)).toBe(unstyled(plain));
  });
});
