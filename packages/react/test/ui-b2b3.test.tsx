import { act, createElement, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiMatrix } from '../../../tools/visual-gate/ui-matrix';
import { SpAlert as ServerSpAlert } from '../src/server/ui/alert';
import { SpBadge as ServerSpBadge } from '../src/server/ui/badge';
import { SpProgress as ServerSpProgress } from '../src/server/ui/progress';
import { SpSkeleton as ServerSpSkeleton } from '../src/server/ui/skeleton';
import { SpSteps as ServerSpSteps } from '../src/server/ui/steps';
import { SpTag as ServerSpTag } from '../src/server/ui/tag';
import {
  SpAlert,
  SpBadge,
  SpProgress,
  SpRadioGroup,
  SpRate,
  SpSegmented,
  SpSkeleton,
  SpSlider,
  SpSteps,
  SpTabPanel,
  SpTabs,
  SpTag,
  type UiItem,
} from '../src/ui';
import { reactFixture } from './ui-fixture';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
});

function mount(element: React.ReactElement): HTMLElement {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(element));
  cleanup.push(() => {
    act(() => root.unmount());
    host.remove();
  });
  return host;
}

const COMPONENTS: Record<string, ComponentType<Record<string, unknown>>> = {
  'radio-group': SpRadioGroup as never,
  segmented: SpSegmented as never,
  tabs: SpTabs as never,
  slider: SpSlider as never,
  rate: SpRate as never,
  steps: SpSteps as never,
  tag: SpTag as never,
  badge: SpBadge as never,
  progress: SpProgress as never,
  alert: SpAlert as never,
  skeleton: SpSkeleton as never,
};
const SERVER: Record<string, ComponentType<Record<string, unknown>>> = {
  steps: ServerSpSteps as never,
  tag: ServerSpTag as never,
  badge: ServerSpBadge as never,
  progress: ServerSpProgress as never,
  alert: ServerSpAlert as never,
  skeleton: ServerSpSkeleton as never,
};
const pr = uiMatrix().filter((f) => f.scope === 'pr' && f.component in COMPONENTS);

