/** T-299 · mount, update, destroy, handles, ids (REQ-636, REQ-642). */
import { toSVGString } from '@silverpoint/grounds';
import { describe, expect, test, vi } from 'vitest';
import { mount } from '../../src/client/index';
import { renderSpec } from '../../src/index';
import { host, key } from './helpers';

describe('ChartMount', () => {
  test('REQ-636 · the root is a child of the target, after its JSON child, and the target is marked', () => {
    const target = host();
    const json = document.createElement('script');
    json.type = 'application/json';
    json.textContent = '{"chart":"bar-chart"}';
    target.append(json);
    const handle = mount(target, { chart: 'bar-chart' });
    expect(target.firstElementChild).toBe(json);
    expect(handle.element.parentElement).toBe(target);
    expect(handle.element.classList.contains('sp-root')).toBe(true);
    expect(target.hasAttribute('data-sp-embed')).toBe(true);
    expect(target.getAttribute('data-sp-embed-state')).toBe('mounted');
  });

  test('API §4 · ids sp-embed-<n> count mounts in order; a spec id wins', () => {
    const a = mount(host(), { chart: 'bar-chart' });
    const b = mount(host(), { chart: 'bar-chart' });
    const n = Number(a.element.querySelector('desc')!.id.match(/sp-embed-(\d+)/)![1]);
    expect(b.element.querySelector('desc')!.id).toBe(`sp-embed-${n + 1}-title`);
    expect(mount(host(), { chart: 'bar-chart', id: 'mine' }).element.querySelector('desc')!.id).toBe('mine-title');
  });

  test('REQ-642 · update redraws in place, keeping focus and the active item where it still exists', () => {
    const target = host();
    const handle = mount(target, { chart: 'line-chart', width: 320, id: 'u' });
    handle.element.focus();
    key(handle.element, 'ArrowRight');
    const before = target.querySelector('.sp-live')!.textContent;
    const root = handle.element;
    handle.update({ chart: 'line-chart', width: 400, id: 'u' });
    expect(handle.element).toBe(root);
    expect(document.activeElement).toBe(root);
    expect(target.querySelector('.sp-live')!.textContent).toBe(before);
    expect(target.querySelector('svg.sp-chart')!.getAttribute('width')).toBe('400');
  });

  test('REQ-642 · destroy removes the root, every listener and every observer', () => {
    const target = host();
    const added = vi.spyOn(EventTarget.prototype, 'addEventListener');
    const removed = vi.spyOn(EventTarget.prototype, 'removeEventListener');
    const handle = mount(target, { chart: 'bar-chart' });
    const listeners = added.mock.calls.length;
    handle.destroy();
    expect(removed.mock.calls.length).toBe(listeners);
    expect(target.querySelector('.sp-root')).toBeNull();
    expect(target.hasAttribute('data-sp-embed-state')).toBe(false);
    added.mockRestore();
    removed.mockRestore();
  });

  test('getGeometry and toSVGString return the chart’s, standalone on request', () => {
    const handle = mount(host(), { chart: 'donut-chart', id: 'g', width: 320 });
    const reference = renderSpec({ chart: 'donut-chart', id: 'g', width: 320 });
    if (!reference.ok) throw new Error('render');
    expect(handle.getGeometry()).toEqual(reference.value.geometry);
    expect(handle.toSVGString()).toBe(toSVGString(reference.value));
    expect(handle.toSVGString({ standalone: true })).toMatch(/^<svg[^>]*><style>/);
  });
});
