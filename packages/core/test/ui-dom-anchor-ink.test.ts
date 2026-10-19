// @vitest-environment happy-dom
import { afterEach, describe, expect, test } from 'vitest';
import { TIMELINE_FRAMES, TIMELINE_TONES, timelineInk } from '../src/timeline';
import { uiAnchor } from '../src/ui';

afterEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

type Rect = { x: number; y: number; width: number; height: number };
function measured(element: HTMLElement, rect: Rect): { set(next: Rect): void } {
  let current = rect;
  element.getBoundingClientRect = () => ({ ...current, top: current.y, left: current.x, right: current.x + current.width, bottom: current.y + current.height, toJSON: () => ({}) }) as DOMRect;
  return { set: (next) => (current = next) };
}

function overlay(dir?: 'rtl') {
  const host = document.createElement('div');
  if (dir) host.setAttribute('dir', dir);
  const trigger = document.createElement('button');
  const floating = document.createElement('div');
  host.append(trigger, floating);
  document.body.append(host);
  const anchor = measured(trigger, { x: 100, y: 100, width: 80, height: 30 });
  measured(floating, { x: 0, y: 0, width: 120, height: 40 });
  return { trigger, floating, anchor };
}
const at = (floating: HTMLElement) => [floating.style.getPropertyValue('--sp-ui-x'), floating.style.getPropertyValue('--sp-ui-y'), floating.getAttribute('data-side')];

describe('uiAnchor (T-205)', () => {
  test('REQ-493 · writes --sp-ui-x, --sp-ui-y in px and data-side, with offset 6 and padding 8 by default', () => {
    const { trigger, floating } = overlay();
    uiAnchor(trigger, floating, { side: 'bottom', align: 'center' });
    expect(at(floating)).toEqual(['80px', '136px', 'bottom']);
  });

  test('REQ-493 · the offset and padding options are passed through', () => {
    const { trigger, floating } = overlay();
    uiAnchor(trigger, floating, { side: 'bottom', align: 'start', offset: 10 });
    expect(at(floating)).toEqual(['100px', '140px', 'bottom']);
    const other = overlay();
    other.anchor.set({ x: 0, y: 100, width: 20, height: 30 });
    uiAnchor(other.trigger, other.floating, { side: 'bottom', align: 'center', padding: 20 });
    expect(at(other.floating)[0]).toBe('20px');
  });

  test('REQ-523 · the direction is the nearest dir: in rtl, end is the left side and flips to start', () => {
    const { trigger, floating } = overlay('rtl');
    uiAnchor(trigger, floating, { side: 'end', align: 'center' });
    expect(at(floating)).toEqual(['186px', '95px', 'start']);
  });

  test('REQ-493 · it re-places on resize, on window scroll and on the scroll of any scroller', () => {
    const { trigger, floating, anchor } = overlay();
    uiAnchor(trigger, floating, { side: 'bottom', align: 'center' });
    anchor.set({ x: 200, y: 100, width: 80, height: 30 });
    window.dispatchEvent(new Event('resize'));
    expect(at(floating)[0]).toBe('180px');
    anchor.set({ x: 300, y: 100, width: 80, height: 30 });
    window.dispatchEvent(new Event('scroll'));
    expect(at(floating)[0]).toBe('280px');
    anchor.set({ x: 400, y: 100, width: 80, height: 30 });
    trigger.parentElement!.dispatchEvent(new Event('scroll'));
    expect(at(floating)[0]).toBe('380px');
  });

  test('REQ-493 · the cleanup removes the listeners', () => {
    const { trigger, floating, anchor } = overlay();
    const cleanup = uiAnchor(trigger, floating, { side: 'bottom', align: 'center' });
    cleanup();
    anchor.set({ x: 200, y: 100, width: 80, height: 30 });
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('scroll'));
    expect(at(floating)[0]).toBe('80px');
  });
});

