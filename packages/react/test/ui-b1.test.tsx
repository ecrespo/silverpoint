import { act, createElement, createRef, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { __setDiagnosticSink, type SpCode } from '@silverpoint/core';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { compareUi } from '../../../tools/svg-normalizer/normalize';
import { canonicalUiMarkup } from '../../../tools/visual-gate/ui-canonical';
import { uiFixtureParts, uiMatrix, type UiFixture } from '../../../tools/visual-gate/ui-matrix';
import { SilverpointProvider } from '../src';
import { SpCard as ServerSpCard } from '../src/server/ui/card';
import { SpDivider as ServerSpDivider } from '../src/server/ui/divider';
import { SpButton, SpCard, SpCheckbox, SpDivider, SpInput, SpSwitch } from '../src/ui';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const undo of cleanup) undo();
  cleanup = [];
  vi.unstubAllGlobals();
});

function capture(): SpCode[] {
  const seen: SpCode[] = [];
  cleanup.push(__setDiagnosticSink((code) => seen.push(code)));
  return seen;
}

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
  button: SpButton as never,
  input: SpInput as never,
  checkbox: SpCheckbox as never,
  switch: SpSwitch as never,
  card: SpCard as never,
  divider: SpDivider as never,
};

/** A fixture as a React consumer writes it: uncontrolled, the value as its default. */
export function reactFixture(fixture: UiFixture, components = COMPONENTS) {
  const { props, value, slots } = uiFixtureParts(fixture);
  const bound = value === undefined ? {} : typeof value === 'boolean' ? { defaultChecked: value } : { defaultValue: value };
  return createElement(components[fixture.component]!, { ...props, ...bound, ...(slots.extra ? { extra: slots.extra } : {}) }, slots.content);
}

describe('React B1 markup (T-144)', () => {
  test.each(uiMatrix().filter((f) => f.scope === 'pr'))('REQ-327 · $id is the canonical tree', (fixture) => {
    expect(compareUi(renderToStaticMarkup(reactFixture(fixture)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
  });

  test('REQ-327 · rendering every fixture raises no React warning (attribute names are React\'s own)', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    cleanup.push(() => errors.mockRestore());
    for (const fixture of uiMatrix().filter((f) => f.scope === 'pr')) mount(reactFixture(fixture));
    expect(errors).not.toHaveBeenCalled();
  });

  test('REQ-327 · REQ-104 · the server Card and Divider write the same tree, with no hook', () => {
    const server = { ...COMPONENTS, card: ServerSpCard as never, divider: ServerSpDivider as never };
    for (const fixture of uiMatrix().filter((f) => (f.component === 'card' || f.component === 'divider') && f.scope === 'pr')) {
      expect(compareUi(renderToStaticMarkup(reactFixture(fixture, server)), canonicalUiMarkup(fixture))).toEqual({ equal: true });
    }
  });
});

describe('React B1 behaviour (T-144)', () => {
  test('REQ-322 · an uncontrolled SpInput holds what is typed and reports the value, not the event', () => {
    const onChange = vi.fn();
    const host = mount(<SpInput label="City" defaultValue="Car" onChange={onChange} />);
    const input = host.querySelector('input')!;
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, 'Caracas');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith('Caracas');
    expect(input.value).toBe('Caracas');
  });

  test('REQ-322 · a controlled SpCheckbox reports the next state and shows the given one', () => {
    const onChange = vi.fn();
    const host = mount(<SpCheckbox label="Baseline" checked={false} onChange={onChange} />);
    act(() => host.querySelector('input')!.click());
    expect(onChange).toHaveBeenCalledWith(true);
    expect(host.querySelector('input')!.checked).toBe(false);
  });

  test('REQ-322 · a controlled value is shown as given, whatever the default, and follows the parent', () => {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    cleanup.push(() => {
      act(() => root.unmount());
      host.remove();
    });
    act(() => root.render(<SpCheckbox label="A" checked defaultChecked={false} />));
    expect(host.querySelector('input')!.checked).toBe(true);
    act(() => root.render(<SpCheckbox label="A" checked={false} defaultChecked={false} />));
    expect(host.querySelector('input')!.checked).toBe(false);
  });

  test('REQ-322 · an uncontrolled SpSwitch toggles itself', () => {
    const host = mount(<SpSwitch label="Precision" />);
    act(() => host.querySelector('input')!.click());
    expect(host.querySelector('input')!.checked).toBe(true);
  });

  test('REQ-326 · a disabled control emits no change; a disabled link emits no click', () => {
    const onChange = vi.fn();
    const onClick = vi.fn();
    const host = mount(
      <>
        <SpSwitch label="Precision" disabled onChange={onChange} />
        <SpButton href="/docs" disabled onClick={onClick}>
          Docs
        </SpButton>
      </>,
    );
    act(() => host.querySelector('input')!.click());
    act(() => host.querySelector('a')!.click());
    expect(onChange).not.toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  test('REQ-322 · SpCheckbox sets the native indeterminate property after hydration', () => {
    const host = mount(<SpCheckbox label="All series" indeterminate />);
    expect(host.querySelector('input')!.indeterminate).toBe(true);
  });

  test('REQ-323 · the native inputs submit with a native form', () => {
    const host = mount(
      <form>
        <SpInput name="city" defaultValue="Caracas" label="City" />
        <SpCheckbox name="baseline" label="Baseline" defaultChecked />
        <SpSwitch name="precision" label="Precision" />
      </form>,
    );
    const data = new FormData(host.querySelector('form')!);
    expect(Object.fromEntries(data)).toEqual({ city: 'Caracas', baseline: 'on' });
  });

  test('the ref is the native element', () => {
    const button = createRef<HTMLButtonElement | HTMLAnchorElement>();
    const input = createRef<HTMLInputElement>();
    mount(
      <>
        <SpButton ref={button}>Save</SpButton>
        <SpCheckbox ref={input} label="A" />
      </>,
    );
    expect(button.current?.tagName).toBe('BUTTON');
    expect(input.current?.type).toBe('checkbox');
  });

  test('REQ-319 · a nameless SpButton warns SP018', () => {
    const seen = capture();
    renderToStaticMarkup(<SpButton />);
    expect(seen).toEqual(['SP018']);
  });
});

describe('React B1 configuration (T-143)', () => {
  test('REQ-311 · REQ-333 · the provider grounds components; a prop wins; a dashboard cell sits between', () => {
    const markup = renderToStaticMarkup(
      <SilverpointProvider ground="cyanotype" substrate="green">
        <SpDivider id="a" />
        <SpDivider id="b" substrate="ochre" />
        <SpDivider id="c" dashboardCell={{ chartId: 'c', box: { width: 1, height: 1 }, config: { substrate: 'blue' } }} />
      </SilverpointProvider>,
    );
    const host = document.createElement('div');
    host.innerHTML = markup;
    const [a, b, c] = [...host.querySelectorAll('.sp-ui')];
    expect(a!.className).toContain('sp-ground-cyanotype');
    expect([a, b, c].map((e) => e!.getAttribute('data-substrate'))).toEqual(['green', 'ochre', 'blue']);
  });

  test('REQ-123 · REQ-329 · the server renders `ink`; a forced precision applies after hydration', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener() {}, removeEventListener() {} }));
    expect(renderToStaticMarkup(<SpButton>Save</SpButton>)).toContain('data-mode="ink"');
    const host = mount(<SpButton mode="ink">Save</SpButton>);
    expect(host.querySelector('button')!.getAttribute('data-mode')).toBe('precision');
  });
});
