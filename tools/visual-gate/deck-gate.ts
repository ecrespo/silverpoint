/**
 * The deck gate (T-278, REQ-623): every adapter server-renders every deck fixture over the published
 * builds, as its consumers write it, and each output is compared as a parsed tree with the fixture's
 * committed canonical render (DD-017; the scoped style by its text). Never adapter against adapter.
 *
 * Usage: pnpm --filter @silverpoint/visual-gate deck-gate   (after `pnpm build`)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { compareDeck } from '../svg-normalizer/normalize';
import { deckFixtureProps, deckMarkdown, deckMatrix, type DeckFixture } from './deck-fixtures';
import { FIXTURES_DIR } from './fixtures';
import { ADAPTERS, markupOf, type Adapter, type GateResult } from './string-gate';

type Props = ReturnType<typeof deckFixtureProps>;

/** Server renderers of `SpDeck` over the published builds. */
async function deckRenderers(): Promise<Readonly<Record<Adapter, (props: Props) => Promise<string>>>> {
  await import('@angular/compiler');
  const { Component } = await import('@angular/core');
  const { bootstrapApplication } = await import('@angular/platform-browser');
  const { provideServerRendering, renderApplication } = await import('@angular/platform-server');
  const { SpDeckComponent } = await import('@silverpoint/angular/deck');
  const { SpDeck: ReactDeck } = await import('@silverpoint/react/deck');
  const { SpDeck: VueDeck } = await import('@silverpoint/vue/deck');
  const { createElement } = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { createSSRApp, h } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  return {
    async react(props) {
      return renderToStaticMarkup(createElement(ReactDeck, props));
    },
    async vue(props) {
      return renderToString(createSSRApp({ render: () => h(VueDeck, { ...props }) }));
    },
    async angular(props) {
      const Host = Component({
        selector: 'app-root',
        imports: [SpDeckComponent],
        template: '<sp-deck [markdown]="markdown" [id]="id" [ground]="ground" [mode]="mode" />',
      })(
        class {
          constructor() {
            Object.assign(this, props);
          }
        },
      );
      return renderApplication((context) => bootstrapApplication(Host, { providers: [provideServerRendering()] }, context), {
        document: '<html><head></head><body><app-root></app-root></body></html>',
      });
    },
  };
}

export async function runDeckGate(fixtures: readonly DeckFixture[] = deckMatrix()): Promise<GateResult[]> {
  const renderers = await deckRenderers();
  const results: GateResult[] = [];
  for (const fixture of fixtures) {
    const expected = markupOf(readFileSync(join(FIXTURES_DIR, fixture.canonical), 'utf8'));
    const props = deckFixtureProps(fixture, deckMarkdown(fixture));
    for (const adapter of ADAPTERS as readonly Adapter[]) {
      try {
        const comparison = compareDeck(await renderers[adapter](props), expected);
        results.push(comparison.equal ? { fixture: fixture.id, adapter, equal: true } : { fixture: fixture.id, adapter, ...comparison });
      } catch (error) {
        results.push({ fixture: fixture.id, adapter, equal: false, difference: `render failed: ${(error as Error).message}` });
      }
    }
  }
  return results;
}

async function main(): Promise<void> {
  const results = await runDeckGate();
  for (const r of results) console.log(`${r.equal ? 'ok   ' : 'FAIL '} ${r.adapter.padEnd(8)} ${r.fixture}${r.equal ? '' : `\n      ${r.difference}`}`);
  const failed = results.filter((r) => !r.equal).length;
  console.log(`deck-gate · ${results.length} comparisons · ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (process.argv[1]?.endsWith('deck-gate.ts')) void main();