describe('React B2 and B3 markup (T-147, T-150)', () => {
  test.each(pr)('REQ-327 · $id is the canonical tree', (fixture) => {
    expect(compareUi(renderToStaticMarkup(reactFixture(fixture, COMPONENTS)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · rendering every fixture raises no React warning', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    cleanup.push(() => errors.mockRestore());
    for (const fixture of pr) mount(reactFixture(fixture, COMPONENTS));
    expect(errors).not.toHaveBeenCalled();
  });

  test('REQ-327 · REQ-104 · the server Steps, Tag, Badge, Progress, Alert and Skeleton write the same tree, with no hook', () => {
    for (const fixture of pr.filter((f) => f.component in SERVER)) {
      expect(compareUi(renderToStaticMarkup(reactFixture(fixture, SERVER)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
    }
  });
});

const grounds: UiItem[] = [
  { key: 'silverpoint', label: 'silverpoint' },
  { key: 'cyanotype', label: 'cyanotype', disabled: true },
  { key: 'burin', label: 'burin' },
];
const radios = (host: HTMLElement) => [...host.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
const key = (target: Element, name: string) => act(() => void target.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true })));

describe('React B2 behaviour (T-147)', () => {
  test('REQ-322 · an uncontrolled SpRadioGroup checks what is clicked and reports the key', () => {
    const onChange = vi.fn();
    const host = mount(<SpRadioGroup items={grounds} name="g" label="Ground" onChange={onChange} />);
    act(() => radios(host)[2]!.click());
    expect(onChange).toHaveBeenCalledWith('burin');
    expect(radios(host).map((r) => r.checked)).toEqual([false, false, true]);
  });

  test('REQ-322 · a controlled SpSegmented reports the key and keeps showing its value', () => {
    const onChange = vi.fn();
    const items = grounds.map((g) => ({ ...g, disabled: false }));
    const host = mount(<SpSegmented items={items} label="Ground" value="silverpoint" onChange={onChange} />);
    act(() => radios(host)[1]!.click());
    expect(onChange).toHaveBeenCalledWith('cyanotype');
    expect(radios(host).map((r) => r.checked)).toEqual([true, false, false]);
  });

  test('REQ-315 · REQ-326 · arrows move and select through the core, skipping a disabled item', () => {
    const onChange = vi.fn();
    const host = mount(<SpRadioGroup items={grounds} name="g" label="Ground" defaultValue="silverpoint" onChange={onChange} />);
    act(() => radios(host)[0]!.focus());
    key(radios(host)[0]!, 'ArrowDown');
    expect(document.activeElement).toBe(radios(host)[2]);
    expect(onChange).toHaveBeenCalledWith('burin');
    expect(onChange).not.toHaveBeenCalledWith('cyanotype');
  });

  test('REQ-315 · SpTabs: automatic activation selects on arrow; its panel shows, the others are hidden', () => {
    const onChange = vi.fn();
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const host = mount(
      <SpTabs id="t" items={items} onChange={onChange}>
        <SpTabPanel value="a">first</SpTabPanel>
        <SpTabPanel value="b">second</SpTabPanel>
      </SpTabs>,
    );
    const tabs = () => [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    const panels = () => [...host.querySelectorAll<HTMLElement>('[role="tabpanel"]')];
    expect(panels().map((p) => p.hidden)).toEqual([false, true]);
    expect(panels()[0]!.getAttribute('aria-labelledby')).toBe('t--tab-a');
    act(() => tabs()[0]!.focus());
    key(tabs()[0]!, 'ArrowRight');
    expect(onChange).toHaveBeenCalledWith('b');
    expect(tabs().map((t) => t.getAttribute('aria-selected'))).toEqual(['false', 'true']);
    expect(panels().map((p) => p.hidden)).toEqual([true, false]);
  });

  test('REQ-315 · SpTabs manual activation moves focus only; a click selects', () => {
    const onChange = vi.fn();
    const items = [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }];
    const host = mount(<SpTabs items={items} activation="manual" onChange={onChange} />);
    const tabs = [...host.querySelectorAll<HTMLButtonElement>('[role="tab"]')];
    act(() => tabs[0]!.focus());
    key(tabs[0]!, 'ArrowRight');
    expect(document.activeElement).toBe(tabs[1]);
    expect(onChange).not.toHaveBeenCalled();
    act(() => tabs[1]!.click());
    expect(onChange).toHaveBeenCalledWith('b');
  });

  test('REQ-322 · SpSlider reports a number; its fraction follows the value', () => {
    const onChange = vi.fn();
    const host = mount(<SpSlider label="Volume" defaultValue={30} onChange={onChange} />);
    const input = host.querySelector<HTMLInputElement>('input[type="range"]')!;
    act(() => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, '55');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(55);
    expect(host.querySelector<HTMLElement>('.sp-slider')!.style.getPropertyValue('--sp-ui-fraction')).toBe('0.55');
  });

  test('REQ-322 · SpRate reports the number clicked; read-only emits nothing and keeps its value', () => {
    const onChange = vi.fn();
    const host = mount(<SpRate label="Quality" defaultValue={2} onChange={onChange} />);
    act(() => radios(host)[3]!.click());
    expect(onChange).toHaveBeenCalledWith(4);
    expect(host.querySelectorAll('[data-filled="true"]')).toHaveLength(4);
    const frozen = vi.fn();
    const readOnly = mount(<SpRate label="Quality" value={3} readOnly onChange={frozen} />);
    act(() => radios(readOnly)[0]!.click());
    expect(frozen).not.toHaveBeenCalled();
    expect(radios(readOnly).map((r) => r.checked)).toEqual([false, false, true, false, false]);
  });

  test('REQ-323 · the radios and the range submit with a native form', () => {
    const host = mount(
      <form>
        <SpRadioGroup items={grounds} name="ground" label="Ground" defaultValue="burin" />
        <SpSegmented items={grounds} name="period" label="Period" defaultValue="silverpoint" />
        <SpSlider label="Volume" name="volume" defaultValue={30} />
        <SpRate label="Quality" name="quality" defaultValue={3} />
      </form>,
    );
    expect(Object.fromEntries(new FormData(host.querySelector('form')!))).toEqual({ ground: 'burin', period: 'silverpoint', volume: '30', quality: '3' });
  });
});

describe('React B3 behaviour (T-150)', () => {
  test('a closable SpTag and SpAlert emit onClose from their close button', () => {
    const onClose = vi.fn();
    const host = mount(
      <>
        <SpTag closable onClose={onClose}>
          review
        </SpTag>
        <SpAlert closable onClose={onClose}>
          done
        </SpAlert>
      </>,
    );
    for (const button of host.querySelectorAll<HTMLButtonElement>('.sp-ui-close')) act(() => button.click());
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(host.querySelector('.sp-ui-close')!.getAttribute('aria-label')).toBe('Remove review');
  });

  test('REQ-318 · SpSteps, SpProgress and SpSkeleton carry their roles', () => {
    const host = mount(
      <>
        <SpSteps items={[{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }]} current={1} />
        <SpProgress label="Upload" value={40} />
        <SpSkeleton />
      </>,
    );
    expect(host.querySelector('[aria-current="step"]')!.textContent).toContain('B');
    expect(host.querySelector('[role="progressbar"]')!.getAttribute('aria-valuenow')).toBe('40');
    expect(host.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