/** A timeline surface with its probes; the ground's masks come from a stylesheet, as ui.css gives them. */
function surface(mode: 'ink' | 'precision' = 'ink', css = '') {
  const style = document.createElement('style');
  style.textContent =
    css ||
    `[part='sp-frame'][data-kind='card'] { --sp-ui-mask: url(card.svg); --sp-ui-mask-size: 100% 6px; }
     [part='sp-frame'][data-kind='round'] { --sp-ui-mask: url(round.svg); --sp-ui-mask-position: top; }
     [part='sp-tone'][data-tone='2'] { --sp-ui-tone: url(tone2.svg); --sp-ui-tone-size: 12px 12px; }`;
  document.head.append(style);
  const host = document.createElement('section');
  host.setAttribute('data-mode', mode);
  const probe = document.createElement('span');
  for (const kind of TIMELINE_FRAMES) probe.insertAdjacentHTML('beforeend', `<span part="sp-frame" data-kind="${kind}"></span>`);
  for (const level of TIMELINE_TONES) probe.insertAdjacentHTML('beforeend', `<span part="sp-tone" data-tone="${level}"></span>`);
  host.append(probe);
  document.body.append(host);
  return { host, probe };
}
const prop = (host: HTMLElement, name: string) => host.style.getPropertyValue(name);
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('timelineInk (T-205)', () => {
  test('DD-042 · one probe per frame kind and tonal level', () => {
    expect(TIMELINE_FRAMES).toEqual(['control', 'card', 'round', 'box', 'pill']);
    expect(TIMELINE_TONES).toEqual(['1', '2', '3', '4']);
    expect(Object.isFrozen(TIMELINE_FRAMES) && Object.isFrozen(TIMELINE_TONES)).toBe(true);
  });

  test('REQ-512 · republishes each probe mask, position and size as --sp-kl-*, defaults for unset ones', () => {
    const { host, probe } = surface();
    timelineInk(host, probe);
    expect(prop(host, '--sp-kl-mask-card')).toBe('url(card.svg)');
    expect(prop(host, '--sp-kl-mask-size-card')).toBe('100% 6px');
    expect(prop(host, '--sp-kl-mask-position-card')).toBe('center');
    expect(prop(host, '--sp-kl-mask-round')).toBe('url(round.svg)');
    expect(prop(host, '--sp-kl-mask-position-round')).toBe('top');
    expect(prop(host, '--sp-kl-mask-size-round')).toBe('100% 100%');
    expect(prop(host, '--sp-kl-mask-control')).toBe('none');
    expect(host.getAttribute('data-kl-inked')).toBe('true');
  });

  test('REQ-512 · republishes each tone and its size, none and auto when unset', () => {
    const { host, probe } = surface();
    timelineInk(host, probe);
    expect(prop(host, '--sp-kl-tone-2')).toBe('url(tone2.svg)');
    expect(prop(host, '--sp-kl-tone-size-2')).toBe('12px 12px');
    expect(prop(host, '--sp-kl-tone-1')).toBe('none');
    expect(prop(host, '--sp-kl-tone-size-1')).toBe('auto');
    expect(host.getAttribute('data-kl-toned')).toBe('true');
  });

  test('REQ-512 · in precision every mask is none and the surface is not inked', () => {
    const { host, probe } = surface('precision');
    timelineInk(host, probe);
    for (const kind of TIMELINE_FRAMES) expect(prop(host, `--sp-kl-mask-${kind}`)).toBe('none');
    expect(host.getAttribute('data-kl-inked')).toBe('false');
  });

  test('REQ-512 · with inked false every mask is none', () => {
    const { host, probe } = surface();
    timelineInk(host, probe, false);
    expect(prop(host, '--sp-kl-mask-card')).toBe('none');
    expect(host.getAttribute('data-kl-inked')).toBe('false');
  });

  test('REQ-512 · a ground without masks (weight grounds) leaves every mask none and nothing toned', () => {
    const { host, probe } = surface('ink', '.unrelated { color: red }');
    timelineInk(host, probe);
    for (const kind of TIMELINE_FRAMES) expect(prop(host, `--sp-kl-mask-${kind}`)).toBe('none');
    expect([host.getAttribute('data-kl-inked'), host.getAttribute('data-kl-toned')]).toEqual(['false', 'false']);
  });

  test('REQ-512 · it re-reads when the mode, ground, substrate or frame of the host changes', async () => {
    const { host, probe } = surface('precision');
    timelineInk(host, probe);
    host.setAttribute('data-mode', 'ink');
    await settle();
    expect(prop(host, '--sp-kl-mask-card')).toBe('url(card.svg)');
    host.setAttribute('data-mode', 'precision');
    await settle();
    expect(prop(host, '--sp-kl-mask-card')).toBe('none');
  });

  test('REQ-512 · the cleanup stops re-reading', async () => {
    const { host, probe } = surface('precision');
    timelineInk(host, probe)();
    host.setAttribute('data-mode', 'ink');
    await settle();
    expect(prop(host, '--sp-kl-mask-card')).toBe('none');
  });
});
