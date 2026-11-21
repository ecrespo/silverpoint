/** T-301 · options and DOM events (REQ-639). */
import { describe, expect, test, vi } from 'vitest';
import { livePoint } from '../../../../tools/testing/interaction-cases';
import { mount } from '../../src/client/index';
import { host, key, layOut, pointer } from './helpers';

describe('events', () => {
  test('REQ-639 · sp-activechange and sp-select bubble, are composed, are not cancelable, and carry the item', () => {
    const target = host();
    const changes: CustomEvent[] = [];
    const selects: CustomEvent[] = [];
    document.addEventListener('sp-activechange', (e) => changes.push(e as CustomEvent));
    document.addEventListener('sp-select', (e) => selects.push(e as CustomEvent));
    const handle = mount(target, { chart: 'line-chart', width: 320 });
    handle.element.focus();
    key(handle.element, 'Enter');
    expect(changes.at(-1)?.detail).toMatchObject({ index: 0 });
    expect(changes.at(-1)).toMatchObject({ bubbles: true, composed: true, cancelable: false });
    expect(selects.at(-1)?.detail).toMatchObject({ index: 0 });
    expect(changes.at(-1)?.target).toBe(target);
  });

  test('REQ-639 · leaving dispatches sp-activechange with detail null', () => {
    const target = host();
    const seen: unknown[] = [];
    target.addEventListener('sp-activechange', (e) => seen.push((e as CustomEvent).detail));
    const handle = mount(target, { chart: 'line-chart', width: 320 });
    layOut(target);
    const { x, y } = livePoint(target);
    pointer(handle.element, 'pointermove', x, y);
    handle.element.dispatchEvent(new PointerEvent('pointerleave'));
    expect(seen.at(-1)).toBeNull();
  });

  test('REQ-639 · onDiagnostic and sp-diagnostic receive the warnings of a render', () => {
    const target = host();
    const onDiagnostic = vi.fn();
    const seen: unknown[] = [];
    target.addEventListener('sp-diagnostic', (e) => seen.push((e as CustomEvent).detail));
    mount(target, { chart: 'bar-chart', data: [] }, { onDiagnostic });
    expect(onDiagnostic).toHaveBeenCalledWith(expect.objectContaining({ code: 'SP001', severity: 'warn' }));
    expect(seen).toContainEqual(expect.objectContaining({ code: 'SP001' }));
  });
});
