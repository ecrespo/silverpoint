/** T-305 · `mountAll` (REQ-646). */
import { describe, expect, test } from 'vitest';
import { mountAll } from '../../src/client/index';
import { renderToHTML } from '../../src/index';
import { host } from './helpers';

const box = (spec: object) => {
  const div = document.createElement('div');
  div.setAttribute('data-sp-embed', '');
  const script = document.createElement('script');
  script.type = 'application/json';
  script.textContent = JSON.stringify(spec);
  div.append(script);
  return div;
};

describe('mountAll', () => {
  test('REQ-646 · mounts every [data-sp-embed] holding a JSON spec and returns their handles', () => {
    const page = host();
    page.append(box({ chart: 'bar-chart' }), box({ chart: 'donut-chart' }), document.createElement('div'));
    const handles = mountAll(page);
    expect(handles).toHaveLength(2);
    expect(page.querySelectorAll('.sp-root')).toHaveLength(2);
  });

  test('REQ-646 · idempotent: a second call mounts nothing new', () => {
    const page = host();
    page.append(box({ chart: 'bar-chart' }));
    mountAll(page);
    expect(mountAll(page)).toEqual([]);
    expect(page.querySelectorAll('.sp-root')).toHaveLength(1);
  });

  test('REQ-646 · a box without JSON is skipped', () => {
    const page = host();
    const empty = document.createElement('div');
    empty.setAttribute('data-sp-embed', '');
    page.append(empty);
    expect(mountAll(page)).toEqual([]);
  });

  test('API §4 · a server-rendered root keeps the id the server wrote', () => {
    const page = host();
    const fragment = renderToHTML({ chart: 'line-chart', id: 'srv-1' }, { as: 'fragment', interactive: true, styles: 'none' });
    if (!fragment.ok) throw new Error('render');
    page.innerHTML = fragment.value.html;
    const [handle] = mountAll(page);
    expect(handle!.element.querySelector('desc')!.id).toBe('srv-1-title');
  });
});
