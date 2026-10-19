import { describe, expect, test } from 'vitest';
import { uiOverlaySync, type UiOverlayElement } from '../src/ui';

/*
 * uiOverlaySync (T-215, REQ-491, REQ-492, REQ-502): the one call that opens or closes a native
 * overlay as its state says, after mount; shared by the three adapters, as uiAnchor is.
 */

function dialog(open = false) {
  const calls: string[] = [];
  const element = {
    open,
    showModal: () => (calls.push('showModal'), (element.open = true)),
    show: () => (calls.push('show'), (element.open = true)),
    close: () => (calls.push('close'), (element.open = false)),
    matches: () => false,
  };
  return { element: element as unknown as UiOverlayElement, calls };
}

function popover(shown = false, api = true) {
  const calls: string[] = [];
  let open = shown;
  const element = {
    ...(api
      ? {
          showPopover: () => (calls.push('showPopover'), (open = true)),
          hidePopover: () => (calls.push('hidePopover'), (open = false)),
        }
      : {}),
    matches: (selector: string) => {
      if (selector !== ':popover-open') throw new Error('unexpected selector');
      return open;
    },
  };
  return { element: element as unknown as UiOverlayElement, calls };
}

describe('uiOverlaySync (T-215)', () => {
  test('REQ-491 · a modal dialog opens with showModal(), a non-modal one with show(), and closes with close()', () => {
    const modal = dialog();
    uiOverlaySync(modal.element, 'modal', true);
    uiOverlaySync(modal.element, 'modal', false);
    const plain = dialog();
    uiOverlaySync(plain.element, 'dialog', true);
    expect(modal.calls).toEqual(['showModal', 'close']);
    expect(plain.calls).toEqual(['show']);
  });

  test('REQ-502 · a dialog already in the asked state is left alone (no InvalidStateError, no second close event)', () => {
    const open = dialog(true);
    uiOverlaySync(open.element, 'modal', true);
    const closed = dialog(false);
    uiOverlaySync(closed.element, 'modal', false);
    expect([...open.calls, ...closed.calls]).toEqual([]);
  });

  test('REQ-492 · a popover is shown and hidden through the Popover API, only when its state differs', () => {
    const p = popover();
    uiOverlaySync(p.element, 'popover', true);
    uiOverlaySync(p.element, 'popover', true);
    uiOverlaySync(p.element, 'popover', false);
    uiOverlaySync(p.element, 'popover', false);
    expect(p.calls).toEqual(['showPopover', 'hidePopover']);
  });

  test('REQ-492 · without the Popover API nothing is called and nothing throws', () => {
    const p = popover(false, false);
    expect(() => uiOverlaySync(p.element, 'popover', true)).not.toThrow();
  });

  test('REQ-492 · an engine that cannot parse :popover-open reads it as hidden', () => {
    const calls: string[] = [];
    const element = {
      showPopover: () => calls.push('show'),
      hidePopover: () => calls.push('hide'),
      matches: () => {
        throw new SyntaxError('unknown pseudo-class');
      },
    } as unknown as UiOverlayElement;
    uiOverlaySync(element, 'popover', true);
    uiOverlaySync(element, 'popover', false);
    expect(calls).toEqual(['show']);
  });
});
