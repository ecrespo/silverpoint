// @vitest-environment happy-dom
import { Component, provideZonelessChangeDetection, signal, type ApplicationRef } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { SpDeckComponent } from '@silverpoint/angular/deck';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareSvg } from '../../../tools/svg-normalizer/normalize';

/* Angular `<sp-deck>` in the browser (T-275; REQ-593, REQ-598, REQ-606, REQ-610, REQ-611, REQ-613). */

const fence = '```silverpoint\n{"chart":"donut-chart","props":{"title":"Share"}}\n```';
const MD = `# Opening\n\n<!-- Say hi -->\n\n${fence}\n\n---\n\n## Middle\n\n* a\n* b\n\n---\n\n# End`;

let app: ApplicationRef | undefined;
afterEach(() => {
  app?.destroy();
  app = undefined;
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

interface Host {
  readonly md: ReturnType<typeof signal<string>>;
  readonly page: ReturnType<typeof signal<number | undefined>>;
  readonly shown: ReturnType<typeof signal<boolean>>;
  readonly notes: ReturnType<typeof signal<boolean>>;
  readonly pages: unknown[];
  readonly fragments: unknown[];
  readonly readies: unknown[];
}

/** Boots an app around one `<sp-deck>`, its markdown and page in signals the test can set. */
async function mount(attrs = '', initial: { page?: number } = {}): Promise<Host> {
  let instance!: Host;
  document.body.innerHTML = '<app-root></app-root>';
  const root = Component({
    selector: 'app-root',
    imports: [SpDeckComponent],
    template: `@if (shown()) {<sp-deck [markdown]="md()" [page]="page()" (pageChange)="pages.push($event)" (fragmentChange)="fragments.push($event)" (ready)="readies.push($event)" ${attrs} />}`,
  })(
    class {
      readonly md = signal(MD);
      readonly page = signal<number | undefined>(initial.page);
      readonly shown = signal(true);
      readonly notes = signal(true);
      readonly pages: unknown[] = [];
      readonly fragments: unknown[] = [];
      readonly readies: unknown[] = [];
      constructor() {
        instance = this as unknown as Host;
      }
    },
  );
  app = await bootstrapApplication(root, { providers: [provideZonelessChangeDetection()] });
  await app.whenStable();
  await settle();
  await app.whenStable();
  return instance;
}

const deck = () => document.querySelector<HTMLElement>('.sp-deck')!;
const stable = async () => {
  await settle();
  await app!.whenStable();
};
const key = async (k: string) => {
  deck().dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  await stable();
};
const hydrated = (slot: string) =>
  vi.waitFor(() => expect(document.querySelector(`[data-sp-slot="${slot}"]`)!.hasAttribute('data-sp-hydrated')).toBe(true), { timeout: 5000 });

describe('<sp-deck> in the browser (Angular)', () => {
  test('REQ-598 · REQ-606 · uncontrolled: keys move the deck and the outputs carry plain objects', async () => {
    const host = await mount();
    expect(host.readies).toEqual([{ total: 3 }]);
    await key('ArrowRight');
    expect(host.pages.at(-1)).toEqual({ page: 2, total: 3 });
    expect(host.fragments.at(-1)).toEqual({ page: 2, step: 0, steps: 2 });
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    expect(document.querySelector('[data-sp-slide="2"]')!.hasAttribute('data-sp-current')).toBe(true);
    expect(document.querySelector('[data-sp-slide="1"]')!.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('.sp-deck-status')!.textContent).toBe('Slide 2 of 3');
    await key('ArrowRight');
    expect(document.querySelector('[data-sp-slide="2"] [data-marpit-fragment="1"]')!.hasAttribute('data-sp-pending')).toBe(false);
  });

  test('REQ-598 · controlled: a move asks the parent, and lands when it answers', async () => {
    const host = await mount('', { page: 2 });
    await key('ArrowLeft');
    expect(host.pages.at(-1)).toEqual({ page: 1, total: 3 });
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    host.page.set(1);
    await stable();
    expect(deck().getAttribute('data-sp-page')).toBe('1');
  });

  test('REQ-613 · the control buttons drive the deck', async () => {
    await mount();
    document.querySelector<HTMLButtonElement>('[data-sp-action="next"]')!.click();
    await stable();
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    document.querySelector<HTMLButtonElement>('[data-sp-action="overview"]')!.click();
    await stable();
    expect(deck().getAttribute('data-sp-overview')).toBe('true');
    expect(document.querySelectorAll('.sp-deck-thumb')).toHaveLength(3);
  });

  test('REQ-607 · showNotes opens the current slide’s notes; the input closes them again', async () => {
    const host = await mount('[showNotes]="notes()"');
    expect(document.querySelector('.sp-deck-notes')!.textContent).toBe('Say hi');
    host.notes.set(false);
    await stable();
    expect(document.querySelector('.sp-deck-notes')).toBeNull();
  });

  test('REQ-593 · each slot hydrates with the Angular chart, once, in place of the static one', async () => {
    await mount();
    await hydrated('s1-c1');
    const slot = document.querySelector('[data-sp-slot="s1-c1"]')!;
    expect(slot.querySelectorAll('sp-donut-chart')).toHaveLength(1);
    expect(slot.querySelectorAll('.sp-root')).toHaveLength(1);
    // A page move re-renders the deck, not the slide's content: the live chart stays.
    const chart = slot.querySelector('sp-donut-chart');
    await key('ArrowRight');
    await key('ArrowLeft');
    expect(document.querySelector('[data-sp-slot="s1-c1"] sp-donut-chart')).toBe(chart);
  });

  test('Art. 3 · REQ-593 · the hydrated chart draws the static chart’s tree', async () => {
    await mount('[interactive]="false"');
    const staticSvg = document.querySelector('[data-sp-slot="s1-c1"] svg.sp-chart')!.outerHTML;
    app!.destroy();
    app = undefined;
    await mount();
    await hydrated('s1-c1');
    await stable();
    expect(compareSvg(document.querySelector('[data-sp-slot="s1-c1"] svg.sp-chart')!.outerHTML, staticSvg)).toEqual({ equal: true });
  });

  test('REQ-594 · interactive false keeps the static chart', async () => {
    await mount('[interactive]="false"');
    await stable();
    const slot = document.querySelector('[data-sp-slot="s1-c1"]')!;
    expect(slot.hasAttribute('data-sp-hydrated')).toBe(false);
    expect(slot.querySelectorAll('sp-donut-chart')).toHaveLength(0);
    expect(slot.querySelectorAll('.sp-root')).toHaveLength(1);
  });

  test('REQ-610 · new markdown re-renders, re-hydrates and keeps the page, clamped', async () => {
    const host = await mount();
    await key('End');
    expect(deck().getAttribute('data-sp-page')).toBe('3');
    host.md.set(`# New\n\n${fence}\n\n---\n\n# Two`);
    await stable();
    await hydrated('s1-c1');
    await stable();
    expect(deck().getAttribute('data-sp-page')).toBe('2');
    expect(host.readies.at(-1)).toEqual({ total: 2 });
    expect(document.querySelectorAll('.sp-deck-slide')).toHaveLength(2);
    expect(document.querySelectorAll('[data-sp-slot="s1-c1"] .sp-root')).toHaveLength(1);
    // The root view and the new chart's: the old chart's view was detached, not left behind.
    expect(app!.viewCount).toBe(2);
  });

  test('REQ-611 · removing the deck leaves nothing on document or window, and destroys the chart', async () => {
    // The listeners added while the deck lives; one removed is gone. Others predate the test.
    const live = new Set<unknown>();
    for (const target of [document, window] as EventTarget[]) {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      vi.spyOn(target, 'addEventListener').mockImplementation((...a: Parameters<EventTarget['addEventListener']>) => (live.add(a[1]), add(...a)));
      vi.spyOn(target, 'removeEventListener').mockImplementation((...a: Parameters<EventTarget['removeEventListener']>) => (live.delete(a[1]), remove(...a)));
    }
    const host = await mount('[hash]="true"');
    await hydrated('s1-c1');
    expect(live.size).toBeGreaterThan(0);
    // The chart's view hangs off the application: the root's and the chart's.
    expect(app!.viewCount).toBe(2);
    host.shown.set(false);
    await stable();
    expect(document.querySelector('.sp-deck')).toBeNull();
    expect(live.size).toBe(0);
    expect(app!.viewCount).toBe(1);
  });
});
