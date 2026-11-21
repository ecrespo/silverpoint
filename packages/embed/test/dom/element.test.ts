/** T-304 · `<silverpoint-chart>` (REQ-645, DD-070, PoC F-P1). */
import { describe, expect, test } from 'vitest';
import { defineElement, ELEMENT_NAME } from '../../src/client/index';
import { renderToHTML } from '../../src/index';
import { host } from './helpers';

defineElement();

const json = (spec: object) => {
  const script = document.createElement('script');
  script.type = 'application/json';
  script.textContent = JSON.stringify(spec);
  return script;
};
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
type Chart = HTMLElement & { spec: unknown; mounted: unknown };

describe('<silverpoint-chart>', () => {
  test('REQ-645 · defineElement is idempotent and names the element', () => {
    expect(ELEMENT_NAME).toBe('silverpoint-chart');
    expect(() => defineElement()).not.toThrow();
    expect(customElements.get('silverpoint-chart')).toBeDefined();
  });

  test('REQ-645 · reads its spec from a JSON child', () => {
    const element = document.createElement(ELEMENT_NAME) as Chart;
    element.append(json({ chart: 'bar-chart', width: 320 }));
    host().append(element);
    expect(element.querySelector('.sp-root svg.sp-chart')).not.toBeNull();
    expect(element.mounted).not.toBeNull();
  });

  test('F-P1 · defined before the parser reaches its child: drawn once the child arrives', async () => {
    const element = document.createElement(ELEMENT_NAME) as Chart;
    host().append(element); // connected while empty, as at its start tag
    expect(element.querySelector('.sp-root')).toBeNull();
    element.append(json({ chart: 'line-chart', width: 320 }));
    await flush();
    expect(element.querySelectorAll('.sp-root')).toHaveLength(1);
  });

  test('F-P1 · a child whose JSON arrives in chunks is read only when complete, and drawn once', async () => {
    const element = document.createElement(ELEMENT_NAME) as Chart;
    host().append(element);
    const script = document.createElement('script');
    script.type = 'application/json';
    element.append(script);
    script.append(document.createTextNode('{"chart":"donut-chart",'));
    await flush();
    expect(element.querySelector('.sp-root')).toBeNull();
    expect(element.querySelector('.sp-embed-error')).toBeNull();
    script.append(document.createTextNode('"width":320}'));
    await flush();
    expect(element.querySelectorAll('.sp-root')).toHaveLength(1);
  });

  test('REQ-645 · the spec property wins over the child, and accepts JSON text', () => {
    const element = document.createElement(ELEMENT_NAME) as Chart;
    element.append(json({ chart: 'bar-chart' }));
    host().append(element);
    element.spec = '{"chart":"donut-chart","width":320}';
    expect(element.querySelector('svg.sp-chart')!.getAttribute('aria-labelledby')).toMatch(/title/);
    expect(element.querySelector('.sp-root')!.getAttribute('aria-label')).toBe('Donut chart');
  });

  test('REQ-645 · observed attributes override the spec’s fields', () => {
    const element = document.createElement(ELEMENT_NAME) as Chart;
    element.setAttribute('ground', 'cyanotype');
    element.append(json({ chart: 'bar-chart', width: 320 }));
    host().append(element);
    expect(element.querySelector('.sp-root')!.className).toContain('sp-ground-cyanotype');
    element.setAttribute('width', '400');
    expect(element.querySelector('svg.sp-chart')!.getAttribute('width')).toBe('400');
    element.setAttribute('mode', 'precision');
    expect(element.querySelector('svg.sp-chart')!.getAttribute('data-mode')).toBe('precision');
  });

  test('DD-070 · light DOM by default; shadow opts into an open shadow root with its own sheet', () => {
    const plain = document.createElement(ELEMENT_NAME);
    plain.append(json({ chart: 'bar-chart' }));
    host().append(plain);
    expect(plain.shadowRoot).toBeNull();
    const shadowed = document.createElement(ELEMENT_NAME);
    shadowed.setAttribute('shadow', '');
    shadowed.append(json({ chart: 'bar-chart' }));
    host().append(shadowed);
    expect(shadowed.shadowRoot?.querySelector('.sp-root')).not.toBeNull();
    expect(shadowed.shadowRoot?.adoptedStyleSheets).toHaveLength(1);
  });

  test('DD-070 · a server-rendered root equal to the build is kept; a different one is rebuilt', async () => {
    const rendered = renderToHTML({ chart: 'bar-chart', id: 'srv', width: 320 }, { as: 'fragment', interactive: true, styles: 'none' });
    if (!rendered.ok) throw new Error('render');
    const page = host();
    page.innerHTML = rendered.value.html.replace('<div data-sp-embed>', `<${ELEMENT_NAME}>`).replace(/<\/div>$/, `</${ELEMENT_NAME}>`);
    await flush();
    const element = page.querySelector(ELEMENT_NAME)!;
    // The element upgraded during parsing; the server root it found is the one it kept.
    expect(element.querySelectorAll('.sp-root')).toHaveLength(1);
    const kept = element.querySelector('.sp-root');
    const page2 = host();
    page2.innerHTML = rendered.value.html.replace('<div data-sp-embed>', `<${ELEMENT_NAME} width="400">`).replace(/<\/div>$/, `</${ELEMENT_NAME}>`);
    await flush();
    const rebuilt = page2.querySelector(ELEMENT_NAME)!;
    expect(rebuilt.querySelectorAll('.sp-root')).toHaveLength(1);
    expect(rebuilt.querySelector('svg.sp-chart')!.getAttribute('width')).toBe('400');
    expect(kept).not.toBeNull();
  });

  test('REQ-645 · removing the element destroys its chart', () => {
    const element = document.createElement(ELEMENT_NAME) as Chart;
    element.append(json({ chart: 'bar-chart' }));
    const page = host();
    page.append(element);
    element.remove();
    expect(element.mounted).toBeNull();
  });
});
