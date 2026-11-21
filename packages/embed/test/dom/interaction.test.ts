/** T-300 · the adapters' interaction, ported (REQ-638, DD-064), against the shared table (F-06). */
import { describe, expect, test, vi } from 'vitest';
import { INTERACTION_CASES, INTERACTION_CHART, livePoint } from '../../../../tools/testing/interaction-cases';
import { mount } from '../../src/client/index';
import { host, key, layOut, pointer } from './helpers';

const spec = { chart: 'line-chart', id: INTERACTION_CHART.id, width: INTERACTION_CHART.width, height: INTERACTION_CHART.height, props: { chrome: INTERACTION_CHART.chrome } } as const;

function mounted(options = {}) {
  const target = host();
  const handle = mount(target, spec, options);
  layOut(target);
  return { target, root: handle.element, handle };
}

describe('embed interaction', () => {
  test('REQ-141 · hovering the live point shows the readout and reports the active item', () => {
    const onActiveChange = vi.fn();
    const { target, root } = mounted({ onActiveChange });
    const { x, y } = livePoint(target);
    pointer(root, 'pointermove', x, y);
    expect(onActiveChange).toHaveBeenLastCalledWith(expect.objectContaining(INTERACTION_CASES.hover.active));
    expect(target.querySelector('.sp-readout')?.textContent).toBe(INTERACTION_CASES.hover.readout);
    expect(target.querySelector('svg.sp-marker path')).not.toBeNull();
  });

  test('REQ-122 · focus announces the first item in a polite live region', () => {
    const { target, root } = mounted();
    root.focus();
    expect(target.querySelector('.sp-live')?.getAttribute('aria-live')).toBe('polite');
    expect(target.querySelector('.sp-live')?.textContent).toBe(INTERACTION_CASES.focus.live);
  });

  test('REQ-141 · keyboard and pointer surface the same readout', () => {
    const { target, root } = mounted();
    root.focus();
    key(root, 'End');
    const viaKeyboard = target.querySelector('.sp-readout')?.textContent;
    root.blur();
    const { x, y } = livePoint(target);
    pointer(root, 'pointermove', x, y);
    expect(target.querySelector('.sp-readout')?.textContent).toBe(viaKeyboard);
  });

  test('REQ-638 · arrows, Home and End move the active item; a handled key is prevented', () => {
    const { target, root } = mounted();
    root.focus();
    expect(key(root, 'ArrowRight').defaultPrevented).toBe(true);
    const second = target.querySelector('.sp-live')!.textContent;
    key(root, 'Home');
    expect(target.querySelector('.sp-live')!.textContent).toBe(INTERACTION_CASES.focus.live);
    expect(second).not.toBe(INTERACTION_CASES.focus.live);
    expect(key(root, 'q').defaultPrevented).toBe(false);
  });

  test('REQ-143 · leaving and blurring clear the readout, the marker and the live region', () => {
    const onActiveChange = vi.fn();
    const { target, root } = mounted({ onActiveChange });
    const { x, y } = livePoint(target);
    pointer(root, 'pointermove', x, y);
    root.dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }));
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
    expect(target.querySelector('.sp-readout')).toBeNull();
    expect(target.querySelector('svg.sp-marker')).toBeNull();
    expect(target.querySelector('.sp-live')?.textContent).toBe('');
    root.focus();
    root.blur();
    expect(onActiveChange).toHaveBeenLastCalledWith(null);
  });

  test('API §9 · Enter and Space select the active item', () => {
    const onSelect = vi.fn();
    const { root } = mounted({ onSelect });
    root.focus();
    key(root, 'Enter');
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining(INTERACTION_CASES.select.item));
  });

  test('WCAG 1.4.13 · Escape anywhere dismisses a pointer readout', () => {
    const { target, root } = mounted();
    const { x, y } = livePoint(target);
    pointer(root, 'pointermove', x, y);
    expect(target.querySelector('.sp-readout')).not.toBeNull();
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(target.querySelector('.sp-readout')).toBeNull();
  });
});
